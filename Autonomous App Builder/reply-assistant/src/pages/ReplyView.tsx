import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, CheckCircle, RefreshCw, Sparkles, Pencil, X } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useContacts } from '@/hooks/useContacts'
import { generateReplies } from '@/lib/claude'
import { Button, Card, Badge, Spinner, Textarea, ErrorState } from '@/components/ui'
import type { Conversation, ReplyDraft, GenerateRepliesParams } from '@/types'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function ReplyView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getConversation, getDrafts, selectReply, addOutcomeNotes, saveDrafts, getContactHistory } = useConversations()
  const { updateContact, getContact } = useContacts()

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [drafts, setDrafts] = useState<ReplyDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedDraft, setSelectedDraft] = useState<ReplyDraft | null>(null)
  const [showOutcome, setShowOutcome] = useState(false)
  const [outcomeText, setOutcomeText] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  // Editable drafts state
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Regenerate with guidance state
  const [showGuidance, setShowGuidance] = useState(false)
  const [guidanceText, setGuidanceText] = useState('')
  const [regenCount, setRegenCount] = useState(0)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      const { data: convo, error: convoErr } = await getConversation(id)
      if (convoErr || !convo) {
        setError(convoErr || 'Conversation not found')
        setLoading(false)
        return
      }
      setConversation(convo)

      const { data: draftData } = await getDrafts(id)
      setDrafts(draftData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const handleCopy = async (draft: ReplyDraft) => {
    try {
      await navigator.clipboard.writeText(draft.content)
      setCopiedId(draft.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = draft.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedId(draft.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleStartEdit = (draft: ReplyDraft) => {
    setEditingDraftId(draft.id)
    setEditText(draft.content)
  }

  const handleCancelEdit = () => {
    setEditingDraftId(null)
    setEditText('')
  }

  const handleSaveEdit = async (draft: ReplyDraft) => {
    if (!editText.trim()) return
    await supabase
      .from('reply_drafts')
      .update({ content: editText.trim() })
      .eq('id', draft.id)

    setDrafts(prev => prev.map(d =>
      d.id === draft.id ? { ...d, content: editText.trim() } : d
    ))
    setEditingDraftId(null)
    setEditText('')
  }

  const handleSelectReply = async (draft: ReplyDraft) => {
    if (!conversation) return
    await selectReply(conversation.id, draft.content)
    setSelectedDraft(draft)

    if (conversation.contact_id) {
      await updateContact(conversation.contact_id, {
        preferred_reply_tone: draft.tone_label,
      })
    }

    setShowOutcome(true)
  }

  const handleSaveOutcome = async () => {
    if (!conversation || !outcomeText.trim()) return
    await addOutcomeNotes(conversation.id, outcomeText.trim())
    navigate('/dashboard', { replace: true })
  }

  const handleRegenerate = async (guidance?: string) => {
    if (!conversation || !conversation.contact) return
    setRegenerating(true)
    setRegenError(null)

    try {
      const history = await getContactHistory(conversation.contact_id)
      const contact = conversation.contact

      const params: GenerateRepliesParams = {
        contactName: contact.name,
        relationshipType: contact.relationship_type,
        relationshipNotes: contact.relationship_notes,
        conversationHistory: history,
        preferredTone: contact.preferred_reply_tone,
        theirMessage: conversation.their_message,
        userGoal: conversation.user_goal,
        contextNotes: guidance
          ? `${conversation.context_notes || ''}\n\nADDITIONAL GUIDANCE: ${guidance}`
          : conversation.context_notes,
      }

      const replies = await generateReplies(params)
      const { data: newDrafts } = await saveDrafts(conversation.id, replies)
      if (newDrafts) setDrafts(newDrafts)
      setRegenCount(prev => prev + 1)
      setShowGuidance(false)
      setGuidanceText('')
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Failed to regenerate')
    }
    setRegenerating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-6 h-6 text-accent" />
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="p-5 lg:p-8">
        <ErrorState description={error || 'Conversation not found'} onRetry={() => navigate('/dashboard')} />
      </div>
    )
  }

  // After selecting a reply — outcome notes screen
  if (showOutcome && selectedDraft) {
    return (
      <div className="p-5 lg:p-8 space-y-6 page-enter">
        <div className="text-center space-y-3 py-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-success-soft flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <h2 className="font-display text-xl font-bold">Reply saved!</h2>
          <p className="text-sm text-text-secondary">You chose the <span className="text-accent font-medium">{selectedDraft.tone_label}</span> approach</p>
        </div>

        <Card className="space-y-3">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">How do you think it'll go?</p>
          <Textarea
            value={outcomeText}
            onChange={(e) => setOutcomeText(e.target.value)}
            placeholder="Optional — you can always come back and add this later..."
            autoResize
          />
        </Card>

        <div className="space-y-3">
          {outcomeText.trim() && (
            <Button size="lg" className="w-full btn-press" onClick={handleSaveOutcome}>
              Save & Done
            </Button>
          )}
          <Button
            variant={outcomeText.trim() ? 'ghost' : 'primary'}
            size="lg"
            className="w-full btn-press"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            {outcomeText.trim() ? 'Skip for now' : 'Done'}
          </Button>
        </div>
      </div>
    )
  }

  // Main drafts view
  return (
    <div className="p-5 lg:p-8 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">Reply Options</h1>
          {conversation.contact && (
            <p className="text-xs text-text-muted">for {conversation.contact.name}</p>
          )}
        </div>
      </div>

      {/* Context summary */}
      <Card className="space-y-2">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Their message</p>
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">{conversation.their_message}</p>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="accent">{conversation.user_goal}</Badge>
        </div>
      </Card>

      {/* Draft cards with staggered entrance */}
      {drafts.length > 0 ? (
        <div className="space-y-4">
          {drafts.map((draft, i) => (
            <div
              key={draft.id}
              className="draft-enter"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-accent">{draft.tone_label}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{draft.tone_description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted font-mono">#{i + 1}</span>
                    {editingDraftId !== draft.id && (
                      <button
                        onClick={() => handleStartEdit(draft)}
                        className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                        title="Edit draft"
                      >
                        <Pencil className="w-3.5 h-3.5 text-text-muted" />
                      </button>
                    )}
                  </div>
                </div>

                {editingDraftId === draft.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoResize
                      autoFocus
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(draft)} disabled={!editText.trim()} className="btn-press">
                        Save Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{draft.content}</p>
                )}

                {editingDraftId !== draft.id && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(draft)}
                      className={cn('flex-1 btn-press', copiedId === draft.id && 'flash-success')}
                    >
                      {copiedId === draft.id ? (
                        <><Check className="w-3.5 h-3.5 mr-1.5 text-success" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSelectReply(draft)}
                      className="flex-1 btn-press"
                    >
                      Use This Reply
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <ErrorState description="No drafts found for this conversation" onRetry={() => window.location.reload()} />
      )}

      {/* Regenerate with guidance */}
      {drafts.length > 0 && (
        <div className="text-center space-y-3 pt-2">
          <p className="text-xs text-text-muted">Not quite right?</p>
          {regenError && <p className="text-xs text-error">{regenError}</p>}

          {regenCount >= 2 ? (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">Want to start fresh? Edit your goal for better results.</p>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reply/new')} className="btn-press">
                Start New Reply
              </Button>
            </div>
          ) : showGuidance ? (
            <div className="space-y-3 text-left">
              <input
                type="text"
                value={guidanceText}
                onChange={(e) => setGuidanceText(e.target.value)}
                placeholder="e.g. Make it shorter, Less formal, Add more warmth..."
                className="w-full px-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-border-focus transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-3 justify-center">
                <Button
                  size="sm"
                  onClick={() => handleRegenerate(guidanceText)}
                  loading={regenerating}
                  disabled={!guidanceText.trim()}
                  className="btn-press"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
                <button
                  onClick={() => { setShowGuidance(false); setGuidanceText('') }}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuidance(true)}
              className="btn-press"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
