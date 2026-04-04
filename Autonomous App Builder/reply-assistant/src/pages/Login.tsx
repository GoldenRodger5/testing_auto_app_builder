import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MessageSquareText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Input } from '@/components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
            <MessageSquareText className="w-6 h-6 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-1.5">Log in to your Reply account</p>
        </div>

        {/* Form card */}
        <div className="rounded-xl bg-bg-card border border-border p-5 shadow-subtle">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-3 rounded-lg bg-error-soft border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full btn-press" loading={loading}>
              Log in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
