#!/bin/bash
# Reply Assistant — Deployment Script
# Run this from the project root: bash deploy.sh

set -e

echo "=== Reply Assistant Deployment ==="
echo ""

# 1. Stage and commit all changes
echo "[1/5] Committing all changes..."
git add -A
git commit -m "feat: Round 2 complete — UI overhaul, 5 features, edge function, deployment config

Phase 1: QA fixes (404 route, outcome tracking)
Phase 2: 5 new features (editable drafts, quick reply, continue conversation, relationship report, regenerate with guidance)
Phase 3: Full UI overhaul (design system, responsive layout, all pages rebuilt)
Phase 4: Supabase Edge Function for secure Claude API calls

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" || echo "Nothing to commit"

# 2. Create GitHub repo and push
echo ""
echo "[2/5] Setting up GitHub..."
if ! git remote | grep -q origin; then
  gh repo create reply-assistant --private --source=. --remote=origin --push
else
  echo "Remote origin already exists, pushing..."
  git push -u origin master || git push -u origin main
fi

# 3. Verify no secrets in repo
echo ""
echo "[3/5] Security check..."
if grep -r "sk-ant" src/ 2>/dev/null; then
  echo "ERROR: Found API key in source! Aborting."
  exit 1
fi
echo "✓ No secrets found in source"

# 4. Deploy Supabase Edge Function
echo ""
echo "[4/5] Deploying Supabase Edge Function..."
if command -v supabase &> /dev/null; then
  echo "Setting Anthropic API key as Supabase secret..."
  echo "Enter your Anthropic API key when prompted:"
  supabase secrets set ANTHROPIC_API_KEY
  echo "Deploying edge function..."
  supabase functions deploy generate-replies
  echo "✓ Edge function deployed"
else
  echo "⚠ Supabase CLI not found. Install with: npm install -g supabase"
  echo "  Then run:"
  echo "    supabase login"
  echo "    supabase link --project-ref YOUR_PROJECT_REF"
  echo "    supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key"
  echo "    supabase functions deploy generate-replies"
fi

# 5. Deploy to Vercel
echo ""
echo "[5/5] Deploying to Vercel..."
if command -v vercel &> /dev/null; then
  echo "Setting environment variables..."
  echo "You'll need to set these in the Vercel dashboard or CLI:"
  echo "  VITE_SUPABASE_URL"
  echo "  VITE_SUPABASE_ANON_KEY"
  echo ""
  vercel --prod
else
  echo "⚠ Vercel CLI not found. Install with: npm install -g vercel"
  echo "  Then run: vercel login && vercel --prod"
fi

echo ""
echo "=== Deployment complete! ==="
