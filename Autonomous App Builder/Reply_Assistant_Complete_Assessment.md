# Reply Assistant — Complete App Assessment

**Date:** April 4, 2026
**Repo:** GoldenRodger5/testing_auto_app_builder
**Subfolder:** Autonomous App Builder/reply-assistant
**Live URL:** https://reply-assistant-isaac-mineos-projects.vercel.app
**Supabase Project:** owoidxxpurjitlzncxhc

---

## What This App Is

Reply Assistant is a web app that helps users craft replies to messages they've received. You paste a message, select who sent it, set a goal (e.g., "decline politely," "set a boundary"), and the app generates 3 distinct reply options using Claude AI via a Supabase Edge Function. It remembers your contacts and past conversations to improve suggestions over time.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 with custom design tokens |
| Routing | React Router v6 (client-side SPA) |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL with RLS |
| AI | Claude API (claude-sonnet-4-20250514) via Supabase Edge Function |
| Hosting | Vercel (frontend), Supabase (backend + edge function) |
| Fonts | Outfit (headings), DM Sans (body) — Google Fonts |

---

## Database Schema

4 tables, all with Row Level Security:

- **profiles** — extends Supabase auth.users. Auto-created on signup via trigger. Fields: id, display_name, created_at.
- **contacts** — user's contacts. Fields: name, relationship_type, relationship_notes, preferred_reply_tone (learned from usage).
- **conversations** — each reply session. Fields: their_message, user_goal, context_notes, selected_reply, outcome_notes, deleted_at (soft delete).
- **reply_drafts** — AI-generated replies. Fields: conversation_id (FK), tone_label, tone_description, content.

Proper indexes on user_id, contact_id, conversation_id, and deleted_at.

---

## App Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Marketing landing page |
| `/login` | Public | Email/password login |
| `/signup` | Public | Account creation |
| `/dashboard` | Protected | Recent conversations, "New Reply" CTA |
| `/reply/new` | Protected | 4-step reply wizard |
| `/reply/:id` | Protected | View generated drafts, copy, edit, select |
| `/reply/quick/:contactId` | Protected | Pre-fills contact, skips step 2 |
| `/reply/continue/:conversationId` | Protected | Continue from existing conversation |
| `/contacts` | Protected | Contact list with search + sort |
| `/contacts/:id` | Protected | Contact detail, history, relationship report |
| `/settings` | Protected | Profile, password, sign out, delete account |
| `*` | Public | 404 page |

---

## What's Working Well

### UI & Design — 9/10
The design is genuinely impressive for an auto-built app:
- Deep navy-black dark theme (`#080c16`) with warm amber accent (`#e08a4e`) — distinctive and premium
- Consistent design tokens — every color, shadow, radius, and animation is tokenized in `globals.css`
- Two-font system (Outfit headings + DM Sans body) creates clear hierarchy
- Thoughtful animations: page transitions, staggered card entrances, skeleton shimmer, button press effects, glow rings
- Glass-effect nav, gradient text, custom scrollbars
- Mobile-first responsive layout with bottom nav bar

### Authentication & Sessions — 9/10
- Signup, login, logout all work flawlessly
- Session persistence across page reloads and browser restarts
- Profile auto-creation via PostgreSQL trigger
- Protected routes redirect to login cleanly (no flash of protected content)
- Time-of-day personalized greeting on dashboard ("Good evening, Isaac")

### Data Layer — 9/10
- All CRUD operations work: contacts, conversations, drafts, profiles
- Row Level Security properly isolates user data
- Soft delete on conversations (deleted_at instead of hard delete)
- Proper foreign key relationships and cascading deletes
- Performance indexes in place
- Data persists correctly across sessions

### UX Flow Design — 8/10
- The 4-step reply wizard is intuitive and well-paced
- Inline contact creation within the reply flow is excellent (no context-switching)
- Progress bar with animated dots shows current step
- Empty states are friendly and action-oriented, not just "nothing here"
- Contact search + sort (recent / A-Z) works
- Quick Reply from contact detail pre-fills context
- Relationship Report locked behind 3+ conversations (progressive disclosure)
- Drafts have copy, edit, select, and regenerate-with-guidance capabilities
- Outcome tracking ("How did it go?") after selecting a reply

### Error Handling — 7/10
- AI generation failure shows clear error with "Try Again" button
- Conversation records saved even when generation fails (good resilience)
- Retry logic in claude.ts (2 attempts before giving up)
- 429 rate-limit detection with user-friendly message
- 404 page is well-designed with contextual CTA (login vs dashboard based on auth state)

---

## What's NOT Working

### CRITICAL: AI Reply Generation — 401 Error

**This is the core feature of the app and it is currently broken in production.**

When a user completes the 4-step wizard and clicks "Generate Replies," the call to the Supabase Edge Function (`generate-replies`) returns HTTP 401.

**What we know:**
- The `ANTHROPIC_API_KEY` secret IS set in Supabase (verified via `supabase secrets list`)
- The edge function IS deployed and active (version 3, status ACTIVE)
- The error is in the JWT authentication layer of the edge function, NOT the Anthropic API call
- The edge function validates the user's JWT via `supabase.auth.getUser()` — this is the step that's returning `Unauthorized`
- The user IS authenticated (contacts, conversations, and all other Supabase operations work fine with the same session)

