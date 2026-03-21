import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, RefreshCw, GitBranch } from 'lucide-react'
import type { Ticket } from '@/types'
import { STATUSES, PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'
import { useStore } from '@/store/useStore'
import TagBadge from './TagBadge'

interface Props {
  ticket:      Ticket
  onEdit?:     () => void
  isDragging?: boolean
}

/** Strip markdown syntax for plain-text preview */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export default function TicketCard({ ticket, onEdit, isDragging }: Props) {
  const { deleteTicket, updateTicketStatus } = useStore()
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: String(ticket.id) })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortDragging ? 0.4 : 1,
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (window.confirm(`Delete "${ticket.title}"?`)) {
      await deleteTicket(ticket.id)
    }
  }

  // Long-press detection for mobile status picker
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Forward event to dnd-kit so dragging still works
    if (listeners?.onPointerDown) (listeners.onPointerDown as Function)(e)
    longPressTimer.current = setTimeout(() => setShowStatusPicker(true), 600)
  }

  const cancelLongPress = () => clearTimeout(longPressTimer.current)

  const priority   = ticket.priority   ? PRIORITY_LEVELS.find(p  => p.id  === ticket.priority)   : null
  const estimation = ticket.estimation ? ESTIMATION_SIZES.find(e => e.id === ticket.estimation) : null

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerMove={cancelLongPress}
        className={`card p-3 cursor-pointer group hover:border-slate-600 transition-all touch-none select-none
          ${isDragging ? 'shadow-2xl ring-1 ring-amber-500' : ''}`}
        onClick={showStatusPicker ? undefined : onEdit}
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">{ticket.title}</p>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all shrink-0 p-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {ticket.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {stripMd(ticket.description)}
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
            {ticket.is_routine && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                <RefreshCw size={9} />
                routine
              </span>
            )}
            {ticket.parent_id != null && !ticket.is_routine && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
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

      {/* Long-press status picker */}
      {showStatusPicker && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowStatusPicker(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-3 min-w-44 animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1">Move to…</p>
            {STATUSES.map(s => (
              <button
                key={s.id}
                className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-700
                  ${ticket.status === s.id ? s.color + ' bg-slate-700' : 'text-slate-300'}`}
                onClick={() => {
                  updateTicketStatus(ticket.id, s.id)
                  setShowStatusPicker(false)
                }}
              >
                <span className={`w-2 h-2 rounded-full border-2 ${s.border}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}


