import { useState } from 'react'
import { BarChart3, Sparkles, RefreshCw } from 'lucide-react'
import { ClaudeAPIError } from '@/lib/claude'
import { supabase } from '@/lib/supabase'
import { Button, Card, Spinner } from '@/components/ui'
import type { Contact, Conversation } from '@/types'
import { truncate } from '@/lib/utils'

interface ReportData {
  dynamic_summary: string
  patterns: string[]
  what_works: string
  suggestion: string
}

interface RelationshipReportProps {
  contact: Contact
  conversations: Conversation[]
}

async function generateReport(contact: Contact, conversations: Conversation[]): Promise<ReportData> {
  const historyText = conversations
    .filter(c => c.selected_reply)
    .map(c => {
      return `Date: ${new Date(c.created_at).toLocaleDateString()}
Their message: ${truncate(c.their_message, 200)}
My reply: ${truncate(c.selected_reply || '', 200)}
Outcome: ${c.outcome_notes || 'Not recorded'}`
    }).join('\n\n')

  const system = `You are an empathetic communication analyst. Based on the following conversation history, provide a warm, specific, and actionable relationship communication analysis.

Return a JSON object with this exact structure:
{
  "dynamic_summary": "2-3 sentence description of the overall relationship communication dynamic",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "what_works": "1-2 sentences on what's working well",
  "suggestion": "One specific, actionable suggestion for communicating better with this person"
}

Return only valid JSON. Be specific — use details from the actual conversations, not generic advice.`

  const user = `Contact: ${contact.name}, ${contact.relationship_type}
About them: ${contact.relationship_notes || 'No additional context'}
Preferred tone: ${contact.preferred_reply_tone || 'Not established'}

Conversation history:
${historyText}`

  // Try edge function first, fall back to Vite proxy
  let data: any
  const { data: edgeData, error: edgeError } = await supabase.functions.invoke('generate-replies', {
    body: { system, user },
  })

  if (edgeError) {
    // Fall back to local proxy
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user }),
    })

    if (!response.ok) {
      throw new ClaudeAPIError('Failed to generate report', response.status)
    }

    data = await response.json()
  } else {
    data = edgeData
  }

  const text = data.content?.[0]?.text || data.text || ''
  return JSON.parse(text)
}

export function RelationshipReport({ contact, conversations }: RelationshipReportProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completedConvos = conversations.filter(c => c.selected_reply)
  const canGenerate = completedConvos.length >= 3

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await generateReport(contact, completedConvos)
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    }
    setLoading(false)
  }

  if (!canGenerate) {
    return (
      <div className="opacity-60">
        <Button variant="secondary" size="sm" disabled className="w-full">
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Relationship Report
        </Button>
        <p className="text-xs text-text-muted text-center mt-1.5">
          Have 3+ conversations with {contact.name} to unlock insights
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Spinner className="w-4 h-4 text-accent" />
          <p className="text-sm text-text-secondary">Analyzing your communication history with {contact.name}...</p>
        </div>
      </Card>
    )
  }

  if (report) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-sm">Relationship Insights</h3>
          </div>
          <button
            onClick={handleGenerate}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
            title="Regenerate report"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{report.dynamic_summary}</p>

        <div className="space-y-1.5">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Patterns</p>
          <ul className="space-y-1">
            {report.patterns.map((p, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-accent mt-1">•</span> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">What's working</p>
          <p className="text-sm text-text-secondary">{report.what_works}</p>
        </div>

        <div className="p-3 rounded-xl bg-accent-soft border border-accent/20 space-y-1">
          <p className="text-xs text-accent font-medium uppercase tracking-wider">Suggestion</p>
          <p className="text-sm text-text-primary">{report.suggestion}</p>
        </div>

        <p className="text-[10px] text-text-muted text-right">Generated by AI</p>
      </Card>
    )
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-xs text-error text-center">{error}</p>}
      <Button variant="secondary" size="sm" onClick={handleGenerate} className="w-full">
        <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Get Relationship Report
      </Button>
    </div>
  )
}
