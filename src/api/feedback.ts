/**
 * Client for the Vantura feedback API (Vercel serverless).
 * Sends type, title, description; throws on non-2xx.
 */

export interface FeedbackPayload {
  type: string
  title: string
  description: string
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const base = import.meta.env.VITE_FEEDBACK_API_URL
  if (!base || typeof base !== 'string') {
    throw new Error('Feedback API URL is not configured')
  }

  const url = `${base.replace(/\/$/, '')}/api/feedback`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: payload.type,
      title: payload.title.trim(),
      description: payload.description.trim(),
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message =
      typeof data?.error === 'string' ? data.error : 'Could not submit feedback. Please try again.'
    throw new Error(message)
  }
}
