import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { generateReplies } from '@/lib/claude'
import { Button, Card, Badge, Spinner, Textarea, ErrorState } from '@/components/ui'
import type { Conversation, ConversationSummary } from '@/types'
import { truncate } from '@/lib/utils'

const LOADING_MESSAGES = [
  'Reading the full thread...',
  'Understanding the context...',
  'Crafting your follow-up...',
  'Almost ready...',
]

export default function ContinueConversation() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { getConversation, getContactHistory, createConversation, saveDrafts } = useConversations()

  const [parentConvo, setParentConvo] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [theirReply, setTheirReply] = useState('')
  const [userGoal, setUserGoal] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')

  useEffect(() => {
    async function load() {
      if (!conversationId) return
      setLoading(true)
      const { data: convo, error: err } = await getConversation(conversationId)
      if (err || !convo) {
        setError(err || 'Conversation not found')
        setLoading(false)
        return
      }
      setParentConvo(convo)
      setLoading(false)
    }
    load()
  }, [conversationId])

  useEffect(() => {
    if (!generating) return
    let i = 0
    setLoadingMsg(LOADING_MESSAGES[0])
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i])
    }, 2500)
    return () => clearInterval(interval)
  }, [generating])

  const handleGenerate = async () => {
    if (!parentConvo || !parentConvo.contact || !theirReply.trim() || !userGoal.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const history = await getContactHistory(parentConvo.contact_id, 5)
      const contact = parentConvo.contact

      const { data: convo, error: convoErr } = await createConversation({
        contact_id: contact.id,
        their_message: theirReply,
        user_goal: userGoal,
        context_notes: `CONTINUATION of previous thread. Previous exchange: They said: "${truncate(parentConvo.their_message, 200)}" → I replied: "${truncate(parentConvo.selected_reply || '', 200)}" → Now they replied again (see their_message).`,
      })

      if (convoErr || !convo) throw new Error(convoErr || 'Failed to create conversation')

      const threadHistory: ConversationSummary[] = [
        {
          their_message_preview: parentConvo.their_message.slice(0, 100),
          selected_reply_preview: parentConvo.selected_reply?.slice(0, 100) ?? null,
          tone_used: null,
          outcome: parentConvo.outcome_notes ?? null,
          date: parentConvo.created_at,
        },
        ...history,
      ]

      const replies = await generateReplies({
        contactName: contact.name,
        relationshipType: contact.relationship_type,
        relationshipNotes: contact.relationship_notes,
        conversationHistory: threadHistory,
        preferredTone: contact.preferred_reply_tone,
        theirMessage: theirReply,
        userGoal,
        contextNotes: `This is a CONTINUATION of an ongoing conversation. The previous exchange: They originally said: "${truncate(parentConvo.their_message, 300)}" → I replied: "${truncate(parentConvo.selected_reply || '', 300)}" → Now they've replied again with the message above. Continue the thread naturally.`,
      })

      await saveDrafts(convo.id, replies)
      navigate(`/reply/${convo.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="w-6 h-6 text-accent" /></div>
  }

  if (!parentConvo) {
    return <div className="p-5 lg:p-8"><ErrorState description={error || 'Conversation not found'} onRetry={() => navigate('/dashboard')} /></div>
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 p-5 lg:p-8 page-enter">
        {error ? (
          <ErrorState description={error} onRetry={() => { setError(null); handleGenerate() }} />
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-text-primary">{loadingMsg}</p>
              <p className="text-xs text-text-muted">This usually takes 5-10 seconds</p>
            </div>
            <Spinner className="w-5 h-5 text-accent" />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-5 lg:p-8 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h1 className="font-display text-lg font-bold">Continue Conversation</h1>
          </div>
          {parentConvo.contact && (
            <p className="text-xs text-text-muted">with {parentConvo.contact.name}</p>
          )}
        </div>
      </div>

      {/* Previous conversation context */}
      <Card className="space-y-3 opacity-75">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Previous exchange</p>
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-xs text-text-muted">They said:</p>
            <p className="text-sm text-text-secondary leading-relaxed">{truncate(parentConvo.their_message, 200)}</p>
          </div>
          {parentConvo.selected_reply && (
            <div className="space-y-1 pl-3 border-l-2 border-accent/20">
              <p className="text-xs text-text-muted">You replied:</p>
              <p className="text-sm text-text-primary leading-relaxed">{truncate(parentConvo.selected_reply, 200)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Their new reply */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Their response</label>
        <Textarea
          value={theirReply}
          onChange={(e) => setTheirReply(e.target.value)}
          placeholder="Paste what they replied with..."
          className="min-h-[120px]"
          autoResize
          autoFocus
        />
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">What do you want to achieve now?</label>
        <Textarea
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          placeholder="e.g. Close the deal, Agree on next steps..."
          autoResize
        />
      </div>

      {/* Generate */}
      <Button
        size="lg"
        className="w-full btn-press"
        disabled={!theirReply.trim() || !userGoal.trim()}
        onClick={handleGenerate}
      >
        <Sparkles className="w-4 h-4 mr-2" /> Generate Follow-up Replies
      </Button>
    </div>
  )
}
