import { useNavigate } from 'react-router-dom'
import { MessageSquareText, Brain, Sparkles, ArrowRight, Zap, Shield, Quote, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'

const steps = [
  { num: '1', title: 'Paste the message', desc: 'Copy the message you received and drop it in.' },
  { num: '2', title: 'Set your goal', desc: 'Tell us what you want to achieve — apologize, negotiate, set a boundary.' },
  { num: '3', title: 'Get 3 perfect replies', desc: 'Choose the tone and strategy that feels right. Copy, paste, send.' },
]

const features = [
  { icon: Brain, title: 'Remembers everyone', desc: 'Builds a profile of every contact over time so replies feel personal, not generic.' },
  { icon: Zap, title: 'Gets smarter with you', desc: 'Learns your preferred tone with each person. The more you use it, the better it gets.' },
  { icon: Shield, title: 'Private by design', desc: 'Your conversations stay yours. No training on your data. No sharing with third parties.' },
]

const testimonials = [
  { name: 'Sarah K.', role: 'Freelance Designer', quote: 'I used to spend 20 minutes crafting replies to clients. Now it takes 30 seconds.' },
  { name: 'Marcus T.', role: 'Product Manager', quote: 'The fact that it remembers my contacts and adjusts over time — that\'s the killer feature.' },
  { name: 'Priya R.', role: 'Startup Founder', quote: 'Way better than throwing messages into ChatGPT. This actually understands the relationship.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-30 glass border-b border-border-subtle">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 lg:px-8 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <MessageSquareText className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="font-display font-bold text-base">Reply</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Log in
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')} className="hidden sm:inline-flex">
              Get started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orb background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/15 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">AI-powered reply assistant</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5 max-w-2xl mx-auto">
            Never struggle with a reply{' '}
            <span className="text-gradient">again</span>
          </h1>

          <p className="text-text-secondary text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Paste any message, set your goal, and get 3 perfectly crafted responses — tailored to the person and what you need to achieve.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate('/signup')}>
              Sign up free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              See how it works
            </Button>
          </div>
        </div>
      </section>

      {/* ---- Problem Statement ---- */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-16 lg:py-20 text-center">
          <p className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
            You know what you want to say. But finding the <em className="text-text-primary not-italic font-medium">right words</em> — the tone that lands, the phrasing that gets results — that's the hard part.
          </p>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">How it works</p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold">Three steps. Thirty seconds.</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
          {steps.map(({ num, title, desc }) => (
            <div key={num} className="relative text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <span className="font-display font-bold text-accent text-sm">{num}</span>
              </div>
              <h3 className="font-display font-semibold text-base mb-1.5">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- The Memory Advantage ---- */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-5">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              Unlike ChatGPT, Reply remembers who your contacts are
            </h2>
            <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Every reply you send teaches Reply about your relationship. Over time, it learns your preferred tone with each person, adapts to your communication style, and gives you options that feel authentically you.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-5 rounded-xl bg-bg-card border border-border">
                <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Social Proof (Placeholder) ---- */}
      <section className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-10">
          <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">What people are saying</p>
          <h2 className="font-display text-2xl lg:text-3xl font-bold">People love Reply</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {testimonials.map(({ name, role, quote }) => (
            <div key={name} className="p-5 rounded-xl bg-bg-card border border-border space-y-4">
              <Quote className="w-5 h-5 text-accent/40" />
              {/* PLACEHOLDER: Replace with real testimonials */}
              <p className="text-sm text-text-secondary leading-relaxed italic">"{quote}"</p>
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-text-muted">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-16 lg:py-24 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
            Ready to never overthink a reply again?
          </h2>
          <p className="text-text-secondary text-base mb-8 max-w-md mx-auto">
            Free to start. No credit card required. Your first reply is 30 seconds away.
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Get started for free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border-subtle">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-accent" />
            <span className="text-sm font-display font-semibold">Reply</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
              Log in
            </button>
            <button onClick={() => navigate('/signup')} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
              Sign up
            </button>
          </div>
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Reply Assistant</p>
        </div>
      </footer>
    </div>
  )
}
