import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, RefreshCw, GitBranch, CheckCheck, Calendar } from 'lucide-react'
import type { Ticket } from '@/types'
import { PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'
import TagBadge from './TagBadge'

interface Props {
  ticket:      Ticket
  onEdit?:     () => void
  isDragging?: boolean
  onMarkDone?: (ticket: Ticket) => void
  onDelete?:   (ticket: Ticket) => void
}

/** Extract a plain-text preview from a description (JSON structured or legacy markdown) */
function descPreview(raw: string): string {
  try {
    const p = JSON.parse(raw)
    if (p && typeof p === 'object' && 'why' in p) {
      const parts = [p.why, p.what].filter(Boolean)
      return parts.join(' · ').trim()
    }
  } catch {}
  // Legacy markdown: strip syntax
  return raw
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

/** Compute days until next routine occurrence for a routine template ticket */
function routineCountdown(ticket: Ticket): { label: string; cls: string } | null {
  if (!ticket.is_routine) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Determine next due date
  let next: Date | null = null

  if (!ticket.last_generated) {
    // Never generated — due now
    return { label: 'due now', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/40' }
  }

  const last = new Date(ticket.last_generated)
  last.setHours(0, 0, 0, 0)

  switch (ticket.frequency_type) {
    case 'daily': {
      next = new Date(last)
      next.setDate(next.getDate() + 1)
      break
    }
    case 'weekdays': {
      next = new Date(last)
      next.setDate(next.getDate() + 1)
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1)
      break
    }
    case 'weekly': {
      const names = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const days = ticket.frequency_days ?? []
      if (days.length === 0) return null
      next = new Date(today)
      next.setDate(next.getDate() + 1)
      for (let i = 0; i < 8; i++) {
        if (days.includes(names[next.getDay()])) break
        next.setDate(next.getDate() + 1)
      }
      break
    }
    case 'interval': {
      const interval = ticket.frequency_interval ?? 1
      let ref = last
      if (ticket.start_date) {
        const start = new Date(ticket.start_date)
        start.setHours(0, 0, 0, 0)
        if (start > last) ref = start
      }
      next = new Date(ref)
      next.setDate(next.getDate() + interval)
      break
    }
    default: return null
  }

  if (!next) return null
  const diff = Math.round((next.getTime() - today.getTime()) / 86_400_000)
  if (diff <= 0) return { label: 'due now', cls: 'bg-amber-500/15 text-amber-500 border-amber-500/40' }
  if (diff === 1) return { label: 'in 1d', cls: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/40' }
  return { label: `in ${diff}d`, cls: 'bg-slate-500/15 text-slate-400 border-slate-500/40' }
}


function dueDateBadge(dueDate: string): { label: string; cls: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, cls: 'bg-rose-500/15 text-rose-500 border-rose-500/40' }
  if (diff === 0) return { label: 'Due today',                  cls: 'bg-amber-500/15 text-amber-500 border-amber-500/40' }
  if (diff === 1) return { label: 'Tomorrow',                   cls: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/40' }
  if (diff <= 7)  return { label: `${diff}d left`,              cls: 'bg-yellow-500/10 text-yellow-600/70 border-yellow-500/25' }

  // Format as "25 Mar"
  const [, m, d] = dueDate.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return { label: `${parseInt(d)} ${months[parseInt(m) - 1]}`, cls: 'bg-slate-500/15 text-slate-500 border-slate-500/40' }
}

export default function TicketCard({ ticket, onEdit, isDragging, onMarkDone, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: String(ticket.id) })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortDragging ? 0.4 : 1,
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete?.(ticket)
  }

  const priority   = ticket.priority   ? PRIORITY_LEVELS.find(p  => p.id  === ticket.priority)   : null
  const estimation = ticket.estimation ? ESTIMATION_SIZES.find(e => e.id === ticket.estimation) : null

  return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`card p-3 cursor-pointer group hover:border-slate-600 transition-all select-none touch-manipulation
          ${isDragging ? 'shadow-2xl ring-1 ring-amber-500' : ''}`}
        onClick={onEdit}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-slate-100 leading-snug">{ticket.title}</p>
            <div className="flex items-center gap-0.5 shrink-0">
              {ticket.status !== 'done' && onMarkDone && (
                <button
                  onClick={e => { e.stopPropagation(); onMarkDone(ticket) }}
                  title="Mark as done"
                  className="text-slate-600 hover:text-emerald-400 transition-colors p-0.5"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="text-slate-600 hover:text-rose-400 transition-all p-0.5"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {ticket.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {descPreview(ticket.description)}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {priority && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${priority.badge}`}>
                {priority.label}
              </span>
            )}
            {estimation && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${estimation.badge}`}>
                {estimation.label}
              </span>
            )}
            {ticket.due_date && (() => {
              const { label, cls } = dueDateBadge(ticket.due_date)
              return (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>
                  <Calendar size={9} />
                  {label}
                </span>
              )
            })()}
            {ticket.is_routine && (() => {
              const countdown = routineCountdown(ticket)
              return (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/40">
                  <RefreshCw size={9} />
                  routine
                  {countdown && (
                    <span className={`ml-0.5 px-1 py-0 rounded text-[9px] font-semibold border ${countdown.cls}`}>
                      {countdown.label}
                    </span>
                  )}
                </span>
              )
            })()}
            {ticket.parent_id != null && !ticket.is_routine && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-500 border border-slate-500/40">
                <GitBranch size={9} />
                generated
              </span>
            )}
            {ticket.tags.map(tag => (
              <TagBadge key={tag.id} tag={tag} small />
            ))}
          </div>
        </div>
      </div>
  )
}

