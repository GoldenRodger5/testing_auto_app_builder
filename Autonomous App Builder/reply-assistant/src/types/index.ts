export type AudienceMode = 'personal' | 'freelancer' | 'business' | 'dating'

export interface Profile {
  id: string
  display_name: string | null
  primary_audience: AudienceMode | 'all' | null
  style_examples: string[] | null
  subscription_tier: 'free' | 'monthly' | 'annual' | 'lifetime' | null
  subscription_expires_at: string | null
  monthly_reply_count: number
  reply_count_reset_at: string | null
  onboarding_complete: boolean
  created_at: string
}

export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string | null
  business_type: string | null
  description: string | null
  refund_policy: string | null
  cancellation_policy: string | null
  preferred_tone: 'warm' | 'professional' | 'friendly' | null
  faq_pairs: Array<{ question: string; answer: string }>
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  relationship_type: string
  relationship_notes: string | null
  preferred_reply_tone: string | null
  contact_audience: AudienceMode | null
  // Dating fields
  dating_platform: 'tinder' | 'hinge' | 'bumble' | 'other' | null
  dating_interests: string[] | null
  dating_status: 'chatting' | 'date_planned' | 'inactive' | null
  match_date: string | null
  // Communication analytics
  communication_style_summary: string | null
  avg_message_length: number | null
  questions_per_message: number | null
  engagement_signal: 'high' | 'medium' | 'low' | 'pulling_back' | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  contact_id: string
  their_message: string
  user_goal: string
  context_notes: string | null
  selected_reply: string | null
  outcome_notes: string | null
  deleted_at: string | null
  follow_up_count: number
  last_follow_up_at: string | null
  audience_context: AudienceMode | null
  energy_read: Record<string, unknown> | null
  created_at: string
  contact?: Contact
}

export interface ReplyDraft {
  id: string
  conversation_id: string
  tone_label: string
  tone_description: string
  content: string
  created_at: string
}

export interface ConversationSummary {
  their_message_preview: string
  selected_reply_preview: string | null
  tone_used: string | null
  outcome: string | null
  date: string
}

export interface EnergyRead {
  avgMessageLength: number
  questionsPerMessage: number
  engagementSignal: 'high' | 'medium' | 'low' | 'pulling_back'
  suggestedReplyLength: 'short' | 'match' | 'medium'
  observation: string
}

export interface GenerateRepliesParams {
  contactName: string
  relationshipType: string
  relationshipNotes: string | null
  conversationHistory: ConversationSummary[]
  preferredTone: string | null
  theirMessage: string | null
  userGoal: string
  contextNotes: string | null
  // Extended v3 params
  audienceContext?: AudienceMode
  styleExamples?: string[]
  messageScreenshot?: string | null
  contextScreenshots?: string[]
  screenshotMimeType?: string
  energyRead?: EnergyRead | null
  datingPlatform?: string | null
  datingInterests?: string[] | null
  businessProfile?: BusinessProfile | null
  mode?: 'replies' | 'profile_analysis' | 'follow_up'
  followUpCount?: number
  daysSinceOriginal?: number
}

export interface GeneratedReply {
  tone_label: string
  tone_description: string
  content: string
}

export type RelationshipType = 'Manager' | 'Partner' | 'Friend' | 'Client' | 'Colleague' | 'Family' | 'Acquaintance' | 'Match' | 'Other'

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'Manager', 'Partner', 'Friend', 'Client', 'Colleague', 'Family', 'Acquaintance', 'Match', 'Other'
]

// Legacy fallback chips — replaced by audience-specific chips from goalChips.ts
export const GOAL_CHIPS = [
  'Set a boundary',
  'Decline politely',
  'Buy time',
  'Patch things up',
  'Get information',
  'Negotiate',
  'Apologize',
  'Clarify something',
]
