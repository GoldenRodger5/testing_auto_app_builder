#!/bin/bash
# Reply Assistant v3 — Deploy Script
# Double-click this file in Finder to run, OR paste into Terminal

cd "$(dirname "$0")"

echo "📦 Staging all changes..."
git add .

echo "💾 Committing..."
git commit -m "feat: Reply Assistant v3 — screenshot input, 4 audiences, dating mode, style learning, paywall, UI overhaul

- Screenshot upload component with drag-and-drop (JPEG/PNG/WEBP/HEIC, up to 4 images)
- Claude Vision API integration for message extraction from screenshots
- Four-audience architecture: Personal / Freelance / Business / Dating
- Onboarding flow (audience selection, name, style learning, business profile)
- Audience mode selector on New Reply (per-reply override)
- Audience-specific goal chips (10 per mode via goalChips.ts)
- Dating contact fields: platform, interests, status, energy metrics
- Energy analysis library (avgMessageLength, questionsPerMessage, engagementSignal)
- Style learning: 3 example messages stored on profile, included in every prompt
- Follow-up generation with nudge badges on dashboard
- Tone quick-adjust chips on ReplyView (Shorter/Warmer/Firmer/etc, max 3 uses)
- Paywall modal with 3 pricing tiers (payment UI only — coming soon)
- Usage tracking in Edge Function: free tier capped at 5 replies/month
- Business Profile settings section with FAQ pairs
- My Voice settings section
- Landing page rebuilt: 4 use cases, pricing section, screenshot feature
- Database: 9 new columns across profiles/contacts/conversations + business_profiles table
- Edge Function v6: structured params, vision support, paywall check, follow-up mode
- All pages compile cleanly (TypeScript + Vite build verified)"

echo "🚀 Pushing to GitHub (triggers Vercel deploy)..."
git push

echo ""
echo "✅ Done! Vercel is deploying now."
echo "   Check: https://vercel.com/isaac-mineos-projects/reply-assistant"
echo "   Live:  https://reply-assistant-isaac-mineos-projects.vercel.app"
