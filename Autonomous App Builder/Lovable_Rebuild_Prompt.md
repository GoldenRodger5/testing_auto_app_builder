# Reply Assistant — Lovable Build Prompt

## App Overview

Build **Reply Assistant** — a web app that helps users craft the perfect reply to any message. Users paste a message they received, select who sent it (with relationship context), set a goal for their reply, and the app generates 3 distinct AI-powered reply options using Claude. The app remembers contacts and past conversations to improve suggestions over time.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **AI:** Claude API via Supabase Edge Function (keep API key server-side)
- **Fonts:** Outfit (headings), DM Sans (body) — Google Fonts

## Design System

Dark theme only. Deep navy-black background with warm amber accent.

**Colors:**
- Background primary: `#080c16` (deepest), secondary: `#0f1524`, card: `#161e2e`, hover: `#1e2a3e`
- Accent: `#e08a4e` (warm amber), hover: `#d47a3e`, soft: `rgba(224,138,78,0.12)`
- Text: primary `#f0f2f5`, secondary `#8b95a8`, muted `#4f5b6e`
- Borders: `#232f42`, focus: `#e08a4e`
- Semantic: success `#4ade80`, error `#f87171`, warning `#fbbf24`

**Typography:**
- Headings: Outfit (bold, geometric)
- Body: DM Sans (clean, readable)
- Base: 15px, scale: 11/13/15/18/22/28/36/48px

**Border radius:** sm 8px, md 12px, lg 16px, xl 20px, full (pill)

**Shadows:** Subtle for cards, medium for modals, glow for primary CTAs (`0 0 20px rgba(224,138,78,0.25)`)

**Animations:** Fast 150ms (hover), normal 200ms (transitions), slow 300ms (modals). Page entrance: fade + translateY(4px). Card entrance: staggered with translateY(8px). Button press: scale(0.97) on active.

**Special effects:** Glass-effect nav (`backdrop-filter: blur(16px)` over semi-transparent bg), gradient text on accent keywords, glow ring on focus.

## Database Schema

```sql
-- Profiles (auto-created on signup via trigger)
profiles: id (uuid, FK auth.users), display_name (text), created_at

-- Contacts
contacts: id (uuid), user_id (FK profiles), name, relationship_type, relationship_notes (nullable), preferred_reply_tone (nullable, learned from usage), created_at, updated_at

-- Conversations
conversations: id (uuid), user_id (FK profiles), contact_id (FK contacts), their_message, user_goal, context_notes (nullable), selected_reply (nullable), outcome_notes (nullable), deleted_at (nullable, soft delete), created_at

-- Reply Drafts
reply_drafts: id (uuid), conversation_id (FK conversations), tone_label, tone_description, content, created_at
```

Enable Row Level Security on all tables. Each user can only access their own data (`auth.uid() = user_id`). Reply drafts are secured via a subquery on conversations.

Create a trigger function `handle_new_user()` that auto-inserts a profile row when a user signs up, using `display_name` from user metadata or email prefix as fallback.

Add indexes on: contacts(user_id), conversations(user_id), conversations(contact_id), conversations(deleted_at), reply_drafts(conversation_id).

## Pages

### 1. Landing Page (`/`)
Marketing page. Dark background.
- **Nav:** "Reply" logo (chat bubble icon + text) left, "Log in" text link + "Get Started" amber pill button right
- **Hero:** "Never struggle with a reply **again**" — "again" in amber accent/gradient. Subtitle about pasting a message and getting 3 replies. Two CTAs: "Sign up free" (amber filled) + "See how it works" (outline, scrolls to how-it-works section)
- **Pain point callout:** "You know what you want to say, but finding the right words — the tone that lands, the phrasing that gets results — that's the hard part."
- **How It Works section (id="how-it-works"):** 3 steps — "Paste the message" → "Set your goal" → "Get 3 perfect replies." Each with icon and short description.
- **Differentiator section:** "Unlike ChatGPT, Reply remembers who your contacts are" — explains contact memory, relationship context, conversation history
- **Testimonials section:** 3 testimonial cards (placeholder content for now)
- **Bottom CTA:** "Ready to never overthink a reply again?" with signup button
- **Footer:** "Reply" logo + copyright

### 2. Login (`/login`)
Centered card on dark background. Chat bubble icon. "Welcome back" heading. Email + Password fields. Amber "Log in" button. "Don't have an account? Sign up" link.

### 3. Signup (`/signup`)
Same layout as login. "Create your account" heading, "Start crafting better replies today" subtitle. Fields: Your name, Email, Password ("At least 6 characters" hint). Amber "Create account" button. "Already have an account? Log in" link.

### 4. Dashboard (`/dashboard`) — Protected
- Time-of-day greeting: "Good morning/afternoon/evening, {name}"
- "What do you need to reply to?" subtitle
- Full-width amber "New Reply" button with + icon
- "Recent Conversations" section — cards showing: contact avatar (colored circle with initial), contact name, relationship badge, message preview (truncated), timestamp, status (Pending/Completed)
- Empty state: chat bubble icon, "No replies yet", "Your replies will appear here."
- **Layout:** Sidebar (240px) on desktop with nav links (Dashboard, New Reply, Contacts, Settings). Bottom nav bar on mobile with 4 tabs.

### 5. New Reply Wizard (`/reply/new`) — Protected
4-step flow with animated progress dots at top.

**Step 1 — Their Message:**
- Large textarea: "Paste or type the message here..." with character counter (max 5000)
- If contact pre-selected (from Quick Reply), show amber banner: "Replying to {name}" with "Change" button

