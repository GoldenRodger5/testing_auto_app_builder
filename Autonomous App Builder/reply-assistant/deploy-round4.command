#!/bin/bash
# Round 4 Deploy Script — Run by double-clicking in Finder
# Removes nested .git if present, commits Round 4 fixes, and pushes to GitHub

set -e
cd "/Users/isaacmineo/PROJECT_2025/testing_auto_app_builder"

echo "=== Reply Assistant — Round 4 Deploy ==="
echo ""

# Remove the nested .git directory created by the sandbox if it exists
if [ -d "Autonomous App Builder/reply-assistant/.git" ]; then
  echo "Removing nested .git directory from reply-assistant/..."
  rm -rf "Autonomous App Builder/reply-assistant/.git"
  echo "✓ Cleaned up nested .git"
fi

echo ""
echo "[1/3] Staging Round 4 changes..."
git add -A
git status --short

echo ""
echo "[2/3] Committing..."
git commit -m "fix: Round 4 — dating profile extraction, PaywallModal, onboarding null fix, audienceMode crash

- ContactDetail: dating profile screenshot upload with Claude vision API
  Analyzes screenshot, extracts interests/bio signals, saves as dating_interests
  Displays editable interest chips; user can add/remove manually
- NewReply: PaywallModal shown on free_limit_reached (was showing inline error)
- NewReply: screenshot onPaywall now opens PaywallModal (was navigating to settings)
- NewReply: fix crash when profile.primary_audience is 'all' — guard with validAudiences
  array so audienceMode always falls back to 'personal' instead of undefined
- ProtectedRoute: treat onboarding_complete=null as complete (existing user fix)
- NotFound: 404 catch-all route confirmed (already implemented)
- ScreenshotUpload: HEIC handling confirmed working
- Style learning: confirmed end-to-end in edge function
- Follow-up nudge: timing logic confirmed correct

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

echo ""
echo "[3/3] Pushing to GitHub (triggers Vercel deploy)..."
git push origin main

echo ""
echo "=== Round 4 Deploy Complete! ==="
echo "Check Vercel: https://vercel.com/isaac-mineos-projects/reply-assistant"
echo "Live URL: https://reply-assistant-isaac-mineos-projects.vercel.app"
echo ""
echo "Press any key to close..."
read -n 1
