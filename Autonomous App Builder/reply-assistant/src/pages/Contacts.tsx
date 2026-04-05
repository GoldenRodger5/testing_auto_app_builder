import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { Button, Card, Badge, EmptyState, ContactCardSkeleton, Input, Textarea, Modal } from '@/components/ui'
import { getInitialColor, cn } from '@/lib/utils'
import { RELATIONSHIP_TYPES } from '@/types'

export default function Contacts() {
  const { contacts, loading, createContact, fetchContacts } = useContacts()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Friend')
  const [newNotes, setNewNotes] = useState('')
  const navigate = useNavigate()

  const handleAddContact = async () => {
    if (!newName.trim()) return
    const { data } = await createContact({
      name: newName.trim(),
      relationship_type: newType,
      relationship_notes: newNotes.trim() || undefined,
    })
    if (data) {
      setShowAddContact(false)
      setNewName('')
      setNewType('Friend')
      setNewNotes('')
      await fetchContacts()
    }
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name)
    return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  })

  return (
    <div className="p-5 lg:p-8 space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Contacts</h1>
        <Button size="sm" onClick={() => setShowAddContact(true)} className="btn-press">
          <UserPlus className="w-4 h-4 mr-1.5" /> Add
        </Button>
      </div>

      {contacts.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-card border border-border text-text-primary placeholder:text-text-muted outline-none focus:border-border-focus transition-colors text-sm"
            />
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                sortBy === 'recent' ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Most recent
            </button>
            <button
              onClick={() => setSortBy('alpha')}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                sortBy === 'alpha' ? 'bg-accent-soft text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <ContactCardSkeleton />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No contacts yet"
          description="Contacts are created automatically when you compose your first reply. Start by creating a new reply!"
          action={{ label: 'New Reply', onClick: () => navigate('/reply/new') }}
        />
      ) : filtered.length === 0 ? (
        <p className="text-center text-text-muted py-8 text-sm">No contacts matching "{search}"</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((contact, i) => (
            <div key={contact.id} className="card-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <Card
                hoverable
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getInitialColor(contact.name) }}
                >
                  <span className="font-semibold text-sm text-white/90">{contact.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{contact.name}</span>
                    <Badge variant="accent">{contact.relationship_type}</Badge>
                  </div>
                  {contact.preferred_reply_tone && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">Tone: {contact.preferred_reply_tone}</p>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddContact} onClose={() => setShowAddContact(false)} title="New Contact">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Their name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Relationship</label>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                    type === newType
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-card border-border text-text-secondary hover:border-border-focus'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Notes (optional)"
            placeholder="Tell me about this person..."
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            autoResize
          />
          <div className="flex gap-2">
            <Button onClick={handleAddContact} disabled={!newName.trim()} className="flex-1 btn-press">
              Create Contact
            </Button>
            <Button variant="ghost" onClick={() => setShowAddContact(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
