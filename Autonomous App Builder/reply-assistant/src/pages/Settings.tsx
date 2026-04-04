import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card, Modal } from '@/components/ui'

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSaveName = async () => {
    if (!displayName.trim()) return
    setSavingName(true)
    setNameError(null)
    setNameSuccess(false)

    const { error } = await updateProfile({ display_name: displayName.trim() })
    setSavingName(false)

    if (error) {
      setNameError(error)
    } else {
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 2000)
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    await supabase.auth.resetPasswordForEmail(user.email)
    setResetSent(true)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)

    if (user) {
      await supabase.from('profiles').delete().eq('id', user.id)
    }
    await signOut()
    navigate('/', { replace: true })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="p-5 lg:p-8 space-y-6 page-enter">
      <h1 className="font-display text-xl font-bold">Settings</h1>

      {/* Account Section */}
      <div className="space-y-4">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Account</h2>

        {/* Display Name */}
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
              disabled={displayName.trim() === profile?.display_name}
              className="btn-press"
            >
              {nameSuccess ? 'Saved!' : 'Save'}
            </Button>
          </div>
          {nameError && <p className="text-xs text-error">{nameError}</p>}
        </Card>

        {/* Email */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted">
            <Mail className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Email</span>
          </div>
          <p className="text-sm text-text-secondary">{user?.email || '—'}</p>
        </Card>

        {/* Password */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-text-muted">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Password</span>
          </div>
          {showPasswordReset ? (
            resetSent ? (
              <p className="text-sm text-success">Check your email for a password reset link.</p>
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

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="secondary" className="w-full btn-press" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h2 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider">Danger Zone</h2>
        <div className="rounded-xl border border-error/20 p-4">
          <p className="text-sm text-text-secondary mb-3">Permanently delete your account and all data. This cannot be undone.</p>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)} className="btn-press">
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently delete all your contacts and conversation history. This cannot be undone.
          </p>
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
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
