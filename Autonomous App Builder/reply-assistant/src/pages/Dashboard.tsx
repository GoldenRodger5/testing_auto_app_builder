import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PenLine, MessageSquare, Clock, ArrowRight, CheckCircle2, Bell, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { Button, Card, Badge, EmptyState, ConversationCardSkeleton } from '@/components/ui'
import { OutcomeNudgeBadge, OutcomeModal } from '@/components/OutcomeNudge'
import { PaywallModal } from '@/components/PaywallModal'
import { getGreeting, timeAgo, truncate, getInitialColor } from '@/lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { conversations, loading, addOutcomeNotes } = useConversations()
  const [outcomeConvoId, setOutcomeConvoId] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const recent = conversations.slice(0, 10)

  const isFollowUpEligible = (convo: typeof conversations[0]) => {
    if (convo.outcome_notes || !convo.selected_reply) return false
    if ((convo.follow_up_count || 0) >= 3) return false
    const daysSince = (Date.now() - new Date(convo.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 5) return false
    if (convo.last_follow_up_at) {
      const daysSinceFollowUp = (Date.now() - new Date(convo.last_follow_up_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceFollowUp < 3) return false
    }
    return true
  }

  const handleSaveOutcome = async (conversationId: string, notes: string) => {
    await addOutcomeNotes(conversationId, notes)
    setOutcomeConvoId(null)
  }

  const getStatusBadge = (convo: typeof conversations[0]) => {
    if (convo.outcome_notes) {
      return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1 inline" />Resolved</Badge>
    }
    if (convo.selected_reply) {
      return <OutcomeNudgeBadge onClick={() => setOutcomeConvoId(convo.id)} />
    }
    return <Badge variant="default">Pending</Badge>
  }

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Outcome modal */}
      {outcomeConvoId && (
        <OutcomeModal conversationId={outcomeConvoId} onSave={handleSaveOutcome} />
      )}

      {/* Paywall modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger="limit"
        repliesUsed={profile?.monthly_reply_count ?? 0}
      />

      {/* Greeting */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {getGreeting()}, {profile?.display_name || 'there'}
            </h1>
            <p className="text-sm text-text-secondary">What do you need to reply to?</p>
          </div>
          {/* Free tier usage counter */}
          {profile?.subscription_tier === 'free' && (
            <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
              <span className="text-xs text-text-muted">
                {profile.monthly_reply_count || 0}/5 replies
              </span>
              {(profile.monthly_reply_count || 0) >= 4 && (
                <button
                  onClick={() => setShowPaywall(true)}
                  className="flex items-center gap-1 text-xs text-accent underline hover:no-underline transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3" /> Upgrade
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Reply CTA */}
      <Button size="lg" className="w-full btn-press shadow-glow" onClick={() => navigate('/reply/new')}>
        <PenLine className="w-4 h-4 mr-2" /> New Reply
      </Button>

      {/* Recent conversations */}
      <div className="space-y-3">
        {/* Only show header when conversations exist */}
        {recent.length > 0 && (
          <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">
            Recent Conversations
          </h2>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 50}ms` }} className="card-enter">
                <ConversationCardSkeleton />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title="No replies yet"
            description="Your replies will appear here. Who do you need to respond to?"
            action={{ label: 'New Reply', onClick: () => navigate('/reply/new') }}
          />
        ) : (
          <div className="space-y-2">
            {recent.map((convo, i) => (
              <div key={convo.id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
                <Card
                  hoverable
                  onClick={() => navigate(`/reply/${convo.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: getInitialColor(convo.contact?.name || '?') }}
                    >
                      <span className="font-semibold text-sm text-white/90">
                        {convo.contact?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + badge row */}
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">{convo.contact?.name || 'Unknown'}</span>
                        {convo.contact?.relationship_type && (
                          <Badge variant="default">{convo.contact.relationship_type}</Badge>
                        )}
                      </div>

                      {/* Message preview */}
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{truncate(convo.their_message, 100)}</p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" /> {timeAgo(convo.created_at)}
                        </span>
                        {getStatusBadge(convo)}
                        {isFollowUpEligible(convo) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/reply/continue/${convo.id}`) }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            <Bell className="w-2.5 h-2.5" /> Follow up?
                          </button>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted shrink-0 mt-3" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
