import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Contact } from '@/types'

export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setContacts(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = async (contact: {
    name: string
    relationship_type: string
    relationship_notes?: string
  }) => {
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data, error: err } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        name: contact.name,
        relationship_type: contact.relationship_type,
        relationship_notes: contact.relationship_notes || null,
      })
      .select()
      .single()

    if (!err && data) {
      setContacts(prev => [data, ...prev])
    }
    return { data, error: err?.message ?? null }
  }

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error: err } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!err) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    }
    return { error: err?.message ?? null }
  }

  const getContact = async (id: string) => {
    const { data, error: err } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error: err?.message ?? null }
  }

  return { contacts, loading, error, fetchContacts, createContact, updateContact, getContact }
}
