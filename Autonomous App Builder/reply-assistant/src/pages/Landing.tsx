import { useNavigate } from 'react-router-dom'
import { MessageSquareText, Brain, Sparkles, ArrowRight, Shield, Quote, Camera, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button, ScrollReveal } from '@/components/ui'

const steps = [
  { num: '1', title: 'Screenshot or paste', desc: 'Drop in a screenshot of the message, or paste the text. Either works.' },
  { num: '2', title: 'Pick your goal', desc: 'Tell us what you want to achieve, or pick from quick suggestions.' },
  { num: '3', title: 'Get 3 replies', desc: 'Three different replies. Pick one and send.' },
]

const audiences = [
  {
    icon: '💬',
    label: 'Personal',
    color: 'border-blue-500/20 bg-blue-500/5',
    accent: 'text-blue-400',
    scenario: 'Setting a boundary with a friend',
    them: "Hey can you cover for me this weekend? I know it's last minute...",
    reply: "I really want to help but I've got plans I can't move. Let me know earlier next time and I'll do my best 🙏",
  },
  {
    icon: '💼',
    label: 'Freelance',
    color: 'border-violet-500/20 bg-violet-500/5',
    accent: 'text-violet-400',
    scenario: 'Chasing a late invoice',
    them: "Hi, just wanted to check in on the project status...",
    reply: "The project's in great shape! Quick note, invoice #47 was due last Friday. Could you take a look when you get a chance?",
  },
  {
    icon: '🏪',
    label: 'Business',
    color: 'border-amber-500/20 bg-amber-500/5',
    accent: 'text-amber-400',
    scenario: 'Handling a complaint',
    them: "This is completely unacceptable. I want a full refund immediately.",
    reply: "I'm really sorry to hear this didn't meet your expectations. I've processed your refund and you'll see it in 3-5 business days. We'll make it right.",
  },
  {
    icon: '💕',
    label: 'Dating',
    color: 'border-rose-500/20 bg-rose-500/5',
    accent: 'text-rose-400',
    scenario: 'Keeping a conversation going',
    them: "haha yeah that's cool I guess",
    reply: "Haha low-key same. What's something you actually get weirdly excited about though?",
  },
]

const features = [
  { icon: Brain, title: 'Remembers every contact', desc: 'Builds a relationship profile over time, so replies feel personal, not generic.' },
  { icon: Camera, title: 'Screenshot to reply', desc: 'Take a screenshot of any conversation. Reply Assistant reads it and drafts your response.' },
  { icon: Shield, title: 'Private by design', desc: 'Your conversations are yours. No training on your data. No sharing with third parties.' },
]

const testimonials = [
  { name: 'Jordan M.', role: 'Freelance designer', quote: "I used to spend 20 minutes crafting replies to tricky clients. Now it takes 30 seconds." },
  { name: 'Alex R.', role: 'Small business owner', quote: "The business profile feature means every customer reply is on-brand. Game changer." },
  { name: 'Taylor K.', role: 'Chronic overthinker', quote: "I've been burned by ChatGPT giving generic advice. This actually understands the relationship." },
]

