import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5 text-center page-enter">
      <p className="text-8xl font-display font-bold text-border mb-4">404</p>
      <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mb-6">
        <MapPin className="w-6 h-6 text-accent" />
      </div>
      <h1 className="font-display text-xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-text-secondary mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        size="lg"
        className="w-full max-w-xs btn-press"
        onClick={() => navigate(user ? '/dashboard' : '/login', { replace: true })}
      >
        {user ? 'Go to Dashboard' : 'Go to Login'}
      </Button>
    </div>
  )
}
