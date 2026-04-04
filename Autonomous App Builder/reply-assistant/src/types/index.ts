export interface Profile {
  id: string
  display_name: string
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  relationship_type: string
  relationship_notes: string | null
  preferred_reply_tone: string | null
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

export interface GenerateRepliesParams {
  contactName: string
  relationshipType: string
  relationshipNotes: string | null
  conversationHistory: ConversationSummary[]
  preferredTone: string | null
  theirMessage: string
  userGoal: string
  contextNotes: string | null
}

export interface GeneratedReply {
  tone_label: string
  tone_description: string
  content: string
}

export type RelationshipType = 'Manager' | 'Partner' | 'Friend' | 'Client' | 'Colleague' | 'Family' | 'Acquaintance' | 'Other'

export const RELATIONSHIP_TYPES: RelationshipType[] = [
  'Manager', 'Partner', 'Friend', 'Client', 'Colleague', 'Family', 'Acquaintance', 'Other'
]

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