**Step 2 — Who Sent This?:**
- Search field for existing contacts
- "+ New Contact" button (dashed border card)
- Clicking "New Contact" shows inline form: Name, Relationship type chips (Manager, Partner, Friend, Client, Colleague, Family, Acquaintance, Other — toggleable pills), Notes textarea (optional, 1000 char max), Create + Cancel buttons
- Existing contacts listed as selectable cards with checkmark on selection

**Step 3 — What's Your Goal?:**
- Toggleable goal chips: "Set a boundary", "Decline politely", "Buy time", "Patch things up", "Get information", "Negotiate", "Apologize", "Clarify something"
- Selecting a chip highlights it (amber + glow). Chip selection is SEPARATE from the textarea below.
- Textarea: "Add more detail (optional)..." — for custom goal text. Both chip and textarea are combined on submit.
- "Add more context (optional)" expandable section with another textarea
- Button changes to "Generate Replies" with sparkle icon

**Step 4 — Generating (loading state):**
- Centered sparkle icon (pulsing)
- Rotating messages: "Reading between the lines...", "Thinking about {name}...", "Crafting different strategies...", "Drafting your options..."
- "This usually takes 5-10 seconds" subtitle
- Spinner
- On error: show error message with "Try Again" button

After generation succeeds, redirect to `/reply/:id`.

### 6. Reply View (`/reply/:id`) — Protected
- Back arrow, "Reply Options" heading, "for {contact name}" subtitle
- Context card: shows their message (truncated) + goal badge
- **3 draft cards** with staggered entrance animation (200ms delay each):
  - Tone label in accent (e.g., "Direct"), tone description in muted text
  - Full reply text
  - Edit button (pencil icon) — opens inline textarea with Save/Cancel
  - Two buttons: "Copy" (secondary) + "Use This Reply" (primary)
  - Copy shows green checkmark flash on success
- **After selecting a reply:** Success screen with checkmark, "Reply saved!", "You chose the {tone} approach". Optional outcome textarea: "How do you think it'll go?" with Save & Done / Skip buttons.
- **Regenerate section** at bottom: "Not quite right?" → shows guidance input ("Make it shorter, Less formal...") → "Regenerate" button. Max 2 regenerations, then suggests starting fresh.

### 7. Contacts (`/contacts`) — Protected
- "Contacts" heading + "Add" button (routes to new reply)
- Search bar + sort toggle (Most recent / A-Z)
- Contact cards: colored avatar circle, name, relationship badge, preferred tone if set
- Empty state: "No contacts yet — contacts are created automatically when you compose your first reply"

### 8. Contact Detail (`/contacts/:id`) — Protected
- Back arrow, avatar, name, relationship badge
- Relationship Notes section
- "New Reply from {name}" amber button (Quick Reply)
- Relationship Report section — locked until 3+ conversations: "Have 3+ conversations with {name} to unlock insights"
- Conversation History list — cards with timestamp, status, message preview

### 9. Settings (`/settings`) — Protected
- Display Name (editable + Save button)
- Email (read-only)
- Change Password button
- Sign Out button (full-width, dark card style)
- Danger Zone (red border): "Permanently delete your account and all data. This cannot be undone." + red Delete Account button

### 10. 404 Page
- Large muted "404" text
- Location pin icon in amber
- "Page not found" heading
- Description text
- Contextual CTA: "Go to Dashboard" (if authenticated) or "Go to Login" (if not)

## Supabase Edge Function: generate-replies

```typescript
// POST /functions/v1/generate-replies
// Requires valid user JWT in Authorization header
// Body: { system: string, user: string }
// Returns: Claude API response (3 reply drafts in JSON)

// Steps:
// 1. Verify Authorization header exists
// 2. Validate JWT via supabase.auth.getUser()
// 3. Check ANTHROPIC_API_KEY env var
// 4. Call Claude API (claude-sonnet-4-20250514, max_tokens 2048)
// 5. Return response

// CORS: Allow-Origin *, Allow-Headers: authorization, x-client-info, apikey, content-type
```

The client-side `claude.ts` module:
- Builds a structured prompt with contact context, relationship notes, conversation history, and the user's goal
- Calls the edge function via `supabase.functions.invoke('generate-replies', { body })`
- Parses the response expecting `{ replies: [{ tone_label, tone_description, content }] }` — exactly 3 replies
- Has 2-attempt retry logic and specific 429 rate-limit handling
- Falls back to a `/api/generate` Vite proxy endpoint for local development

## Key Behaviors

- **Contact memory:** The AI prompt includes the contact's name, relationship type, notes, preferred tone (learned from previous selections), and up to 5 past conversation summaries.
- **Tone learning:** When a user selects a reply, the contact's `preferred_reply_tone` updates to that draft's `tone_label`. Future prompts include this preference.
- **Soft delete:** Conversations use `deleted_at` instead of hard delete.
- **Quick Reply:** From a contact detail page, starts the wizard with the contact pre-selected (skips step 2).
- **Continue Conversation:** Resumes from an existing conversation's context.
- **Outcome tracking:** Optional "How did it go?" prompt after selecting a reply. Stored as `outcome_notes` and included in future prompts for that contact.

## Important Notes

- The app is dark-theme only
- Mobile-first responsive design — bottom nav on mobile, sidebar on desktop
- All auth pages (login, signup) are public; all app pages are protected with redirect to /login
- The landing page is a full marketing page, not a simple login redirect
- SPA routing — all routes serve index.html (Vercel rewrites configured)
- Lazy-load protected page components with React.lazy + Suspense
- No email confirmation required for signup (for now)
