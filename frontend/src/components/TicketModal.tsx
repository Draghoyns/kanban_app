import { useState, useEffect } from 'react'
import { X, Plus, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket, TicketStatus, FrequencyType, PriorityLevel, EstimationSize } from '@/types'
import { STATUSES, WEEKDAYS, PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'
import TagBadge from './TagBadge'
import MarkdownField from './MarkdownField'

interface Props {
  ticket?:          Ticket
  initialStatus?:   TicketStatus
  initialIsRoutine?: boolean
  onClose:          () => void
}

const FREQ_OPTIONS: { id: FrequencyType; label: string }[] = [
  { id: 'daily',    label: 'Daily'    },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekly',   label: 'Weekly'   },
  { id: 'interval', label: 'Interval' },
]

interface HowSubItem { id: string; text: string; done: boolean }
interface HowItem    { id: string; text: string; done: boolean; subItems: HowSubItem[] }

function parseDescription(raw?: string | null): { why: string; what: string; how: HowItem[] } {
  if (!raw) return { why: '', what: '', how: [] }
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object' && 'why' in p) {
      const how: HowItem[] = Array.isArray(p.how)
        ? p.how.map((item: HowItem) => ({ ...item, subItems: item.subItems ?? [] }))
        : []
      return { why: p.why ?? '', what: p.what ?? '', how }
    }
  } catch {}
  return { why: raw, what: '', how: [] }
}

