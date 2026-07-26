import { useState } from 'react'
import { X, Plus, Swords } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket, PriorityLevel } from '@/types'
import { PRIORITY_LEVELS } from '@/types'
import TagBadge from './TagBadge'

function isGrayColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return Math.max(r, g, b) - Math.min(r, g, b) < 30
}

interface Props {
  skill?:  Ticket
  onClose: () => void
}

export default function SkillModal({ skill, onClose }: Props) {
  const { tags, createTicket, updateTicket, createTag } = useStore()

  const [name,           setName]           = useState(skill?.title ?? '')
  const [priority,       setPriority]       = useState<PriorityLevel | null>(skill?.priority ?? null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(skill?.tags.map(t => t.id) ?? [])
  const [newTagName,     setNewTagName]     = useState('')
  const [newTagColor,    setNewTagColor]    = useState('#ec4899')
  const [error,          setError]          = useState('')

  function toggleTag(id: number) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleAddTag() {
    if (!newTagName.trim()) return
    if (isGrayColor(newTagColor)) { setError('EPIC color cannot be a shade of gray'); return }
    const tag = createTag({ name: newTagName.trim(), color: newTagColor })
    setSelectedTagIds(prev => [...prev, tag.id])
    setNewTagName('')
    setError('')
  }

  function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    if (skill) {
      updateTicket(skill.id, { title: name.trim(), priority: priority ?? null, tag_ids: selectedTagIds })
    } else {
      createTicket({
        title:      name.trim(),
        status:     'backlog',
        priority:   priority ?? null,
        is_project: true,
        tag_ids:    selectedTagIds,
      })
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100 flex items-center gap-2">
            <Swords size={16} className="text-slate-400" />
            {skill ? 'Edit Skill' : 'New Skill'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Name *</label>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Cooking, Fashion, Guitar…"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Priority</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRIORITY_LEVELS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriority(priority === p.id ? null : p.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors
                    ${priority === p.id ? p.badge : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >
                  {p.label}
                </button>
              ))}
              {priority && (
                <button
                  onClick={() => setPriority(null)}
                  className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* EPICs */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">EPICs</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => {
                  const selected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="relative inline-flex items-center group"
                    >
                      <TagBadge tag={tag} small inactive={!selected} />
                      {selected && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-600 text-slate-300 flex items-center justify-center text-[9px] leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                          ×
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 h-8 text-xs"
                placeholder="New EPIC name…"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
              <input
                type="color"
                className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
              />
              <button onClick={handleAddTag} className="btn-ghost py-1 px-2 text-xs">
                <Plus size={13} />
              </button>
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{skill ? 'Save changes' : 'Create skill'}</button>
        </div>
      </div>
    </div>
  )
}
