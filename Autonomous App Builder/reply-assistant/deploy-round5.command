#!/bin/bash
# Round 5 Deploy Script — Run by double-clicking in Finder
# Commits P2 UI fixes and pushes to GitHub (triggers Vercel deploy)

set -e
cd "/Users/isaacmineo/PROJECT_2025/testing_auto_app_builder"

echo "=== Reply Assistant — Round 5 Deploy ==="
echo ""

# Remove any nested .git directory if it exists
if [ -d "Autonomous App Builder/reply-assistant/.git" ]; then
  echo "Removing nested .git directory from reply-assistant/..."
  rm -rf "Autonomous App Builder/reply-assistant/.git"
  echo "✓ Cleaned up nested .git"
fi

echo ""
echo "[1/3] Staging Round 5 changes..."
git add -A
git status --short

echo ""
echo "[2/3] Committing..."
git commit -m "fix: Round 5 — P2 UI improvements

- App.tsx: Redirect logged-in users from / to /dashboard via HomeRoute
  component (checks auth, redirects to /dashboard or /onboarding)
- NewReply.tsx: Fix audience mode chevron — ChevronRight → ChevronDown
  with rotate-180 (open state) for standard dropdown UX
- Dashboard.tsx: Hide 'Recent Conversations' header when no conversations
  Only shown when recent.length > 0
- Dashboard.tsx: Add free tier usage counter in greeting area
  Shows X/5 replies used; Upgrade button appears at 4+ uses
  Imports and shows PaywallModal on upgrade click
- Settings.tsx: Add 'Default Reply Mode' section with 4 mode buttons
  Updates profile.primary_audience; guards against invalid 'all' value
- Settings.tsx: Pre-fill Display Name from profile via useEffect
  Syncs when profile loads async after mount
- Settings.tsx: Add Business Profile free-tier note with Upgrade CTA
  Shows only for free tier users in Business mode
- ContactDetail.tsx: Fix dating profile upload zone
  - Copy updated: 'Tap or drag a screenshot to extract their interests'
  - Drag-and-drop fully implemented (onDragOver/Enter/Leave/Drop)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

echo ""
echo "[3/3] Pushing to GitHub (triggers Vercel deploy)..."
git push origin main

echo ""
echo "=== Round 5 Deploy Complete! ==="
echo "Check Vercel: https://vercel.com/isaac-mineos-projects/reply-assistant"
echo "Live URL: https://reply-assistant-isaac-mineos-projects.vercel.app"
echo ""
echo "=== IMPORTANT: Edge Function Action Required ==="
echo "The Supabase edge function 'generate-replies' is returning"
echo "'Failed to send a request to the Edge Function' in production."
echo "Please re-deploy it with:"
echo "  cd supabase"
echo "  supabase functions deploy generate-replies --no-verify-jwt"
echo ""
echo "Press any key to close..."
read -n 1
