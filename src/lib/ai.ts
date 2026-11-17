import type { Analysis } from './analysis'

export class AiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiError'
  }
}

/** The endpoint allows 25 s upstream; leave room for network latency. */
const CLIENT_TIMEOUT_MS = 45_000

export async function analyzeText(text: string): Promise<Analysis> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as
      | { error?: unknown; title?: unknown }
      | null

    if (!response.ok) {
      const message =
        payload && typeof payload.error === 'string'
          ? payload.error
          : 'The analysis failed. Please try again.'
      throw new AiError(message)
    }

    if (!payload || typeof payload !== 'object' || typeof payload.title !== 'string') {
      throw new AiError('The analysis returned an unexpected response. Try again.')
    }

    return payload as Analysis
  } catch (error) {
    if (error instanceof AiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AiError('The analysis timed out. Try again with a shorter document.')
    }
    throw new AiError(
      'Could not reach the analysis service. AI analysis needs the server route (vercel dev or the deployed site).',
    )
  } finally {
    window.clearTimeout(timer)
  }
}
