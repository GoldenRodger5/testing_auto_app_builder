import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import NotFound from '@/pages/NotFound'

// Lazy load protected pages
import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/ui'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const NewReply = lazy(() => import('@/pages/NewReply'))
const ReplyView = lazy(() => import('@/pages/ReplyView'))
const Contacts = lazy(() => import('@/pages/Contacts'))
const ContactDetail = lazy(() => import('@/pages/ContactDetail'))
const Settings = lazy(() => import('@/pages/Settings'))
const QuickReply = lazy(() => import('@/pages/QuickReply'))
const ContinueConversation = lazy(() => import('@/pages/ContinueConversation'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner className="w-6 h-6 text-accent" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Onboarding — protected but outside AppShell */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingFallback />}>
                  <Onboarding />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Protected routes with AppShell */}
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
            <Route path="/reply/new" element={<Suspense fallback={<LoadingFallback />}><NewReply /></Suspense>} />
            <Route path="/reply/quick/:contactId" element={<Suspense fallback={<LoadingFallback />}><QuickReply /></Suspense>} />
            <Route path="/reply/continue/:conversationId" element={<Suspense fallback={<LoadingFallback />}><ContinueConversation /></Suspense>} />
            <Route path="/reply/:id" element={<Suspense fallback={<LoadingFallback />}><ReplyView /></Suspense>} />
            <Route path="/contacts" element={<Suspense fallback={<LoadingFallback />}><Contacts /></Suspense>} />
            <Route path="/contacts/:id" element={<Suspense fallback={<LoadingFallback />}><ContactDetail /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
