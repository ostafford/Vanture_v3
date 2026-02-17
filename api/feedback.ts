/**
 * Vercel serverless function: receive feedback from Vantura app and create a GitHub Issue.
 * CORS allows https://ostafford.github.io and http://localhost:5173.
 * Set GITHUB_TOKEN in Vercel environment variables.
 */

const ALLOWED_ORIGINS = [
  'https://ostafford.github.io',
  'http://localhost:5173',
]

const GITHUB_OWNER = 'ostafford'
const GITHUB_REPO = 'Vanture_v3'

const VALID_TYPES = ['bug', 'feature', 'general'] as const
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000

type FeedbackType = (typeof VALID_TYPES)[number]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function jsonResponse(
  data: { success?: boolean; error?: string },
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

function validatePayload(body: unknown): { type: FeedbackType; title: string; description: string } | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Missing or invalid body' }
  }
  const b = body as Record<string, unknown>
  const type = b.type
  const title = b.title
  const description = b.description

  if (typeof type !== 'string' || !VALID_TYPES.includes(type as FeedbackType)) {
    return { error: 'Invalid type: must be bug, feature, or general' }
  }
  if (typeof title !== 'string' || !title.trim()) {
    return { error: 'Title is required' }
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Title must be at most ${MAX_TITLE_LENGTH} characters` }
  }
  if (typeof description !== 'string' || !description.trim()) {
    return { error: 'Description is required' }
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters` }
  }

  return {
    type: type as FeedbackType,
    title: title.trim(),
    description: description.trim(),
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin')
    const headers = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, headers)
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, headers)
    }

    const validated = validatePayload(body)
    if ('error' in validated) {
      return jsonResponse({ error: validated.error }, 400, headers)
    }

    const token = process.env.GITHUB_TOKEN
    if (!token) {
      return jsonResponse(
        { error: 'Feedback service is not configured' },
        503,
        headers
      )
    }

    try {
      const { Octokit } = await import('@octokit/rest')
      const octokit = new Octokit({ auth: token })

      const bodyText = `${validated.description}\n\n---\n*Submitted from Vantura Feedback*`

      await octokit.rest.issues.create({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        title: validated.title,
        body: bodyText,
        labels: ['feedback', validated.type],
      })

      return jsonResponse({ success: true }, 200, headers)
    } catch (err) {
      console.error('GitHub API error:', err)
      return jsonResponse(
        { error: 'Could not submit feedback. Please try again.' },
        500,
        headers
      )
    }
  },
}
