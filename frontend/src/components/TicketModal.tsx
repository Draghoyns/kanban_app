import { useState, useEffect } from 'react'
import { X, Plus, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket, TicketStatus, FrequencyType } from '@/types'
import { STATUSES, WEEKDAYS } from '@/types'
import TagBadge from './TagBadge'

interface Props {
  ticket?:        Ticket
  initialStatus?: TicketStatus
  onClose:        () => void
}

const FREQ_OPTIONS: { id: FrequencyType; label: string }[] = [
  { id: 'daily',    label: 'Daily'    },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly',   label: 'Weekly'   },
  { id: 'interval', label: 'Interval' },
]

export default function TicketModal({ ticket, initialStatus = 'backlog', onClose }: Props) {
  const { tags, createTicket, updateTicket, createTag } = useStore()

  const [title,          setTitle]          = useState(ticket?.title       ?? '')
  const [description,    setDescription]    = useState(ticket?.description ?? '')
  const [status,         setStatus]         = useState<TicketStatus>(ticket?.status ?? initialStatus)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(ticket?.tags.map(t => t.id) ?? [])
  const [newTagName,     setNewTagName]     = useState('')
  const [newTagColor,    setNewTagColor]    = useState('#6366f1')
  const [error,          setError]          = useState('')

  // Routine state
  const [isRoutine,      setIsRoutine]      = useState(ticket?.is_routine         ?? false)
  const [frequencyType,  setFrequencyType]  = useState<FrequencyType>(ticket?.frequency_type ?? 'daily')
  const [frequencyDays,  setFrequencyDays]  = useState<string[]>(ticket?.frequency_days ?? [])
  const [freqInterval,   setFreqInterval]   = useState(ticket?.frequency_interval ?? 2)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleTag(id: number) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleDay(day: string) {
    setFrequencyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleAddTag() {
    if (!newTagName.trim()) return
    const tag = createTag({ name: newTagName.trim(), color: newTagColor })
    setSelectedTagIds(prev => [...prev, tag.id])
    setNewTagName('')
  }

  function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    const routineFields = isRoutine
      ? {
          is_routine:         true,
          frequency_type:     frequencyType,
          frequency_days:     frequencyType === 'weekly' ? frequencyDays : undefined,
          frequency_interval: frequencyType === 'interval' ? freqInterval : undefined,
        }
      : {
          is_routine:         false,
          frequency_type:     null  as null,
          frequency_days:     null  as null,
          frequency_interval: null  as null,
        }

    const payload = {
      title:       title.trim(),
      description: description.trim() || undefined,
      status,
      tag_ids:     selectedTagIds,
      ...routineFields,
    }
    if (ticket) {
      updateTicket(ticket.id, payload)
    } else {
      createTicket({ ...payload, status })
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100">{ticket ? 'Edit Ticket' : 'New Ticket'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Title *</label>
            <input
              autoFocus
              className="input"
              placeholder="Ticket title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Optional description…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors
                    ${status === s.id
                      ? `${s.border} ${s.color} bg-slate-800`
                      : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Routine section ─────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-700 p-3 space-y-3">
            <button
              onClick={() => setIsRoutine(v => !v)}
              className="flex items-center gap-2 w-full"
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0
                ${isRoutine ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                {isRoutine && <span className="text-white text-[10px] leading-none">✓</span>}
              </div>
              <RefreshCw size={13} className={isRoutine ? 'text-indigo-400' : 'text-slate-500'} />
              <span className="text-xs font-medium text-slate-300">Routine ticket</span>
            </button>

            {isRoutine && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setFrequencyType(opt.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors
                        ${frequencyType === opt.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {frequencyType === 'weekly' && (
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`w-9 py-1 rounded-lg text-xs font-medium border transition-colors
                          ${frequencyDays.includes(day.id)
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                )}

                {frequencyType === 'interval' && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Every</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="input w-16 text-center py-1"
                      value={freqInterval}
                      onChange={e => setFreqInterval(Math.max(1, Number(e.target.value)))}
                    />
                    <span>days</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`transition-opacity ${selected ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <TagBadge tag={tag} small />
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                className="input flex-1 h-8 text-xs"
                placeholder="New tag name…"
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
          <button onClick={handleSave} className="btn-primary">
            {ticket ? 'Save changes' : 'Create ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}


