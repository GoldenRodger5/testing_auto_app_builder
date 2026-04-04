import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PenLine, Calendar, CheckCircle2, Zap, MessageCircle } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useConversations } from '@/hooks/useConversations'
import { Button, Card, Badge, Spinner, Textarea, ErrorState } from '@/components/ui'
import { OutcomeNudgeBadge, OutcomeModal } from '@/components/OutcomeNudge'
import { RelationshipReport } from '@/components/RelationshipReport'
import { RELATIONSHIP_TYPES } from '@/types'
import type { Contact, Conversation } from '@/types'
import { timeAgo, truncate, getInitialColor } from '@/lib/utils'

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getContact, updateContact } = useContacts()
  const { getContactConversations, addOutcomeNotes } = useConversations()

  const handleSaveOutcome = async (conversationId: string, notes: string) => {
    await addOutcomeNotes(conversationId, notes)
    setOutcomeConvoId(null)
    const { data: convData } = await getContactConversations(id!)
    setConvos(convData || [])
  }

  const [contact, setContact] = useState<Contact | null>(null)
  const [convos, setConvos] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [editingType, setEditingType] = useState(false)
  const [outcomeConvoId, setOutcomeConvoId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      const { data: c, error: cErr } = await getContact(id)
      if (cErr || !c) {
        setError(cErr || 'Contact not found')
        setLoading(false)
        return
      }
      setContact(c)
      setNotes(c.relationship_notes || '')

      const { data: convData } = await getContactConversations(id)
      setConvos(convData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handleSaveNotes = async () => {
    if (!contact) return
    await updateContact(contact.id, { relationship_notes: notes })
    setContact(prev => prev ? { ...prev, relationship_notes: notes } : null)
    setEditingNotes(false)
  }

  const handleTypeChange = async (type: string) => {
    if (!contact) return
    await updateContact(contact.id, { relationship_type: type })
    setContact(prev => prev ? { ...prev, relationship_type: type } : null)
    setEditingType(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner className="w-6 h-6 text-accent" /></div>
  }

  if (error || !contact) {
    return <ErrorState description={error || 'Contact not found'} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="p-5 lg:p-8 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/contacts')} className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: getInitialColor(contact.name) }}
          >
            <span className="font-semibold text-base text-white/90">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{contact.name}</h1>
            {editingType ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {RELATIONSHIP_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      type === contact.relationship_type
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-card border-border text-text-secondary hover:border-border-focus'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setEditingType(true)} className="cursor-pointer">
                <Badge variant="accent">{contact.relationship_type}</Badge>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preferred Tone */}
      {contact.preferred_reply_tone && (
        <Card className="space-y-1">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Preferred Tone</p>
          <p className="text-sm text-accent font-medium">You tend to reply with a {contact.preferred_reply_tone} tone</p>
        </Card>
      )}

      {/* Relationship Notes */}
      <Card className="space-y-2">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Relationship Notes</p>
        {editingNotes ? (
          <div className="space-y-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell me about this person and your dynamic..."
              autoResize
              charCount={{ current: notes.length, max: 1000 }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} className="btn-press">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingNotes(false); setNotes(contact.relationship_notes || '') }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingNotes(true)} className="text-left w-full cursor-pointer">
            <p className="text-sm text-text-secondary">{contact.relationship_notes || 'Tap to add notes about this person...'}</p>
          </button>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button className="w-full btn-press" onClick={() => navigate('/reply/new', { state: { contactId: contact.id } })}>
          <PenLine className="w-4 h-4 mr-2" /> New Reply from {contact.name}
        </Button>
        {convos.filter(c => c.selected_reply).length >= 2 && (
          <Button variant="secondary" className="w-full btn-press" onClick={() => navigate(`/reply/quick/${contact.id}`)}>
            <Zap className="w-4 h-4 mr-2" /> Quick Reply
          </Button>
        )}
      </div>

      {/* Relationship Report */}
      <RelationshipReport contact={contact} conversations={convos} />

      {/* Outcome modal */}
      {outcomeConvoId && (
        <OutcomeModal conversationId={outcomeConvoId} onSave={handleSaveOutcome} />
      )}

      {/* Conversation History */}
      <div className="space-y-3">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">
          Conversation History ({convos.length})
        </h2>
        {convos.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">No conversations yet</p>
        ) : (
          convos.map((convo, i) => (
            <div key={convo.id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <Card
                hoverable
                onClick={() => navigate(`/reply/${convo.id}`)}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs text-text-muted">{timeAgo(convo.created_at)}</span>
                  </div>
                  {convo.outcome_notes ? (
                    <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1 inline" />Resolved</Badge>
                  ) : convo.selected_reply ? (
                    <OutcomeNudgeBadge onClick={() => setOutcomeConvoId(convo.id)} />
                  ) : (
                    <Badge variant="default">Pending</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-muted">They said:</p>
                  <p className="text-sm text-text-secondary leading-relaxed">{truncate(convo.their_message, 120)}</p>
                </div>
                {convo.selected_reply && (
                  <div className="space-y-1 pl-3 border-l-2 border-accent/20">
                    <p className="text-xs text-text-muted">You replied:</p>
                    <p className="text-sm text-text-primary leading-relaxed">{truncate(convo.selected_reply, 120)}</p>
                  </div>
                )}
                {convo.selected_reply && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/reply/continue/${convo.id}`) }}
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors cursor-pointer pt-1"
                  >
                    <MessageCircle className="w-3 h-3" /> They replied — continue conversation
                  </button>
                )}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
