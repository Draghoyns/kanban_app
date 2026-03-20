import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, RefreshCw, GitBranch } from 'lucide-react'
import type { Ticket } from '@/types'
import { useStore } from '@/store/useStore'
import TagBadge from './TagBadge'

interface Props {
  ticket:     Ticket
  onEdit?:    () => void
  isDragging?: boolean
}

export default function TicketCard({ ticket, onEdit, isDragging }: Props) {
  const { deleteTicket } = useStore()

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-3 cursor-pointer group hover:border-slate-600 transition-all
        ${isDragging ? 'shadow-2xl ring-1 ring-indigo-500' : ''}`}
      onClick={onEdit}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-slate-600 hover:text-slate-400 mt-0.5 cursor-grab active:cursor-grabbing shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">{ticket.title}</p>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all shrink-0 p-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {ticket.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ticket.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {ticket.is_routine && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
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
    </div>
  )
}

