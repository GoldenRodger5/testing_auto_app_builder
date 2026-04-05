import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Trash2, LogOut, Mic, Building2, Plus, X, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Card, Modal } from '@/components/ui'
import type { BusinessProfile } from '@/types'
import { cn } from '@/lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()

  // Account
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // My Voice (style examples)
  const [styleExamples, setStyleExamples] = useState<string[]>(profile?.style_examples || ['', '', ''])
  const [savingStyle, setSavingStyle] = useState(false)
  const [styleSuccess, setStyleSuccess] = useState(false)

  // Business profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(false)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessSuccess, setBusinessSuccess] = useState(false)
  const [faqPairs, setFaqPairs] = useState<Array<{ question: string; answer: string }>>([])
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    business_type: '',
    description: '',
    refund_policy: '',
    cancellation_policy: '',
    preferred_tone: 'professional' as 'warm' | 'professional' | 'friendly',
  })

  const showBusiness = profile?.primary_audience === 'business' || profile?.primary_audience === 'all'

  // Load business profile
  useEffect(() => {
    if (!showBusiness || !user) return
    setLoadingBusiness(true)
    supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBusinessProfile(data)
          setBusinessForm({
            business_name: data.business_name || '',
            business_type: data.business_type || '',
            description: data.description || '',
            refund_policy: data.refund_policy || '',
            cancellation_policy: data.cancellation_policy || '',
            preferred_tone: data.preferred_tone || 'professional',
          })
          setFaqPairs(data.faq_pairs || [])
        }
        setLoadingBusiness(false)
      })
  }, [showBusiness, user])

  const handleSaveName = async () => {
    if (!displayName.trim()) return
    setSavingName(true)
    setNameError(null)
    setNameSuccess(false)
    const { error } = await updateProfile({ display_name: displayName.trim() } as Parameters<typeof updateProfile>[0])
    setSavingName(false)
    if (error) { setNameError(error) }
    else { setNameSuccess(true); setTimeout(() => setNameSuccess(false), 2000) }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    if (user) await supabase.from('profiles').delete().eq('id', user.id)
    await signOut()
    navigate('/', { replace: true })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const handleSaveStyle = async () => {
    setSavingStyle(true)
    setStyleSuccess(false)
    const filtered = styleExamples.map(e => e.trim()).filter(Boolean)
    await updateProfile({ style_examples: filtered } as Parameters<typeof updateProfile>[0])
    setSavingStyle(false)
    setStyleSuccess(true)
    setTimeout(() => setStyleSuccess(false), 2000)
  }

  const handleSaveBusiness = async () => {
    if (!user) return
    setSavingBusiness(true)
    setBusinessSuccess(false)
    await supabase.from('business_profiles').upsert({
      user_id: user.id,
      ...businessForm,
      faq_pairs: faqPairs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSavingBusiness(false)
    setBusinessSuccess(true)
    setTimeout(() => setBusinessSuccess(false), 2000)
  }

  const addFaq = () => setFaqPairs(prev => [...prev, { question: '', answer: '' }])
  const removeFaq = (i: number) => setFaqPairs(prev => prev.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    setFaqPairs(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  return (
    <div className="p-5 lg:p-8 space-y-8 page-enter">
      <h1 className="font-display text-xl font-bold">Settings</h1>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Account</h2>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted">
            <User className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Display Name</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="flex-1"
            />
            <Button
              size="md"
              onClick={handleSaveName}
              loading={savingName}
              disabled={displayName.trim() === (profile?.display_name || '')}
              className="btn-press"
            >
              {nameSuccess ? <><Check className="w-4 h-4 mr-1" />Saved</> : 'Save'}
            </Button>
          </div>
          {nameError && <p className="text-xs text-error">{nameError}</p>}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted">
            <Mail className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Email</span>
          </div>
          <p className="text-sm text-text-secondary">{user?.email || '—'}</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Password</span>
          </div>
          {showPasswordReset ? (
            resetSent ? (
              <p className="text-sm text-success">Check your email for a reset link.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text-secondary">We'll send a reset link to {user?.email}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handlePasswordReset} className="btn-press">Send Reset Link</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowPasswordReset(false)}>Cancel</Button>
                </div>
              </div>
            )
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setShowPasswordReset(true)} className="btn-press">
              Change Password
            </Button>
          )}
        </Card>
      </div>

      {/* ── My Voice ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">My Voice</h2>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Mic className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Style Examples</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Paste messages you've actually sent. Reply Assistant uses these to match your natural writing style.
          </p>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Textarea
                key={i}
                label={`Message ${i + 1}`}
                value={styleExamples[i] || ''}
                onChange={(e) => {
                  const next = [...styleExamples]
                  next[i] = e.target.value
                  setStyleExamples(next)
                }}
                placeholder="e.g. Hey, sounds good — see you at 6!"
                autoResize
              />
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleSaveStyle}
            loading={savingStyle}
            className="btn-press"
          >
            {styleSuccess ? <><Check className="w-4 h-4 mr-1" />Saved</> : 'Update My Voice'}
          </Button>
        </Card>
      </div>

      {/* ── Business Profile (only if business audience) ─────────────────── */}
      {showBusiness && (
        <div className="space-y-4">
          <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Business Profile</h2>

          {loadingBusiness ? (
            <div className="py-4 text-center text-sm text-text-muted">Loading...</div>
          ) : (
            <Card className="space-y-4">
              <div className="flex items-center gap-2 text-text-muted">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Your Business</span>
              </div>

              <Input
                label="Business name"
                value={businessForm.business_name}
                onChange={e => setBusinessForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="e.g. Bloom Boutique"
              />
              <Input
                label="Business type"
                value={businessForm.business_type}
                onChange={e => setBusinessForm(f => ({ ...f, business_type: e.target.value }))}
                placeholder="e.g. Online clothing store"
              />
              <Textarea
                label="Description"
                value={businessForm.description}
                onChange={e => setBusinessForm(f => ({ ...f, description: e.target.value }))}
                placeholder="A brief description of your business..."
                autoResize
              />
              <Textarea
                label="Refund policy"
                value={businessForm.refund_policy}
                onChange={e => setBusinessForm(f => ({ ...f, refund_policy: e.target.value }))}
                placeholder="e.g. Full refunds within 30 days..."
                autoResize
              />
              <Textarea
                label="Cancellation policy"
                value={businessForm.cancellation_policy}
                onChange={e => setBusinessForm(f => ({ ...f, cancellation_policy: e.target.value }))}
                placeholder="e.g. Cancel 48 hours before for a full refund..."
                autoResize
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Preferred tone</label>
                <div className="flex gap-2">
                  {(['warm', 'professional', 'friendly'] as const).map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setBusinessForm(f => ({ ...f, preferred_tone: tone }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-all cursor-pointer',
                        businessForm.preferred_tone === tone
                          ? 'bg-accent text-white border-accent'
                          : 'bg-bg-card border-border text-text-secondary hover:border-border-focus'
                      )}
                    >
                      {tone === 'warm' ? '🤗' : tone === 'professional' ? '💼' : '😊'} {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ pairs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-secondary">FAQ Pairs</label>
                  {faqPairs.length < 5 && (
                    <button
                      onClick={addFaq}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add FAQ
                    </button>
                  )}
                </div>
                {faqPairs.map((pair, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-lg bg-bg-hover border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted font-medium">FAQ {i + 1}</span>
                      <button onClick={() => removeFaq(i)} className="text-text-muted hover:text-error cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Question..."
                      value={pair.question}
                      onChange={e => updateFaq(i, 'question', e.target.value)}
                    />
                    <Textarea
                      placeholder="Answer..."
                      value={pair.answer}
                      onChange={e => updateFaq(i, 'answer', e.target.value)}
                      autoResize
                    />
                  </div>
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleSaveBusiness}
                loading={savingBusiness}
                className="btn-press"
              >
                {businessSuccess ? <><Check className="w-4 h-4 mr-1" />Saved</> : 'Save Business Profile'}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ── Plan ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Plan</h2>
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{profile?.subscription_tier || 'Free'} Plan</p>
              {(profile?.subscription_tier || 'free') === 'free' && (
                <p className="text-xs text-text-muted mt-0.5">
                  {profile?.monthly_reply_count || 0}/5 free replies used this month
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              className="btn-press"
            >
              Upgrade
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Button variant="secondary" className="w-full btn-press" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Danger Zone</h2>
        <div className="rounded-xl border border-error/20 p-4">
          <p className="text-sm text-text-secondary mb-3">Permanently delete your account and all data.</p>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} className="btn-press">
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">This will permanently delete all your data. Cannot be undone.</p>
          <Input
            label="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1 btn-press"
              disabled={deleteConfirm !== 'DELETE'}
              loading={deleting}
              onClick={handleDeleteAccount}
            >
              Delete Everything
            </Button>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
