import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PenLine, Users, Settings, MessageSquareText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/reply/new', label: 'New Reply', icon: PenLine },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ---- Desktop Sidebar (≥1024px) ---- */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border bg-bg-secondary">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
            <MessageSquareText className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-bold text-base">Reply</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px]', active && 'stroke-[2.5]')} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center shrink-0">
              <span className="text-accent font-semibold text-xs">
                {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-text-muted truncate">Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <main className={cn(
        'min-h-screen',
        // On desktop, offset for sidebar
        'lg:pl-[240px]',
        // On mobile, add bottom padding for nav
        'pb-[calc(var(--nav-height)+env(safe-area-inset-bottom))] lg:pb-0'
      )}>
        <div className="mx-auto w-full max-w-[720px] page-enter">
          <Outlet />
        </div>
      </main>

      {/* ---- Mobile Bottom Nav (<1024px) ---- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border">
        <div className="flex items-center justify-around h-[var(--nav-height)] px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all cursor-pointer min-w-[64px]',
                  'active:scale-95',
                  active
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
        {/* Safe area for phones with home indicators */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
