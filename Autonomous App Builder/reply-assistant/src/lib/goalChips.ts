import type { AudienceMode } from '@/types'

export const goalChips: Record<AudienceMode, string[]> = {
  personal: [
    'Set a boundary',
    'Smooth things over',
    'Say no politely',
    'Buy time',
    'Address the awkward thing',
    'Apologize',
    'Keep it light',
    'Decline the invitation',
    'Express how I feel',
    'Ask for space',
  ],
  freelancer: [
    'Chase payment',
    'Decline scope creep',
    'Decline the project',
    'Set project expectations',
    'Push back on feedback',
    'Respond to unhappy client',
    'Request a testimonial',
    'Negotiate rate',
    'Ask for deadline extension',
    'Confirm project details',
  ],
  business: [
    'Respond to complaint',
    'Process refund request',
    'Decline refund politely',
    'Respond to inquiry',
    'Address a review',
    'Confirm a booking',
    'Answer FAQ',
    'Handle unreasonable customer',
    'Apologize for issue',
    'Request more information',
  ],
  dating: [
    'Write an opener',
    'Keep the conversation going',
    'Match their energy',
    'Suggest meeting up',
    'Recover this conversation',
    'Respond to low effort message',
    'Express interest',
    'Pull back',
    'Ask about their interests',
    'Continue where we left off',
  ],
}

export const audienceConfig: Record<AudienceMode, { icon: string; label: string; description: string; color: string }> = {
  personal: {
    icon: '💬',
    label: 'Personal',
    description: 'Texts, awkward messages, family and friends',
    color: 'text-blue-400',
  },
  freelancer: {
    icon: '💼',
    label: 'Freelance',
    description: 'Client emails, invoices, professional communication',
    color: 'text-violet-400',
  },
  business: {
    icon: '🏪',
    label: 'Business',
    description: 'Customer replies, complaints, reviews',
    color: 'text-amber-400',
  },
  dating: {
    icon: '💕',
    label: 'Dating',
    description: 'Dating app conversations, matching energy, first messages',
    color: 'text-rose-400',
  },
}
