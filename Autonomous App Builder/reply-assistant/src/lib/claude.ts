import type { GenerateRepliesParams, GeneratedReply } from '../types'
import { supabase } from './supabase'

export class ClaudeAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'ClaudeAPIError'
  }
}

function buildPrompt(params: GenerateRepliesParams): { system: string; user: string } {
  const historyText = params.conversationHistory.length > 0
    ? params.conversationHistory.map((c, i) =>
        `${i + 1}. They said: "${c.their_message_preview}" → I replied (${c.tone_used || 'unknown tone'}): "${c.selected_reply_preview || 'no reply selected'}" → Outcome: ${c.outcome || 'not recorded'}`
      ).join('\n')
    : 'This is the first conversation with this contact'

  const system = `You are a communication coach helping someone craft the perfect reply to a message they received.
You know this person well and understand their communication goals.

You always return exactly 3 reply options in valid JSON with this structure:
{
  "replies": [
    {
      "tone_label": "string — one word or short phrase",
      "tone_description": "string — one sentence describing the approach",
      "content": "string — the full reply text, ready to send"
    }
  ]
}

Return only valid JSON. No preamble, no explanation outside the JSON.`

  const user = `ABOUT THE PERSON WHO SENT THIS MESSAGE:
Name: ${params.contactName}
Relationship: ${params.relationshipType}
Context about them: ${params.relationshipNotes || 'No additional context provided'}
Communication history with them: ${historyText}
Typical reply tone I use with them: ${params.preferredTone || 'Not yet established'}

THE MESSAGE I RECEIVED:
${params.theirMessage}

MY GOAL WITH MY REPLY:
${params.userGoal}

ADDITIONAL CONTEXT:
${params.contextNotes || 'None'}

Generate 3 distinct reply options. Make them meaningfully different — different strategies, not just different levels of formality. Each should be complete and ready to send as-is. Do not use placeholder text like [your name].`

  return { system, user }
}

function parseResponse(text: string): GeneratedReply[] {
  const parsed = JSON.parse(text)

  if (!parsed.replies || !Array.isArray(parsed.replies) || parsed.replies.length !== 3) {
    throw new Error('Response must contain exactly 3 replies')
  }

  for (const reply of parsed.replies) {
    if (!reply.tone_label || !reply.tone_description || !reply.content) {
      throw new Error('Each reply must have tone_label, tone_description, and content')
    }
  }

  return parsed.replies
}

/**
 * Calls the generate-replies edge function (production) or falls back
 * to /api/generate Vite proxy (local dev).
 */
async function callGenerateAPI(system: string, user: string): Promise<any> {
  // Try Supabase Edge Function first
  const { data, error } = await supabase.functions.invoke('generate-replies', {
    body: { system, user },
  })

  if (error) {
    // If edge function is not deployed (e.g., local dev), fall back to Vite proxy
    if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Failed to fetch') || error.message?.includes('not found')) {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system, user }),
      })

      if (response.status === 429) {
        throw new ClaudeAPIError('Claude is busy right now — wait a moment and try again', 429)
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => 'Unknown error')
        throw new ClaudeAPIError(`Failed to generate replies: ${errBody}`, response.status)
      }

      return await response.json()
    }

    throw new ClaudeAPIError(error.message || 'Failed to call generate function')
  }

  return data
}

export async function generateReplies(params: GenerateRepliesParams): Promise<GeneratedReply[]> {
  const { system, user } = buildPrompt(params)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callGenerateAPI(system, user)
      const text = data.content?.[0]?.text || data.text || ''

      return parseResponse(text)
    } catch (err) {
      if (err instanceof ClaudeAPIError && err.statusCode === 429) {
        throw err
      }
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === 0) continue
    }
  }

  throw new ClaudeAPIError(
    lastError?.message || 'Failed to generate replies after 2 attempts. Please try again.'
  )
}

export { buildPrompt, parseResponse }
