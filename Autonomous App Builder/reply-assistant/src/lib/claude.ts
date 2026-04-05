import type { GenerateRepliesParams, GeneratedReply } from '../types'
import { supabase } from './supabase'

export class ClaudeAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'ClaudeAPIError'
  }
}

function parseResponse(text: string): GeneratedReply[] {
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  const parsed = JSON.parse(cleaned)
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

async function callGenerateAPI(body: Record<string, unknown>): Promise<unknown> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new ClaudeAPIError('You must be signed in to generate replies.', 401)
  }

  const { data, error } = await supabase.functions.invoke('generate-replies', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error) {
    const errData = data as { error?: string } | null
    if (errData?.error === 'free_limit_reached') throw new ClaudeAPIError('free_limit_reached', 402)
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new ClaudeAPIError('Authentication failed. Please sign out and sign back in.', 401)
    }
    if (error.message?.includes('FunctionsFetchError') || error.message?.includes('Failed to fetch') || error.message?.includes('not found')) {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (response.status === 429) throw new ClaudeAPIError('Claude is busy — wait a moment and try again', 429)
      if (!response.ok) throw new ClaudeAPIError(`Failed to generate: ${await response.text().catch(() => '')}`, response.status)
      return response.json()
    }
    throw new ClaudeAPIError(error.message || 'Failed to call generate function')
  }

  return data
}

export async function generateReplies(params: GenerateRepliesParams): Promise<GeneratedReply[]> {
  const body: Record<string, unknown> = {
    contactName: params.contactName,
    relationshipType: params.relationshipType,
    relationshipNotes: params.relationshipNotes,
    conversationHistory: params.conversationHistory,
    preferredTone: params.preferredTone,
    theirMessage: params.theirMessage,
    userGoal: params.userGoal,
    contextNotes: params.contextNotes,
    audienceContext: params.audienceContext || 'personal',
    styleExamples: params.styleExamples || [],
    mode: params.mode || 'replies',
  }

  if (params.messageScreenshot) {
    body.messageScreenshot = params.messageScreenshot
    body.screenshotMimeType = params.screenshotMimeType || 'image/jpeg'
  }
  if (params.contextScreenshots?.length) body.contextScreenshots = params.contextScreenshots
  if (params.energyRead) body.energyRead = params.energyRead
  if (params.datingPlatform) body.datingPlatform = params.datingPlatform
  if (params.datingInterests) body.datingInterests = params.datingInterests
  if (params.businessProfile) body.businessProfile = params.businessProfile
  if (params.followUpCount !== undefined) body.followUpCount = params.followUpCount
  if (params.daysSinceOriginal !== undefined) body.daysSinceOriginal = params.daysSinceOriginal

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const data = await callGenerateAPI(body) as Record<string, unknown>
      const text = (data.content as Array<{ text: string }>)?.[0]?.text || (data as { text?: string }).text || ''
      return parseResponse(text)
    } catch (err) {
      if (err instanceof ClaudeAPIError && (err.statusCode === 429 || err.statusCode === 402)) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt === 0) continue
    }
  }
  throw new ClaudeAPIError(lastError?.message || 'Failed to generate replies after 2 attempts.')
}

export async function analyzeProfile(screenshot: string, mimeType = 'image/jpeg'): Promise<{
  interests: string[]
  job: string | null
  bio_signals: string[]
  prompts: string[]
}> {
  const data = await callGenerateAPI({ mode: 'profile_analysis', messageScreenshot: screenshot, screenshotMimeType: mimeType }) as Record<string, unknown>
  const text = (data.content as Array<{ text: string }>)?.[0]?.text || ''
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { interests: [], job: null, bio_signals: [], prompts: [] }
  }
}

export { parseResponse }
