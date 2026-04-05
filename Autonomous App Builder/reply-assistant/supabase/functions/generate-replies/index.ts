// Supabase Edge Function: generate-replies
// Handles Claude API calls server-side — supports text + vision (screenshot) input

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConversationSummary {
  their_message_preview: string
  selected_reply_preview: string | null
  tone_used: string | null
  outcome: string | null
  date: string
}

interface GenerateRequest {
  // Legacy simple format (still supported)
  system?: string
  user?: string

  // Structured format
  contactName?: string
  relationshipType?: string
  relationshipNotes?: string | null
  conversationHistory?: ConversationSummary[]
  preferredTone?: string | null
  theirMessage?: string | null
  userGoal?: string
  contextNotes?: string | null
  audienceContext?: string
  styleExamples?: string[]

  // Vision / screenshot fields
  messageScreenshot?: string | null
  contextScreenshots?: string[]
  screenshotMimeType?: string

  // Dating-specific
  energyRead?: Record<string, unknown> | null
  datingPlatform?: string | null
  datingInterests?: string[] | null

  // Business-specific
  businessProfile?: {
    businessName?: string
    businessType?: string
    description?: string
    refundPolicy?: string
    cancellationPolicy?: string
    preferredTone?: string
    faqPairs?: Array<{ question: string; answer: string }>
  } | null

  // Mode: 'replies' (default) | 'profile_analysis' | 'follow_up'
  mode?: string
  followUpCount?: number
  daysSinceOriginal?: number
}

function buildRepliesPrompt(req: GenerateRequest): { system: string; userText: string } {
  const history = (req.conversationHistory || []).length > 0
    ? req.conversationHistory!.map((c, i) =>
        `${i + 1}. They said: "${c.their_message_preview}" → I replied (${c.tone_used || 'unknown tone'}): "${c.selected_reply_preview || 'no reply selected'}" → Outcome: ${c.outcome || 'not recorded'}`
      ).join('\n')
    : 'This is the first conversation with this contact'

  const audience = req.audienceContext || 'personal'

  const styleBlock = (req.styleExamples || []).filter(Boolean).length > 0
    ? `\nUSER'S WRITING VOICE — match this style in all generated replies:
Example messages this person has sent:
${req.styleExamples!.filter(Boolean).map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}

Write in a voice consistent with these examples. Mirror their punctuation style, message length preference, formality level, and word choices.\n`
    : ''

  let audienceBlock = ''
  if (audience === 'dating') {
    const energy = req.energyRead as Record<string, unknown> | null
    audienceBlock = `
DATING CONTEXT:
Platform: ${req.datingPlatform || 'unknown'}
Their interests from profile: ${(req.datingInterests || []).join(', ') || 'not captured'}
Energy read: ${energy ? `avg message length ${energy.avgMessageLength} words, ${energy.questionsPerMessage} questions/msg, signal: ${energy.engagementSignal}` : 'not available'}

IMPORTANT: Generate replies that:
- Sound completely natural, like a real person texting — NOT like AI
- Match the energy level described above (don't be more enthusiastic than their signal warrants)
- Reference specific interests or details if relevant and natural
- Are appropriately casual for the platform and stage of conversation
- Do NOT use pickup line language, generic openers, or anything scripted
- Use the user's own writing style from their style examples above
`
  } else if (audience === 'business' && req.businessProfile) {
    const bp = req.businessProfile
    const faqText = (bp.faqPairs || []).length > 0
      ? bp.faqPairs!.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
      : 'No FAQs set'
    audienceBlock = `
BUSINESS CONTEXT:
Business name: ${bp.businessName || 'not set'}
Type: ${bp.businessType || 'not set'}
Description: ${bp.description || 'not set'}
Refund policy: ${bp.refundPolicy || 'not set'}
Cancellation policy: ${bp.cancellationPolicy || 'not set'}
Preferred tone: ${bp.preferredTone || 'professional'}
FAQ reference:
${faqText}

Generate replies that represent this business professionally.
`
  } else if (audience === 'freelancer') {
    audienceBlock = `
FREELANCER CONTEXT:
This is a professional communication about freelance/client work.
Generate replies that are professional, clear, and protect the freelancer's interests and time.
`
  }

  let followUpBlock = ''
  if (req.mode === 'follow_up') {
    const count = req.followUpCount || 1
    const days = req.daysSinceOriginal || 5
    const ordinal = count === 1 ? 'first' : count === 2 ? 'second' : 'third'
    followUpBlock = `
FOLLOW-UP CONTEXT:
This is a follow-up message. The original was sent ${days} days ago with no response.
Follow-up count: ${count} (${ordinal} follow-up)
- Is natural and not desperate
- References the original topic without being pushy
- Gets progressively shorter and lower-investment
${count >= 3 ? '- This is the final follow-up. Close the loop gracefully.' : ''}
`
  }

  const screenshotNote = req.messageScreenshot
    ? '\n[SCREENSHOT PROVIDED: Extract the most recent incoming message from the screenshot. Use it as "their message" for reply generation.]\n'
    : ''

  const system = `You are a communication coach helping someone craft the perfect reply to a message they received.
Audience mode: ${audience}

Return exactly 3 reply options in valid JSON:
{
  "replies": [
    {
      "tone_label": "one word or short phrase",
      "tone_description": "one sentence describing the approach",
      "content": "the full reply text, ready to send"
    }
  ]
}

Return only valid JSON. No preamble, no explanation outside the JSON.`

  const userText = `${screenshotNote}${styleBlock}${audienceBlock}${followUpBlock}
ABOUT THE PERSON WHO SENT THIS MESSAGE:
Name: ${req.contactName || 'Unknown'}
Relationship: ${req.relationshipType || 'Unknown'}
Context about them: ${req.relationshipNotes || 'No additional context provided'}
Communication history:
${history}
Typical reply tone: ${req.preferredTone || 'Not yet established'}

THE MESSAGE I RECEIVED:
${req.theirMessage || (req.messageScreenshot ? '[See screenshot — extract the most recent incoming message]' : 'Not provided')}

MY GOAL:
${req.userGoal || 'Reply appropriately'}

ADDITIONAL CONTEXT:
${req.contextNotes || 'None'}

Generate 3 meaningfully different reply options. Each must be complete and ready to send. Do not use placeholders like [your name].`

  return { system, userText }
}