const FREE_FEATURES = ['5 replies per month', 'All 4 audience modes', 'Basic goal chips', 'Contact history']
const PAID_FEATURES = ['Unlimited replies', 'Screenshot input', 'Style learning (sounds like you)', 'All goal chips', 'Energy matching', 'Follow-up generation', 'Contact memory']

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 glass border-b border-border-subtle">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 lg:px-8 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center">
              <MessageSquareText className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="font-display font-bold text-base">Reply Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Button>
            <Button size="sm" onClick={() => navigate('/signup')} className="hidden sm:inline-flex">
              Get started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-5 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center">
          {/* Badge pill with ambient glow */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(224, 138, 78, 0)',
                '0 0 12px rgba(224, 138, 78, 0.3)',
                '0 0 0px rgba(224, 138, 78, 0)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 2,
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-soft border border-accent/15 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Replies that sound like you, not AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-5 max-w-3xl mx-auto"
          >
            Stop leaving people{' '}
            <br className="hidden sm:block" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-accent"
            >
              on read.
            </motion.span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-text-secondary text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed"
          >
            You meant to reply. You just froze, or got busy, or couldn't find the right words. Now it's been three days and it feels weird to respond at all. Reply Assistant drafts 3 replies in 30 seconds, matched to your voice, the person, and what you actually want to say.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm sm:max-w-none mx-auto"
          >
            <Button size="lg" className="w-full sm:w-auto shadow-glow btn-press" onClick={() => navigate('/signup')}>
              Start free, no card needed <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => {
              document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
              See it in action
            </Button>
          </motion.div>

          {/* Hero conversation preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease }}
            className="mt-12 mx-auto max-w-sm"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 space-y-3">
              {/* Received message */}
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center text-xs text-white/70 font-sans">
                  M
                </div>
                <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm font-sans text-white/80 leading-snug text-left">
                    hey are you still upset with me? you've been quiet
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[10px] font-sans text-white/30 uppercase tracking-widest">
                  3 replies drafted
                </span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              {/* Reply options */}
              <div className="space-y-2">
                {[
                  { tone: 'honest', text: "Not upset, just needed some space. Can we talk later?", highlight: true, delay: 1.2 },
                  { tone: 'warm', text: "No I'm okay, just had a lot going on. Miss talking to you", highlight: false, delay: 1.45 },
                  { tone: 'light', text: "lol no, just been in my head. what's up?", highlight: false, delay: 1.7 },
                ].map((reply) => (
                  <motion.div
                    key={reply.tone}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: reply.delay, ease: 'easeOut' }}
                    className={`rounded-xl px-3.5 py-2.5 text-left ${
                      reply.highlight
                        ? 'bg-amber-500/[0.08] border border-amber-500/20'
                        : 'bg-white/[0.04] border border-white/[0.08]'
                    }`}
                  >
                    <p className={`text-[10px] font-sans uppercase tracking-widest mb-1 ${
                      reply.highlight ? 'text-amber-400/70' : 'text-white/30'
                    }`}>
                      {reply.tone}
                    </p>
                    <p className={`text-sm font-sans leading-snug ${
                      reply.highlight ? 'text-white/75' : 'text-white/60'
                    }`}>
                      {reply.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Bottom label */}
              <p className="text-center text-[10px] font-sans text-white/25 pt-1">
                Tap one to copy and send
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Problem ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-12 lg:py-14 text-center">
          <ScrollReveal>
            <p className="text-text-secondary text-lg sm:text-xl leading-relaxed">
              The message sits there. You think about it in the shower.
              You open the app, stare at the thread, close it again.
              The longer you wait, the harder it gets.
              <strong className="text-text-primary font-medium">
                {' '}Reply Assistant breaks the paralysis.
              </strong>
              {' '}Three options, ready in seconds. One of them will
              sound exactly like what you wanted to say but couldn't.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Use Cases ───────────────────────────────────────────────────── */}
      <section id="use-cases" className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">For every situation</p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold">Built for how people actually communicate</h2>
            <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto">Each mode has its own reply styles, tuned to the situation.</p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-4">
          {audiences.map(({ icon, label, color, accent, scenario, them, reply }, i) => (
            <ScrollReveal key={label} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
                className={`p-5 rounded-xl border ${color} space-y-4 cursor-default`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className={`font-display font-bold text-sm ${accent}`}>{label}</span>
                  <span className="ml-auto text-xs text-text-muted italic">{scenario}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-bg-hover flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px]">👤</span>
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-xl rounded-tl-sm bg-bg-card border border-border text-xs text-text-secondary leading-relaxed">
                      {them}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className={`flex-1 px-3 py-2 rounded-xl rounded-tr-sm border text-xs leading-relaxed ${color}`}>
                      <span className={accent}>{reply}</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px]">✨</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">How it works</p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold">Three steps. Thirty seconds.</h2>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map(({ num, title, desc }, i) => (
              <ScrollReveal key={num} delay={i * 0.1}>
                <div className="text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center mb-4 mx-auto sm:mx-0">
                    <span className="font-display font-bold text-accent text-sm">{num}</span>
                  </div>
                  <h3 className="font-display font-semibold text-base mb-1.5">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Memory Advantage ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center mx-auto mb-5">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              Unlike ChatGPT, it remembers your history with every person
            </h2>
            <p className="text-text-secondary text-base leading-relaxed max-w-xl mx-auto">
              Every reply you send teaches Reply Assistant about the relationship. It learns your tone, adapts to each person, and gets more accurate over time.
            </p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 0.1}>
              <div className="p-5 rounded-xl bg-bg-card border border-border">
                <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Social Proof ────────────────────────────────────────────────── */}
      <section className="border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">What people say</p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold">Real feedback, real people</h2>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map(({ name, role, quote }, i) => (
              <ScrollReveal key={name} delay={i * 0.15}>
                <div className="p-5 rounded-xl bg-bg-card border border-border space-y-4">
                  <Quote className="w-5 h-5 text-accent/40" />
                  <p className="text-sm text-text-secondary leading-relaxed">"{quote}"</p>
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-text-muted">{role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-accent uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold">Start free. Upgrade when you're hooked.</h2>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {/* Free */}
          <ScrollReveal delay={0}>
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl bg-bg-card border border-border space-y-4"
            >
              <div>
                <h3 className="font-display font-bold text-base">Free</h3>
                <p className="text-2xl font-bold mt-1">$0<span className="text-sm text-text-muted font-normal">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" className="w-full btn-press" onClick={() => navigate('/signup')}>
                Get started
              </Button>
            </motion.div>
          </ScrollReveal>

          {/* Annual — highlighted */}
          <ScrollReveal delay={0.1}>
            <motion.div
              whileHover={{
                y: -6,
                boxShadow: '0 20px 60px rgba(224, 138, 78, 0.15)',
                transition: { duration: 0.2 },
              }}
              className="p-6 rounded-xl bg-accent-soft border border-accent/30 space-y-4 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-bold">
                BEST VALUE
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-accent">Annual</h3>
                <p className="text-2xl font-bold mt-1">$34.99<span className="text-sm text-text-muted font-normal">/yr</span></p>
                <p className="text-xs text-accent mt-0.5">Save 42% vs monthly</p>
              </div>
              <ul className="space-y-2">
                {PAID_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button size="sm" className="w-full btn-press shadow-glow" onClick={() => navigate('/signup')}>
                Get annual
              </Button>
            </motion.div>
          </ScrollReveal>

          {/* Monthly + One-time */}
          <ScrollReveal delay={0.2}>
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl bg-bg-card border border-border space-y-4"
            >
              <div>
                <h3 className="font-display font-bold text-base">Monthly</h3>
                <p className="text-2xl font-bold mt-1">$4.99<span className="text-sm text-text-muted font-normal">/mo</span></p>
              </div>
              <ul className="space-y-2">
                {PAID_FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-success shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" size="sm" className="w-full btn-press" onClick={() => navigate('/signup')}>
                Get monthly
              </Button>
              <p className="text-center text-xs text-accent cursor-pointer hover:text-accent/80" onClick={() => navigate('/signup')}>
                Or buy once for $19.99 →
              </p>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border-subtle bg-bg-secondary/50">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-16 lg:py-24 text-center">
          <ScrollReveal>
            <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">
              Ready to stop overthinking every reply?
            </h2>
            <p className="text-text-secondary text-base mb-8 max-w-md mx-auto">
              Free to start. No credit card required. Your first reply is 30 seconds away.
            </p>
            <Button size="lg" onClick={() => navigate('/signup')} className="shadow-glow btn-press">
              Get started for free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-accent" />
            <span className="text-sm font-display font-semibold">Reply Assistant</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/login')} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">Log in</button>
            <button onClick={() => navigate('/signup')} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">Sign up</button>
          </div>
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Reply Assistant</p>
        </div>
      </footer>
    </div>
  )
}
