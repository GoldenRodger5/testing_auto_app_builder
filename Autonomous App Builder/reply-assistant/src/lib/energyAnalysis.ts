import type { EnergyRead } from '@/types'

/**
 * Analyzes a list of message strings (their side of a conversation)
 * to compute energy metrics for dating mode.
 */
export function analyzeEnergy(messages: string[]): EnergyRead {
  if (messages.length === 0) {
    return {
      avgMessageLength: 0,
      questionsPerMessage: 0,
      engagementSignal: 'low',
      suggestedReplyLength: 'short',
      observation: 'No message history available.',
    }
  }

  // Average word count
  const wordCounts = messages.map(m => m.trim().split(/\s+/).filter(Boolean).length)
  const avgMessageLength = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)

  // Questions per message (count ? characters)
  const questionCounts = messages.map(m => (m.match(/\?/g) || []).length)
  const questionsPerMessage = Math.round((questionCounts.reduce((a, b) => a + b, 0) / messages.length) * 10) / 10

  // Determine engagement signal
  let engagementSignal: EnergyRead['engagementSignal']

  // Check recency trend — if last 2 messages are shorter than the rest, signal pulling_back
  const recent = wordCounts.slice(-2)
  const older = wordCounts.slice(0, -2)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / Math.max(recent.length, 1)
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg

  if (older.length >= 2 && recentAvg < olderAvg * 0.5) {
    engagementSignal = 'pulling_back'
  } else if (avgMessageLength >= 20 || questionsPerMessage >= 1) {
    engagementSignal = 'high'
  } else if (avgMessageLength >= 8 || questionsPerMessage >= 0.3) {
    engagementSignal = 'medium'
  } else {
    engagementSignal = 'low'
  }

  // Suggested reply length
  let suggestedReplyLength: EnergyRead['suggestedReplyLength']
  if (engagementSignal === 'pulling_back' || engagementSignal === 'low') {
    suggestedReplyLength = 'short'
  } else if (engagementSignal === 'high') {
    suggestedReplyLength = 'medium'
  } else {
    suggestedReplyLength = 'match'
  }

  // Human-readable observation
  const observation = buildObservation(avgMessageLength, questionsPerMessage, engagementSignal)

  return { avgMessageLength, questionsPerMessage, engagementSignal, suggestedReplyLength, observation }
}

function buildObservation(
  avgLength: number,
  questionsPerMsg: number,
  signal: EnergyRead['engagementSignal']
): string {
  const lengthDesc = avgLength < 5 ? 'very short' : avgLength < 10 ? 'short' : avgLength < 20 ? 'medium-length' : 'detailed'
  const questionDesc = questionsPerMsg === 0
    ? 'no questions'
    : questionsPerMsg < 0.5
      ? `${questionsPerMsg} questions/msg`
      : `${questionsPerMsg} questions/msg`

  switch (signal) {
    case 'high':
      return `They're engaged — sending ${lengthDesc} messages with ${questionDesc}. Mirror their energy.`
    case 'medium':
      return `They're giving medium effort — ${lengthDesc} messages, ${questionDesc}. Keep it balanced.`
    case 'low':
      return `Low effort — averaging ~${avgLength} words, ${questionDesc}. Keep your reply short and don't over-invest.`
    case 'pulling_back':
      return `Their messages are getting shorter — they may be losing interest. Keep this reply light and give them space.`
    default:
      return `Avg ~${avgLength} words per message, ${questionDesc}.`
  }
}

/**
 * Formats an EnergyRead as a human-readable banner string.
 */
export function formatEnergyBanner(energy: EnergyRead): string {
  return `⚡ Energy read: ${energy.observation} Suggested: ${
    energy.suggestedReplyLength === 'short'
      ? 'Keep your reply short.'
      : energy.suggestedReplyLength === 'medium'
        ? 'A medium-length reply works here.'
        : 'Match their length.'
  }`
}
