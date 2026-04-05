import { X, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'limit' | 'screenshot' | 'goal_chips' | 'contacts'
  repliesUsed?: number
}

const FEATURES = [
  'Unlimited replies',
  'Screenshot input (photo → reply)',
  'Contact memory & history',
  'Style learning (sounds like you)',
  'All goal chip types',
  'Energy matching for dating',
  'Follow-up generation',
]

export function PaywallModal({ isOpen, onClose, trigger = 'limit', repliesUsed = 5 }: PaywallModalProps) {
  if (!isOpen) return null

  const headline = {
    limit: `You've used your ${repliesUsed} free replies this month`,
    screenshot: 'Screenshot input is a premium feature',
    goal_chips: 'Audience-specific goal chips are a premium feature',
    contacts: 'Contact memory is a premium feature',
  }[trigger]

  const handlePlan = (plan: string) => {
    // Payment coming soon
    alert(`Payment coming soon — get notified when it's live! (${plan})`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-sm rounded-2xl bg-bg-elevated border border-border shadow-2xl',
        'animate-in fade-in slide-in-from-bottom-4 duration-200'
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center hover:bg-bg-card transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2 pr-6">
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h2 className="font-display text-xl font-bold">Unlock Reply Assistant</h2>
            <p className="text-sm text-text-secondary">{headline}</p>
          </div>

          {/* Feature list */}
          <div className="space-y-2">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-success-soft flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm text-text-secondary">{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing CTAs */}
          <div className="space-y-2.5">
            <Button
              size="lg"
              className="w-full btn-press relative"
              onClick={() => handlePlan('annual')}
            >
              Get Annual — $34.99/year
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">Save 42%</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full btn-press"
              onClick={() => handlePlan('monthly')}
            >
              $4.99/month
            </Button>

            <button
              onClick={() => handlePlan('lifetime')}
              className="w-full text-center text-sm text-accent hover:text-accent/80 transition-colors cursor-pointer underline underline-offset-2"
            >
              Buy once for $19.99 →
            </button>
          </div>

          <p className="text-center text-xs text-text-muted">Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  )
}