export default function TicketModal({ ticket, initialStatus = 'backlog', initialIsRoutine = false, onClose }: Props) {
  const { tags, createTicket, updateTicket, createTag } = useStore()

  const parsed = parseDescription(ticket?.description)

  const [title,          setTitle]          = useState(ticket?.title           ?? '')
  const [why,            setWhy]            = useState(parsed.why)
  const [what,           setWhat]           = useState(parsed.what)
  const [howItems,       setHowItems]       = useState<HowItem[]>(parsed.how)
  const [howInput,       setHowInput]       = useState('')
  const [subInputId,     setSubInputId]     = useState<string | null>(null)
  const [subInput,       setSubInput]       = useState('')
  const [status,         setStatus]         = useState<TicketStatus>(ticket?.status ?? initialStatus)
  const [priority,       setPriority]       = useState<PriorityLevel | null>(ticket?.priority ?? null)
  const [estimation,     setEstimation]     = useState<EstimationSize | null>(ticket?.estimation ?? null)
  const [dueDate,        setDueDate]        = useState<string>(ticket?.due_date ?? '')
  const [startDate,      setStartDate]      = useState<string>(
    ticket?.start_date ?? new Date().toISOString().split('T')[0]
  )
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(ticket?.tags.map(t => t.id) ?? [])
  const [newTagName,     setNewTagName]     = useState('')
  const [newTagColor,    setNewTagColor]    = useState('#ec4899')
  const [error,          setError]          = useState('')

  // Routine state
  const [isRoutine,      setIsRoutine]      = useState(ticket?.is_routine         ?? initialIsRoutine)
  const [frequencyType,  setFrequencyType]  = useState<FrequencyType>(ticket?.frequency_type ?? 'daily')
  const [frequencyDays,  setFrequencyDays]  = useState<string[]>(ticket?.frequency_days ?? [])
  const [freqInterval,   setFreqInterval]   = useState<string>(String(ticket?.frequency_interval ?? 2))

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

  function addHowItem() {
    if (!howInput.trim()) return
    setHowItems(prev => [...prev, { id: crypto.randomUUID(), text: howInput.trim(), done: false, subItems: [] }])
    setHowInput('')
  }

  function updateHowItem(id: string, text: string) {
    setHowItems(prev => prev.map(item => item.id === id ? { ...item, text } : item))
  }

  function toggleHowItem(id: string) {
    setHowItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  function removeHowItem(id: string) {
    setHowItems(prev => prev.filter(item => item.id !== id))
  }

  function openSubInput(parentId: string) {
    setSubInputId(parentId)
    setSubInput('')
  }

  function addSubItem(parentId: string) {
    if (!subInput.trim()) { setSubInputId(null); return }
    setHowItems(prev => prev.map(item =>
      item.id === parentId
        ? { ...item, subItems: [...item.subItems, { id: crypto.randomUUID(), text: subInput.trim(), done: false }] }
        : item
    ))
    setSubInput('')
    setSubInputId(null)
  }

  function updateSubItem(parentId: string, subId: string, text: string) {
    setHowItems(prev => prev.map(item =>
      item.id === parentId
        ? { ...item, subItems: item.subItems.map(s => s.id === subId ? { ...s, text } : s) }
        : item
    ))
  }

  function toggleSubItem(parentId: string, subId: string) {
    setHowItems(prev => prev.map(item =>
      item.id === parentId
        ? { ...item, subItems: item.subItems.map(s => s.id === subId ? { ...s, done: !s.done } : s) }
        : item
    ))
  }

  function removeSubItem(parentId: string, subId: string) {
    setHowItems(prev => prev.map(item =>
      item.id === parentId
        ? { ...item, subItems: item.subItems.filter(s => s.id !== subId) }
        : item
    ))
  }

  function handleAddTag() {
    if (!newTagName.trim()) return
    const tag = createTag({ name: newTagName.trim(), color: newTagColor })
    setSelectedTagIds(prev => [...prev, tag.id])
    setNewTagName('')
  }

  function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (isRoutine && frequencyType === 'interval' && freqInterval.trim() === '') { setError('Interval days cannot be empty'); return }
    const routineFields = isRoutine
      ? {
          is_routine:         true,
          frequency_type:     frequencyType,
          frequency_days:     frequencyType === 'weekly' ? frequencyDays : undefined,
          frequency_interval: frequencyType === 'interval' ? Number(freqInterval) : undefined,
          start_date:         startDate.trim() || null,
        }
      : {
          is_routine:         false,
          frequency_type:     null  as null,
          frequency_days:     null  as null,
          frequency_interval: null  as null,
          start_date:         null  as null,
        }

    const descPayload = { why: why.trim(), what: what.trim(), how: howItems }
    const hasDesc = descPayload.why || descPayload.what || descPayload.how.length > 0

    const payload = {
      title:       title.trim(),
      description: hasDesc ? JSON.stringify(descPayload) : undefined,
      status,
      priority,
      estimation,
      due_date:    isRoutine ? null : (dueDate.trim() || null),
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
          {/* Title */}
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

          {/* Estimation */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Estimation</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ESTIMATION_SIZES.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEstimation(estimation === e.id ? null : e.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors
                    ${estimation === e.id ? e.badge : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                >
                  {e.label}
                </button>
              ))}
              {estimation && (
                <button
                  onClick={() => setEstimation(null)}
                  className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Due date / Start date */}
          <div>
            {isRoutine ? (
              <>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Start date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="input text-sm h-8 w-40"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Used as the anchor for interval counting. Change to reset the cycle.</p>
              </>
            ) : (
              <>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Due date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="input text-sm h-8 w-40"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                  {dueDate && (
                    <button
                      onClick={() => setDueDate('')}
                      className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Why */}
          <MarkdownField
            label="Why"
            value={why}
            onChange={setWhy}
            rows={2}
            placeholder="Why does this ticket exist?"
          />

          {/* What */}
          <MarkdownField
            label="What"
            value={what}
            onChange={setWhat}
            rows={2}
            placeholder="What needs to be done?"
          />

          {/* How */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">How</label>
            {howItems.length > 0 && (
              <div className="space-y-1 mb-2">
                {howItems.map(item => (
                  <div key={item.id}>
                    {/* Parent item */}
                    <div className="flex items-start gap-2 group">
                      <button
                        onClick={() => toggleHowItem(item.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5
                          ${item.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-slate-600 hover:border-slate-400'}`}
                      >
                        {item.done && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
                      </button>
                      <textarea
                        rows={1}
                        className={`flex-1 bg-transparent text-sm leading-snug outline-none focus:outline-none min-w-0 resize-none overflow-hidden
                          ${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}
                        value={item.text}
                        onChange={e => { updateHowItem(item.id, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                        onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                      />
                      <button
                        onClick={() => openSubInput(item.id)}
                        title="Add sub-step"
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-[var(--accent)] transition-all p-0.5 mt-0.5"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        onClick={() => removeHowItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all p-0.5 mt-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Sub-items */}
                    {item.subItems.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.subItems.map(sub => (
                          <div key={sub.id} className="flex items-start gap-2 group">
                            <button
                              onClick={() => toggleSubItem(item.id, sub.id)}
                              className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5
                                ${sub.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-slate-600 hover:border-slate-400'}`}
                            >
                              {sub.done && <span className="text-white text-[8px] leading-none font-bold">✓</span>}
                            </button>
                            <textarea
                              rows={1}
                              className={`flex-1 bg-transparent text-xs leading-snug outline-none focus:outline-none min-w-0 resize-none overflow-hidden
                                ${sub.done ? 'line-through text-slate-500' : 'text-slate-400'}`}
                              value={sub.text}
                              onChange={e => { updateSubItem(item.id, sub.id, e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                              onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                            />
                            <button
                              onClick={() => removeSubItem(item.id, sub.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all p-0.5 mt-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-item input */}
                    {subInputId === item.id && (
                      <div className="ml-6 mt-1 flex items-center gap-2">
                        <input
                          autoFocus
                          className="input flex-1 h-7 text-xs"
                          placeholder="Add sub-step…"
                          value={subInput}
                          onChange={e => setSubInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); addSubItem(item.id) }
                            if (e.key === 'Escape') { setSubInputId(null) }
                          }}
                          onBlur={() => addSubItem(item.id)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 h-8 text-xs"
                placeholder="Add step…"
                value={howInput}
                onChange={e => setHowInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHowItem() } }}
              />
              <button onClick={addHowItem} className="btn-ghost py-1 px-2 text-xs">
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Status */}
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
                ${isRoutine ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                {isRoutine && <span className="text-slate-950 text-[10px] leading-none font-bold">✓</span>}
              </div>
              <RefreshCw size={13} className={isRoutine ? 'text-amber-400' : 'text-slate-500'} />
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
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-semibold'
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
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-semibold'
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
                      onChange={e => setFreqInterval(e.target.value)}
                    />
                    <span>days</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* EPICs (formerly Tags) */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">EPICs</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => {
                const selected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`relative inline-flex items-center group transition-opacity ${selected ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <TagBadge tag={tag} small />
                    {selected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-600 text-slate-300 flex items-center justify-center text-[9px] leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                        ×
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
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
          <button onClick={handleSave} className="btn-primary">
            {ticket ? 'Save changes' : 'Create ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}


