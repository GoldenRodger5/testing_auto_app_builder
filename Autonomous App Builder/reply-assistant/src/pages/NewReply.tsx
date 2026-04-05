import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, UserPlus, Check, Sparkles } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { generateReplies } from '@/lib/claude'
import { Button, Input, Textarea, Card, Badge, Spinner, ErrorState, ScreenshotUpload } from '@/components/ui'
import type { ScreenshotSet } from '@/components/ui'
import { PaywallModal } from '@/components/PaywallModal'
import { goalChips, audienceConfig } from '@/lib/goalChips'
import { RELATIONSHIP_TYPES } from '@/types'
import type { Contact, ConversationSummary, AudienceMode } from '@/types'
import { cn, getInitialColor } from '@/lib/utils'

const LOADING_MESSAGES = [
  'Reading between the lines...',
  'Thinking about {name}...',
  'Crafting different strategies...',
  'Drafting your options...',
]

export default function NewReply() {
  const navigate = useNavigate()
  const location = useLocation()
  const { contacts, createContact, fetchContacts } = useContacts()
  const { createConversation, saveDrafts, getContactHistory } = useConversations()
  const { profile } = useAuth()

  // Audience mode — guard against 'all' or null values from profile
  const validAudiences: AudienceMode[] = ['personal', 'freelancer', 'business', 'dating']
  const defaultAudience: AudienceMode =
    validAudiences.includes(profile?.primary_audience as AudienceMode)
      ? (profile?.primary_audience as AudienceMode)
      : 'personal'
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(defaultAudience)
  const [showAudiencePicker, setShowAudiencePicker] = useState(false)

  // Steps: 1=message, 2=contact, 3=goal, 4=context, 5=generating
  const [step, setStep] = useState(1)

  // Step 1 — Their Message
  const [theirMessage, setTheirMessage] = useState('')
  const [screenshots, setScreenshots] = useState<ScreenshotSet>({ main: null, context: [], mimeType: 'image/jpeg' })

  // Step 2 — Contact
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [showNewContact, setShowNewContact] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactType, setNewContactType] = useState('Friend')
  const [newContactNotes, setNewContactNotes] = useState('')

  // Step 3 — Goal
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [userGoal, setUserGoal] = useState('')

  // Step 4 — Context
  const [contextNotes, setContextNotes] = useState('')
  const [showContext, setShowContext] = useState(false)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallTrigger, setPaywallTrigger] = useState<'limit' | 'screenshot' | 'goal_chips'>('limit')

  const isPremium = profile?.subscription_tier !== 'free' && profile?.subscription_tier != null

  // Pre-fill contact from location state
  useEffect(() => {
    const stateContactId = (location.state as { contactId?: string })?.contactId
    if (stateContactId && contacts.length > 0) {
      const found = contacts.find(c => c.id === stateContactId)
      if (found) setSelectedContact(found)
    }
  }, [location.state, contacts])

  // Cycle loading messages
  useEffect(() => {
    if (!generating) return
    let i = 0
    const name = selectedContact?.name || 'them'
    setLoadingMsg(LOADING_MESSAGES[0].replace('{name}', name))
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[i].replace('{name}', name))
    }, 2500)
    return () => clearInterval(interval)
  }, [generating, selectedContact])

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  )

  const hasScreenshot = !!screenshots.main
  const hasMessage = theirMessage.trim().length > 0

  const canAdvance = () => {
    switch (step) {
      case 1: return (hasScreenshot || hasMessage) && theirMessage.length <= 5000
      case 2: return selectedContact !== null
      case 3: return (selectedChip !== null || userGoal.trim().length > 0) && userGoal.length <= 500
      case 4: return true
      default: return false
    }
  }

  const handleCreateContact = async () => {
    if (!newContactName.trim()) return
    const { data } = await createContact({
      name: newContactName.trim(),
      relationship_type: newContactType,
      relationship_notes: newContactNotes.trim() || undefined,
    })
    if (data) {
      setSelectedContact(data)
      setShowNewContact(false)
      setNewContactName('')
      setNewContactNotes('')
      await fetchContacts()
    }
  }

  const handleGenerate = async () => {
    if (!selectedContact) return
    setGenerating(true)
    setError(null)

    try {
      const fullGoal = [selectedChip, userGoal.trim()].filter(Boolean).join(' — ')
      const history: ConversationSummary[] = await getContactHistory(selectedContact.id)

      const { data: convo, error: convoErr } = await createConversation({
        contact_id: selectedContact.id,
        their_message: theirMessage || (hasScreenshot ? '[Screenshot provided]' : ''),
        user_goal: fullGoal,
        context_notes: contextNotes || undefined,
        audience_context: audienceMode,
      } as Parameters<typeof createConversation>[0])

      if (convoErr || !convo) throw new Error(convoErr || 'Failed to create conversation')

      const styleExamples = profile?.style_examples?.filter(Boolean) || []

      const replies = await generateReplies({
        contactName: selectedContact.name,
        relationshipType: selectedContact.relationship_type,
        relationshipNotes: selectedContact.relationship_notes,
        conversationHistory: history,
        preferredTone: selectedContact.preferred_reply_tone,
        theirMessage: theirMessage || null,
        userGoal: fullGoal,
        contextNotes: contextNotes || null,
        audienceContext: audienceMode,
        styleExamples,
        messageScreenshot: screenshots.main || undefined,
        contextScreenshots: screenshots.context,
        screenshotMimeType: screenshots.mimeType,
        datingPlatform: selectedContact.dating_platform,
        datingInterests: selectedContact.dating_interests || [],
      })

      await saveDrafts(convo.id, replies)
      navigate(`/reply/${convo.id}`, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      if (message === 'free_limit_reached') {
        setPaywallTrigger('limit')
        setShowPaywall(true)
        setStep(1)
      } else {
        setError(message)
      }
      setGenerating(false)
    }
  }

  const nextStep = () => {
    if (step === 4) {
      handleGenerate()
      setStep(5)
    } else if (step === 3 && !showContext) {
      handleGenerate()
      setStep(5)
    } else if (step === 3 && showContext) {
      setStep(4)
    } else {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step === 4) setStep(3)
    else if (step > 1) setStep(step - 1)
  }

  const chips = goalChips[audienceMode] || goalChips.personal
  const audConf = audienceConfig[audienceMode]
  const totalSteps = 4
  const activeStep = Math.min(step, 4)

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        trigger={paywallTrigger}
        repliesUsed={profile?.monthly_reply_count ?? 5}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step > 1 && step < 5 ? prevStep() : navigate(-1))}
          className="p-2 -ml-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">New Reply</h1>
        </div>

        {/* Audience mode pill */}
        <div className="relative">
          <button
            onClick={() => setShowAudiencePicker(!showAudiencePicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-border text-xs font-medium hover:border-border-focus transition-colors cursor-pointer"
          >
            <span>{audConf.icon}</span>
            <span className="text-text-secondary">{audConf.label}</span>
            <ChevronDown className={cn('w-3 h-3 text-text-muted transition-transform', showAudiencePicker && 'rotate-180')} />
          </button>

          {showAudiencePicker && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-bg-elevated border border-border shadow-lg overflow-hidden">
              {(Object.entries(audienceConfig) as [AudienceMode, typeof audConf][]).map(([mode, conf]) => (
                <button
                  key={mode}
                  onClick={() => {
                    setAudienceMode(mode)
                    setSelectedChip(null)
                    setShowAudiencePicker(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors cursor-pointer',
                    mode === audienceMode
                      ? 'bg-accent-soft text-accent'
                      : 'hover:bg-bg-hover text-text-secondary'
                  )}
                >
                  <span className="text-base">{conf.icon}</span>
                  <div>
                    <p className="font-medium leading-tight">{conf.label}</p>
                    <p className="text-xs text-text-muted leading-tight mt-0.5">{conf.description}</p>
                  </div>
                  {mode === audienceMode && <Check className="w-4 h-4 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {step < 5 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i + 1 === activeStep ? 'w-10 bg-accent' : i + 1 < activeStep ? 'w-3 bg-accent/50' : 'w-3 bg-border'
              )}
            />
          ))}
        </div>
      )}

      {/* STEP 1: Their Message */}
      {step === 1 && (
        <div className="space-y-4 page-enter">
          <div>
            <h2 className="font-display font-semibold text-base mb-1">Their message</h2>
            <p className="text-sm text-text-secondary">Upload a screenshot or paste the message</p>
          </div>

          {/* Screenshot upload */}
          <ScreenshotUpload
            onChange={setScreenshots}
            isPremium={isPremium}
            onPaywall={() => { setPaywallTrigger('screenshot'); setShowPaywall(true) }}
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">or type it</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Text input */}
          <Textarea
            value={theirMessage}
            onChange={(e) => setTheirMessage(e.target.value)}
            placeholder={hasScreenshot ? 'Add any extra context from the message (optional)...' : 'Paste or type the message here...'}
            charCount={{ current: theirMessage.length, max: 5000 }}
            className="min-h-[120px]"
            autoFocus={!hasScreenshot}
          />

          {selectedContact && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-soft border border-accent/15">
              <Check className="w-4 h-4 text-accent shrink-0" />
              <span className="text-sm text-accent">
                Replying to <strong>{selectedContact.name}</strong>
              </span>
              <button
                onClick={() => setSelectedContact(null)}
                className="ml-auto text-xs text-accent/70 hover:text-accent cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Contact */}
      {step === 2 && (
        <div className="space-y-4 page-enter">
          <div>
            <h2 className="font-display font-semibold text-base mb-1">Who sent this?</h2>
            <p className="text-sm text-text-secondary">Select or create the contact</p>
          </div>

          {!showNewContact ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors text-sm"
                  autoFocus
                />
              </div>

              <button
                onClick={() => setShowNewContact(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-accent/40 hover:bg-accent-muted transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-accent">New Contact</span>
              </button>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer text-left',
                      selectedContact?.id === contact.id
                        ? 'bg-accent-soft border border-accent/20'
                        : 'hover:bg-bg-hover border border-transparent'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: getInitialColor(contact.name) }}
                    >
                      <span className="font-semibold text-sm text-white/90">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{contact.name}</span>
                      <span className="text-xs text-text-muted">
                        {contact.contact_audience === 'dating' && contact.dating_platform
                          ? `${audienceConfig.dating.icon} ${contact.dating_platform}`
                          : contact.relationship_type}
                      </span>
                    </div>
                    {selectedContact?.id === contact.id && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <Card className="space-y-4">
              <Input
                label="Name"
                placeholder="Their name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                autoFocus
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Relationship</label>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewContactType(type)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                        type === newContactType
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg-card border-border text-text-secondary hover:border-border-focus'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                label="Notes about this person (optional)"
                placeholder="Tell me about this person and your dynamic..."
                value={newContactNotes}
                onChange={(e) => setNewContactNotes(e.target.value)}
                charCount={{ current: newContactNotes.length, max: 1000 }}
                autoResize
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateContact} disabled={!newContactName.trim()} className="flex-1 btn-press">
                  Create Contact
                </Button>
                <Button variant="ghost" onClick={() => setShowNewContact(false)}>Cancel</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* STEP 3: Goal */}
      {step === 3 && (
        <div className="space-y-4 page-enter">
          <div>
            <h2 className="font-display font-semibold text-base mb-1">What's your goal?</h2>
            <p className="text-sm text-text-secondary">What do you want to achieve with your reply?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => setSelectedChip(selectedChip === chip ? null : chip)}
                className={cn(
                  'px-3.5 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer btn-press',
                  selectedChip === chip
                    ? 'bg-accent text-white border-accent shadow-glow'
                    : 'bg-bg-card border-border text-text-secondary hover:border-border-focus hover:bg-bg-hover'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <Textarea
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder={selectedChip ? 'Add more detail (optional)...' : 'Describe what you want to achieve...'}
            charCount={{ current: userGoal.length, max: 500 }}
            autoResize
          />

          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Add more context (optional)
          </button>
          {showContext && (
            <Textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Any other context I should know about this situation..."
              autoResize
            />
          )}
        </div>
      )}

      {/* STEP 5: Generating */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 page-enter">
          {error ? (
            <ErrorState
              description={error}
              onRetry={() => {
                setError(null)
                handleGenerate()
              }}
            />
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
      )}

      {/* Next/Generate button */}
      {step < 5 && (
        <div className="pt-2">
          <Button
            size="lg"
            className="w-full btn-press"
            disabled={!canAdvance()}
            onClick={nextStep}
          >
            {step === 3 || step === 4 ? (
              <><Sparkles className="w-4 h-4 mr-2" /> Generate Replies</>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
