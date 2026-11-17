/**
 * POST /api/analyze
 *
 * Server-only Gemini call. The key is read from GEMINI_API_KEY at runtime and is
 * never returned, logged or bundled into the client. The document itself is
 * forwarded to Gemini and then discarded — nothing is written to storage.
 *
 * Local development: `vercel dev` serves this route. `vite dev` does not.
 */
import {
  RESPONSE_SCHEMA,
  buildPrompt,
  sanitizeAnalysis,
  validateText,
} from '../src/lib/analysis.ts'

type ApiRequest = {
  method?: string
  body?: unknown
  headers: Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string }
}

type ApiResponse = {
  status(code: number): ApiResponse
  setHeader(name: string, value: string): void
  json(body: unknown): void
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
const UPSTREAM_TIMEOUT_MS = 25_000

/** Best-effort, per-instance limiter: serverless instances do not share memory. */
const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 12
const hits = new Map<string, number[]>()

function clientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const first = raw?.split(',')[0]?.trim()
  return first || req.socket?.remoteAddress || 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) hits.clear()

  return recent.length > MAX_REQUESTS
}

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function stripFences(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Use POST for analysis.' })
    return
  }

  if (isRateLimited(clientIp(req))) {
    res.setHeader('Retry-After', '600')
    res.status(429).json({
      error: 'Too many analyses from this address. Wait a few minutes and try again.',
    })
    return
  }

  const payload = parseBody(req.body) as { text?: unknown } | null
  const validation = validateText(payload?.text)
  if (!validation.ok) {
    res.status(400).json({ error: validation.error })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(503).json({
      error: 'AI analysis is not configured on this deployment. Add GEMINI_API_KEY and redeploy.',
    })
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(validation.text) }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
        signal: controller.signal,
      },
    )

    if (upstream.status === 429) {
      res.status(429).json({
        error: 'The AI service is busy right now. Wait a minute and try again.',
      })
      return
    }

    if (!upstream.ok) {
      res.status(502).json({
        error: 'The AI service could not analyze that document. Try again in a moment.',
      })
      return
    }

    const data = (await upstream.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const raw = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part?.text ?? '')
      .join('')

    if (!raw.trim()) {
      res.status(502).json({ error: 'The AI returned an empty response. Try again.' })
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(stripFences(raw))
    } catch {
      res.status(502).json({
        error: 'The AI returned an unreadable response. Try again with a shorter document.',
      })
      return
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(sanitizeAnalysis(parsed, validation.text))
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({
        error: 'The analysis took too long. Try again, or use a shorter document.',
      })
      return
    }
    res.status(502).json({
      error: 'The AI service could not be reached. Check the connection and try again.',
    })
  } finally {
    clearTimeout(timeout)
  }
}
