import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, MessageSquareText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Spinner } from '@/components/ui'
import { audienceConfig } from '@/lib/goalChips'
import type { AudienceMode } from '@/types'
import { cn } from '@/lib/utils'

const AUDIENCE_MODES: AudienceMode[] = ['personal', 'freelancer', 'business', 'dating']

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateProfile, refreshProfile } = useAuth()

  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1)
  const [saving, setSaving] = useState(false)

  // Screen 1 — Audience
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceMode[]>([])

  // Screen 2 — Name
  const [displayName, setDisplayName] = useState('')

  // Screen 3 — Style examples
  const [styleExamples, setStyleExamples] = useState(['', '', ''])

  // Screen 4 — Business profile (only if 'business' selected)
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [businessDesc, setBusinessDesc] = useState('')
  const [refundPolicy, setRefundPolicy] = useState('')
  const [preferredTone, setPreferredTone] = useState<'warm' | 'professional' | 'friendly'>('professional')

  const includesBusiness = selectedAudiences.includes('business')
  const totalScreens = includesBusiness ? 4 : 3

  const toggleAudience = (mode: AudienceMode) => {
    setSelectedAudiences(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  const computePrimaryAudience = (): AudienceMode | 'all' => {
    if (selectedAudiences.length === 0) return 'personal'
    if (selectedAudiences.length >= 4) return 'all'
    return selectedAudiences[0]
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)

    const primary = computePrimaryAudience()
    const filteredExamples = styleExamples.filter(e => e.trim())

    await updateProfile({
      display_name: displayName.trim() || undefined,
      primary_audience: primary,
      style_examples: filteredExamples,
      onboarding_complete: true,
    } as Parameters<typeof updateProfile>[0])

    // Save business profile if applicable
    if (includesBusiness && businessName.trim()) {
      await supabase.from('business_profiles').upsert({
        user_id: user.id,
        business_name: businessName.trim(),
        business_type: businessType.trim() || null,
        description: businessDesc.trim() || null,
        refund_policy: refundPolicy.trim() || null,
        preferred_tone: preferredTone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }

    await refreshProfile()
    setSaving(false)
    navigate('/dashboard', { replace: true })
  }

  const handleSkipToEnd = async () => {
    if (!user) return
    setSaving(true)
    await updateProfile({ onboarding_complete: true } as Parameters<typeof updateProfile>[0])
    await refreshProfile()
    setSaving(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Logo header */}
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
          <MessageSquareText className="w-4 h-4 text-accent" />
        </div>
        <span className="font-display font-bold text-base">Reply Assistant</span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 justify-center py-2">
        {Array.from({ length: totalScreens }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i + 1 === screen
                ? 'w-6 h-2 bg-accent'
                : i + 1 < screen
                  ? 'w-2 h-2 bg-accent/40'
                  : 'w-2 h-2 bg-border'
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

        {/* Screen 1 — Audience selection */}
        {screen === 1 && (
          <div className="space-y-6 page-enter">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">What will you mainly use Reply Assistant for?</h1>
              <p className="text-sm text-text-secondary">This helps us show you the right reply options. You can change this anytime.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {AUDIENCE_MODES.map((mode) => {
                const conf = audienceConfig[mode]
                const selected = selectedAudiences.includes(mode)
                return (
                  <button
                    key={mode}
                    onClick={() => toggleAudience(mode)}
                    className={cn(
                      'relative flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer',
                      selected
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-bg-card hover:border-border-focus'
                    )}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-2xl">{conf.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-text-primary">{conf.label}</p>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{conf.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <Button
              size="lg"
              className="w-full btn-press"
              disabled={selectedAudiences.length === 0}
              onClick={() => setScreen(2)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={handleSkipToEnd}
              className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Skip setup
            </button>
          </div>
        )}

        {/* Screen 2 — Name */}
        {screen === 2 && (
          <div className="space-y-6 page-enter">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">What should we call you?</h1>
              <p className="text-sm text-text-secondary">We'll use this to personalize your experience.</p>
            </div>

            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your first name or nickname"
              autoFocus
              className="text-base"
            />

            <Button
              size="lg"
              className="w-full btn-press"
              onClick={() => setScreen(3)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={() => setScreen(3)}
              className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Screen 3 — Style learning */}
        {screen === 3 && (
          <div className="space-y-6 page-enter">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">Let me learn how you write</h1>
              <p className="text-sm text-text-secondary">
                Paste 3 messages you've actually sent to anyone. This makes every reply sound like you, not AI.
              </p>
            </div>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Textarea
                  key={i}
                  label={`Message ${i + 1}`}
                  value={styleExamples[i]}
                  onChange={(e) => {
                    const next = [...styleExamples]
                    next[i] = e.target.value
                    setStyleExamples(next)
                  }}
                  placeholder="e.g. Hey, sounds good! I'll grab coffee for 11 — see you then"
                  autoResize
                />
              ))}
            </div>

            {includesBusiness ? (
              <Button
                size="lg"
                className="w-full btn-press"
                onClick={() => setScreen(4)}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full btn-press"
                loading={saving}
                onClick={handleFinish}
              >
                {saving ? 'Setting up...' : 'Finish setup'}
              </Button>
            )}
            <button
              onClick={includesBusiness ? () => setScreen(4) : handleSkipToEnd}
              className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Skip for now (add in Settings later)
            </button>
          </div>
        )}

        {/* Screen 4 — Business profile */}
        {screen === 4 && (
          <div className="space-y-6 page-enter">
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">Tell me about your business</h1>
              <p className="text-sm text-text-secondary">This helps generate better customer replies.</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                autoFocus
              />
              <Input
                label="What you do"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Online clothing boutique, dog grooming salon..."
              />
              <Textarea
                label="Short description (optional)"
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                placeholder="A sentence about your business..."
                autoResize
              />
              <Textarea
                label="Refund policy (optional)"
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                placeholder="e.g. Full refunds within 30 days with receipt..."
                autoResize
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Preferred tone</label>
                <div className="flex gap-2">
                  {(['warm', 'professional', 'friendly'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setPreferredTone(tone)}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-all cursor-pointer',
                        preferredTone === tone
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg-card border-border text-text-secondary hover:border-border-focus'
                      )}
                    >
                      {tone === 'warm' ? '🤗 Warm' : tone === 'professional' ? '💼 Professional' : '😊 Friendly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full btn-press"
              loading={saving}
              onClick={handleFinish}
            >
              {saving ? 'Setting up...' : 'Finish setup'}
            </Button>
            <button
              onClick={handleSkipToEnd}
              className="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              I'll fill this in later
            </button>
          </div>
        )}
      </div>

      {saving && (
        <div className="fixed inset-0 bg-bg-primary/60 flex items-center justify-center z-50">
          <Spinner className="w-8 h-8 text-accent" />
        </div>
      )}
    </div>
  )
}