function buildClaudeMessages(req: GenerateRequest, textContent: string): unknown[] {
  const mimeType = (req.screenshotMimeType || 'image/jpeg') as string
  const contentParts: unknown[] = []

  if (req.messageScreenshot) {
    contentParts.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: req.messageScreenshot },
    })
  }

  for (const img of (req.contextScreenshots || [])) {
    if (img) {
      contentParts.push({
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: img },
      })
    }
  }

  contentParts.push({ type: 'text', text: textContent })
  return [{ role: 'user', content: contentParts }]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', detail: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: GenerateRequest = await req.json()

    // ── Paywall check ──────────────────────────────────────────────────────
    const { data: profileData } = await supabase
      .from('profiles')
      .select('subscription_tier, monthly_reply_count, reply_count_reset_at')
      .eq('id', user.id)
      .single()

    if (profileData) {
      const now = new Date()
      const resetAt = new Date(profileData.reply_count_reset_at || now)
      if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
        await supabase.from('profiles').update({
          monthly_reply_count: 0,
          reply_count_reset_at: now.toISOString(),
        }).eq('id', user.id)
        profileData.monthly_reply_count = 0
      }

      if ((profileData.subscription_tier || 'free') === 'free' && profileData.monthly_reply_count >= 5) {
        return new Response(
          JSON.stringify({
            error: 'free_limit_reached',
            message: 'You have used your 5 free replies this month',
            monthly_reply_count: profileData.monthly_reply_count,
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ── Get Anthropic key ──────────────────────────────────────────────────
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Build Claude request ───────────────────────────────────────────────
    const mode = body.mode || 'replies'
    let claudeBody: Record<string, unknown>

    if (body.system && body.user && !body.contactName) {
      // Legacy format
      claudeBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: body.system,
        messages: [{ role: 'user', content: body.user }],
      }
    } else if (mode === 'profile_analysis') {
      const prompt = `Analyze this dating profile screenshot. Extract:
1. Interests and hobbies (list as short phrases)
2. Job or career if mentioned
3. Strong personality signals from their bio
4. If this is a Hinge profile, note prompts they chose

Return ONLY valid JSON:
{"interests":[],"job":null,"bio_signals":[],"prompts":[]}`
      claudeBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: buildClaudeMessages(body, prompt),
      }
    } else {
      const { system, userText } = buildRepliesPrompt(body)
      claudeBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system,
        messages: buildClaudeMessages(body, userText),
      }
    }

    // ── Call Claude ────────────────────────────────────────────────────────
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(claudeBody),
    })

    const responseText = await anthropicResponse.text()

    // ── Increment usage on success ─────────────────────────────────────────
    if (anthropicResponse.ok && profileData) {
      await supabase.from('profiles').update({
        monthly_reply_count: (profileData.monthly_reply_count || 0) + 1,
      }).eq('id', user.id)
    }

    return new Response(responseText, {
      status: anthropicResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
