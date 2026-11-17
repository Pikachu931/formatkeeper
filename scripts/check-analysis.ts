/**
 * Run with `npm test`. Covers the analysis contract without calling Gemini:
 * validation (empty, short, over-long, Bengali), sanitizer fallbacks and the
 * endpoint's 405/400/503/429/502/200 paths using a stubbed fetch.
 */
import assert from 'node:assert/strict'
import handler from '../api/analyze.ts'
import {
  MAX_INPUT_CHARS,
  sanitizeAnalysis,
  validateText,
} from '../src/lib/analysis.ts'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockResponse() {
  const state = { statusCode: 0, body: null as unknown, headers: {} as Record<string, string> }
  const res = {
    status(code: number) {
      state.statusCode = code
      return res
    },
    setHeader(name: string, value: string) {
      state.headers[name] = value
    },
    json(body: unknown) {
      state.body = body
    },
  }
  return { res, state }
}

function request(body: unknown, ip: string) {
  return {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': ip },
  }
}

// --- input validation -------------------------------------------------------
assert.equal(validateText('').ok, false, 'empty input must fail')
assert.equal(validateText('   ').ok, false, 'whitespace input must fail')
assert.equal(validateText(42).ok, false, 'non-string input must fail')
assert.equal(validateText('Short note about margin settings.').ok, true, 'short text must pass')
assert.equal(
  validateText('a'.repeat(MAX_INPUT_CHARS + 1)).ok,
  false,
  'over-limit text must fail',
)

const bengali = 'এই প্রতিবেদনটি বাংলায় লেখা। শিরোনাম ও অনুচ্ছেদ থাকবে।'
const bengaliCheck = validateText(bengali)
assert.equal(bengaliCheck.ok, true, 'Bengali text must pass')

// --- sanitizer --------------------------------------------------------------
const defaults = sanitizeAnalysis(null, 'Quarterly Review\n\nRevenue grew 12% this quarter.')
assert.equal(defaults.title, 'Quarterly Review')
assert.equal(defaults.sections.length, 1)
assert.match(defaults.styles.standard.palette.accent, /^#[0-9a-f]{6}$/)
assert.equal(defaults.styles.gorgeous.label, 'Gorgeous Highlighted')

const hostile = sanitizeAnalysis(
  {
    title: '<script>alert(1)</script>',
    sections: Array.from({ length: 40 }, () => ({
      heading: 'H'.repeat(500),
      paragraphs: ['P'],
      bullets: ['B'],
    })),
    keyHighlights: Array.from({ length: 50 }, () => 'K'),
    styles: {
      standard: {
        fonts: { heading: 'Comic Sans; color: red', body: '' },
        fontSizes: { heading: 999, body: 1 },
        palette: { accent: 'red', background: '#FFFFFF' },
        margins: { top: -50, right: 999, bottom: 22, left: 22 },
        rationale: 'x'.repeat(900),
      },
    },
  },
  'Fallback',
)
assert.equal(hostile.sections.length, 24, 'sections must be capped')
assert.ok(hostile.keyHighlights.length <= 10, 'highlights must be capped')
assert.equal(hostile.styles.standard.fontSizes.heading, 36, 'heading size clamps')
assert.equal(hostile.styles.standard.fontSizes.body, 8, 'body size clamps')
assert.equal(hostile.styles.standard.margins.top, 8, 'margin clamps low')
assert.equal(hostile.styles.standard.margins.right, 40, 'margin clamps high')
assert.equal(hostile.styles.standard.palette.accent, defaults.styles.standard.palette.accent)
assert.equal(hostile.styles.standard.palette.background, '#ffffff')
assert.ok(!hostile.styles.standard.fonts.heading.includes(';'), 'fonts strip CSS syntax')
assert.ok(hostile.styles.standard.rationale.length <= 220, 'rationale is truncated')

// --- endpoint ---------------------------------------------------------------
const originalKey = process.env.GEMINI_API_KEY
const originalFetch = globalThis.fetch

const call = handler as unknown as (req: unknown, res: unknown) => Promise<void>

{
  const { res, state } = mockResponse()
  await call({ method: 'GET', headers: {} }, res)
  assert.equal(state.statusCode, 405)
}

{
  const { res, state } = mockResponse()
  await call(request({ text: '' }, 'ip-empty'), res)
  assert.equal(state.statusCode, 400)
  assert.match(String((state.body as { error: string }).error), /Paste or upload/)
}

{
  const { res, state } = mockResponse()
  await call(request({ text: 'a'.repeat(MAX_INPUT_CHARS + 5) }, 'ip-long'), res)
  assert.equal(state.statusCode, 400)
  assert.match(String((state.body as { error: string }).error), /limit is/)
}

delete process.env.GEMINI_API_KEY
{
  const { res, state } = mockResponse()
  await call(request({ text: 'Hello' }, 'ip-nokey'), res)
  assert.equal(state.statusCode, 503)
}

process.env.GEMINI_API_KEY = 'test-key'
process.env.GEMINI_MODEL = 'test-model'

const goodAnalysis = {
  documentType: 'Report',
  title: 'Quarterly Review',
  tone: 'Formal',
  sections: [{ heading: 'Summary', paragraphs: ['Revenue grew 12%.'], bullets: [] }],
  keyHighlights: ['12% growth'],
  styles: {},
}

globalThis.fetch = async () =>
  jsonResponse({
    candidates: [{ content: { parts: [{ text: JSON.stringify(goodAnalysis) }] } }],
  })
{
  const { res, state } = mockResponse()
  await call(request({ text: 'Quarterly review body text.' }, 'ip-ok'), res)
  assert.equal(state.statusCode, 200)
  const body = state.body as { title: string; styles: Record<string, unknown> }
  assert.equal(body.title, 'Quarterly Review')
  assert.ok(body.styles.standard, 'styles fall back to defaults')
}

globalThis.fetch = async () => jsonResponse({ error: 'quota' }, 429)
{
  const { res, state } = mockResponse()
  await call(request({ text: 'Quarterly review body text.' }, 'ip-429'), res)
  assert.equal(state.statusCode, 429)
}

globalThis.fetch = async () =>
  jsonResponse({ candidates: [{ content: { parts: [{ text: 'not json at all' }] } }] })
{
  const { res, state } = mockResponse()
  await call(request({ text: 'Quarterly review body text.' }, 'ip-bad-json'), res)
  assert.equal(state.statusCode, 502)
}

globalThis.fetch = originalFetch
if (originalKey === undefined) delete process.env.GEMINI_API_KEY
else process.env.GEMINI_API_KEY = originalKey
delete process.env.GEMINI_MODEL

// --- rate limit -------------------------------------------------------------
for (let index = 0; index < 13; index += 1) {
  const { res, state } = mockResponse()
  await call(request({ text: '' }, 'ip-rate'), res)
  if (index === 12) assert.equal(state.statusCode, 429, '13th call is rate limited')
}

console.log('Analysis checks passed: validation, sanitization, endpoint and rate limit.')