**Possible root causes:**
1. The `supabase.functions.invoke` SDK method may not be forwarding the user's JWT correctly as the Authorization header
2. There may be a version mismatch between the client-side `@supabase/supabase-js` and the edge function's `esm.sh/@supabase/supabase-js@2` import
3. The Supabase Edge Function gateway may be rejecting the JWT before the function code even runs (separate from the function's own validation)
4. The JWT may be expiring or not refreshing correctly between auth operations and the generate call

**Impact:** The entire value proposition of the app — AI-generated replies — cannot be delivered. Everything else works, but without this, the app is a contact manager with a broken promise.

**What needs to happen:**
- Check the Supabase dashboard Edge Function logs for the actual error detail
- Test with `supabase functions serve` locally to reproduce
- Consider deploying with `--no-verify-jwt` temporarily to isolate whether the gateway or the function's internal auth is the problem
- Verify the `@supabase/supabase-js` version used in the edge function's Deno import matches expectations

---

## Bugs Found (from both automated and Cowork testing)

### Fixed in This Session

| Bug | Status | Fix |
|-----|--------|-----|
| OutcomeNudge modal missing `isOpen` prop | Fixed | Added `isOpen={open}` prop |
| Goal chip text merging with textarea input | Fixed | Separated chip selection from textarea; combined with separator on submit |
| Edge function unhelpful error messages | Improved | Added env var validation and error detail in auth failure response |

### Still Open

| Bug | Severity | Description |
|-----|----------|-------------|
| AI generation 401 | **Critical** | Edge function JWT validation fails despite user being authenticated. Core feature blocked. |
| "See how it works" scroll | Minor | Works in code (`scrollIntoView` + correct `id`), but Cowork couldn't verify. Likely a non-issue — test environment artifact. |
| Landing page placeholder testimonials | Minor | Page includes visible note: "Placeholder testimonials — to be replaced with real user feedback." Remove before launch. |

---

## What Could Be Better (Honest Assessment)

### Architecture Concerns
- **No rate limiting on AI calls** — a user could spam "Generate" and rack up Anthropic API costs. There's a 2-attempt retry but no throttle.
- **No loading timeout** — if the Claude API hangs, the user sees a spinner forever. Should add a 30s timeout.
- **Regenerate is limited to 2 rounds** — after that, user is told to "start new reply." This is arbitrary and could frustrate users who are close to a good reply.
- **Edge function uses esm.sh imports** — these are fetched at runtime from a CDN. If esm.sh goes down, the function breaks. Consider bundling dependencies.
- **No email confirmation** — `enable_confirmations = false` means anyone can sign up with any email. Fine for testing, bad for production.

### Missing Features for Production
- **No email/notification system** — no welcome email, no password reset email configured (SMTP not set up)
- **No analytics or tracking** — no way to know how users are using the app
- **No error reporting** — no Sentry or similar. Errors happen silently in production.
- **No terms of service or privacy policy** — required for any app that stores user data and sends it to an AI
- **No data export** — users can't export their conversations or contacts
- **No API key rotation** — single Anthropic key hardcoded as a secret. If compromised, no rotation mechanism.

### UX Gaps
- **Contact "Add" button routes to New Reply** — confusing. Users expect a direct "add contact" form.
- **No way to delete contacts** — only conversations have soft delete
- **No dark/light mode toggle** — dark-only, which some users may not prefer
- **No onboarding** — new users land on an empty dashboard with no guidance beyond the empty state message
- **Reply history doesn't show which reply was selected** — the dashboard shows "Pending" for all conversations, even after selecting a reply
- **No search across conversations** — only contacts are searchable

---

## File Structure

```
reply-assistant/
  src/
    components/
      layout/     — AppShell (sidebar + outlet), ProtectedRoute
      ui/         — Button, Card, Badge, Input, Textarea, Modal, Spinner, etc.
      OutcomeNudge.tsx, RelationshipReport.tsx
    hooks/        — useAuth, useContacts, useConversations
    lib/          — claude.ts (AI client), supabase.ts (client init), utils.ts
    pages/        — Landing, Login, Signup, Dashboard, NewReply, ReplyView,
                    Contacts, ContactDetail, QuickReply, ContinueConversation,
                    Settings, NotFound
    styles/       — globals.css (tokens + base), design-system.css (docs)
    types/        — TypeScript interfaces, relationship types, goal chips
  supabase/
    functions/generate-replies/index.ts  — Edge function
  database.sql    — Full schema with RLS + trigger
  vercel.json     — SPA routing config
```

---

## Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Vercel frontend | Live, auto-deploys from GitHub main | Latest: build passes, all assets load |
| Supabase database | Running | Schema applied, RLS active, data persists |
| Supabase Auth | Configured | Site URL + redirect URLs set for production |
| Supabase Edge Function | Deployed (v3) | Active, but returning 401 on auth |
| Supabase Secrets | Set | ANTHROPIC_API_KEY verified present |
| Environment vars (Vercel) | Set | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (app loads + auth works) |

---

## Bottom Line

This app is about 85% done. The UI, auth, data layer, and UX flows are all solid — genuinely well-built. But the one thing the app exists to do (generate AI replies) doesn't work in production. Until that 401 is resolved, everything else is window dressing.

**Priority order to ship:**
1. Fix the edge function 401 (Critical — the app's reason to exist)
2. Remove placeholder testimonials from landing page
3. Enable email confirmation for signups
4. Add error reporting (Sentry or similar)
5. Add a loading timeout on AI generation
6. Add rate limiting on AI calls

---

*Assessment based on full source code review, automated Playwright testing (12 screenshots, 2 viewports), and Claude Cowork end-to-end browser testing.*
