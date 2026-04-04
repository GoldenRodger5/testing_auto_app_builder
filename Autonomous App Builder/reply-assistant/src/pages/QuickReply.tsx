import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Zap, Sparkles } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useConversations } from '@/hooks/useConversations'
import { generateReplies } from '@/lib/claude'
import { Button, Card, Badge, Spinner, Textarea, ErrorState } from '@/components/ui'
import type { Contact, ConversationSummary } from '@/types'
import { getInitialColor } from '@/lib/utils'

const LOADING_MESSAGES = [
  'Reading between the lines...',
  'Thinking about {name}...',
  'Crafting different strategies...',
  'Drafting your options...',
]

export default function QuickReply() {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const { getContact } = useContacts()
  const { getContactHistory, createConversation, saveDrafts, getContactConversations } = useConversations()

  const [contact, setContact] = useState<Contact | null>(null)
  const [history, setHistory] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [theirMessage, setTheirMessage] = useState('')
  const [userGoal, setUserGoal] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')

  useEffect(() => {
    async function load() {
      if (!contactId) return
      setLoading(true)

      const { data: c, error: cErr } = await getContact(contactId)
      if (cErr || !c) {
        setError(cErr || 'Contact not found')
        setLoading(false)
        return
      }
      setContact(c)

      const hist = await getContactHistory(contactId, 5)
      setHistory(hist)

      const { data: convos } = await getContactConversations(contactId)
      if (convos && convos.length > 0) {
        setUserGoal(convos[0].user_goal || '')
      }

      setLoading(false)
    }
    load()
  }, [contactId])

  useEffect(() => {
    if (!generating) return
    let i = 0
    const name = contact?.name || 'them'
    setLoadingMsg(LOADING_MESSAGES[0].replace('{name}', name))
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i].replace('{name}', name))
    }, 2500)
    return () => clearInterval(interval)
  }, [generating, contact])

  const handleGenerate = async () => {
    if (!contact || !theirMessage.trim() || !userGoal.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const { data: convo, error: convoErr } = await createConversation({
        contact_id: contact.id,
        their_message: theirMessage,
        user_goal: userGoal,
      })

      if (convoErr || !convo) throw new Error(convoErr || 'Failed to create conversation')

      const replies = await generateReplies({
        contactName: contact.name,
        relationshipType: contact.relationship_type,
        relationshipNotes: contact.relationship_notes,
        conversationHistory: history,
        preferredTone: contact.preferred_reply_tone,
        theirMessage,
        userGoal,
        contextNotes: null,
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

  if (error && !generating) {
    return <div className="p-5 lg:p-8"><ErrorState description={error} onRetry={() => window.location.reload()} /></div>
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
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h1 className="font-display text-lg font-bold">Quick Reply</h1>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <Card className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: getInitialColor(contact?.name || '?') }}
        >
          <span className="font-semibold text-sm text-white/90">
            {contact?.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <span className="font-medium text-sm">{contact?.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="default">{contact?.relationship_type}</Badge>
            {contact?.preferred_reply_tone && (
              <span className="text-xs text-text-muted">Tone: {contact.preferred_reply_tone}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Their message */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Paste their message</label>
        <Textarea
          value={theirMessage}
          onChange={(e) => setTheirMessage(e.target.value)}
          placeholder="What did they say?"
          className="min-h-[120px]"
          autoResize
          autoFocus
        />
      </div>

      {/* Goal */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">What do you want to achieve?</label>
        <Textarea
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          placeholder="e.g. Decline politely, Set a boundary..."
          autoResize
        />
      </div>

      {/* Generate */}
      <Button
        size="lg"
        className="w-full btn-press"
        disabled={!theirMessage.trim() || !userGoal.trim()}
        onClick={handleGenerate}
      >
        <Sparkles className="w-4 h-4 mr-2" /> Generate Replies
      </Button>
    </div>
  )
}
