import { useState } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
import { Modal, Badge, Button, Textarea } from '@/components/ui'

interface OutcomeNudgeProps {
  conversationId: string
  onSave: (conversationId: string, notes: string) => Promise<void>
}

export function OutcomeNudgeBadge({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick() }} className="cursor-pointer">
      <Badge variant="warning">
        <MessageCircleQuestion className="w-3 h-3 mr-1 inline" />
        How did it go?
      </Badge>
    </button>
  )
}

export function OutcomeModal({ conversationId, onSave }: OutcomeNudgeProps) {
  const [open, setOpen] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onSave(conversationId, text.trim())
    setSaving(false)
    setOpen(false)
  }

  if (!open) return null

  return (
    <Modal title="How did it go?" onClose={() => setOpen(false)}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Quick note on how the conversation went — this helps improve future suggestions.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. They appreciated the direct approach, we agreed on next steps..."
          autoResize
          autoFocus
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving} disabled={!text.trim()} className="flex-1">
            Save
          </Button>
          <button
            onClick={() => setOpen(false)}
            className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </Modal>
  )
}
