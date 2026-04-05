import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Conversation, ReplyDraft, ConversationSummary } from '@/types'

export function useConversations() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (err) {
      setError(err.message)
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const createConversation = async (params: {
    contact_id: string
    their_message: string
    user_goal: string
    context_notes?: string
    audience_context?: string
  }) => {
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error: err } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        contact_id: params.contact_id,
        their_message: params.their_message,
        user_goal: params.user_goal,
        context_notes: params.context_notes || null,
        audience_context: params.audience_context || 'personal',
      })
      .select('*, contact:contacts(*)')
      .single()

    if (!err && data) {
      setConversations(prev => [data, ...prev])
    }
    return { data, error: err?.message ?? null }
  }

  const saveDrafts = async (conversationId: string, drafts: { tone_label: string; tone_description: string; content: string }[]) => {
    const { data, error: err } = await supabase
      .from('reply_drafts')
      .insert(drafts.map(d => ({ ...d, conversation_id: conversationId })))
      .select()

    return { data, error: err?.message ?? null }
  }

  const getDrafts = async (conversationId: string) => {
    const { data, error: err } = await supabase
      .from('reply_drafts')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    return { data: data as ReplyDraft[] | null, error: err?.message ?? null }
  }

  const selectReply = async (conversationId: string, selectedReply: string) => {
    const { error: err } = await supabase
      .from('conversations')
      .update({ selected_reply: selectedReply })
      .eq('id', conversationId)

    if (!err) {
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, selected_reply: selectedReply } : c
      ))
    }
    return { error: err?.message ?? null }
  }

  const addOutcomeNotes = async (conversationId: string, outcomeNotes: string) => {
    const { error: err } = await supabase
      .from('conversations')
      .update({ outcome_notes: outcomeNotes })
      .eq('id', conversationId)

    if (!err) {
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, outcome_notes: outcomeNotes } : c
      ))
    }
    return { error: err?.message ?? null }
  }

  const getConversation = async (id: string) => {
    const { data, error: err } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('id', id)
      .single()

    return { data: data as Conversation | null, error: err?.message ?? null }
  }

  const getContactHistory = async (contactId: string, limit = 5): Promise<ConversationSummary[]> => {
    const { data } = await supabase
      .from('conversations')
      .select('their_message, selected_reply, outcome_notes, created_at, reply_drafts(tone_label)')
      .eq('contact_id', contactId)
      .is('deleted_at', null)
      .not('selected_reply', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!data) return []

    return data.map((c: any) => ({
      their_message_preview: c.their_message.slice(0, 100),
      selected_reply_preview: c.selected_reply?.slice(0, 100) ?? null,
      tone_used: c.reply_drafts?.[0]?.tone_label ?? null,
      outcome: c.outcome_notes ?? null,
      date: c.created_at,
    }))
  }

  const getContactConversations = async (contactId: string) => {
    const { data, error: err } = await supabase
      .from('conversations')
      .select('*, contact:contacts(*)')
      .eq('contact_id', contactId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    return { data: data as Conversation[] | null, error: err?.message ?? null }
  }

  return {
    conversations, loading, error,
    fetchConversations, createConversation,
    saveDrafts, getDrafts,
    selectReply, addOutcomeNotes,
    getConversation, getContactHistory, getContactConversations,
  }
}
