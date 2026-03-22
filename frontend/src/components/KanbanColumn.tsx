import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, AlertTriangle } from 'lucide-react'
import type { Ticket, TicketStatus } from '@/types'
import { useStore } from '@/store/useStore'
import TicketCard from './TicketCard'

interface Props {
  status:         { id: TicketStatus; label: string; color: string; border: string }
  tickets:        Ticket[]
  onAddTicket:    () => void
  onEditTicket:   (ticket: Ticket) => void
  onMarkDone:     (ticket: Ticket) => void
  onDeleteTicket: (ticket: Ticket) => void
}

export default function KanbanColumn({ status, tickets, onAddTicket, onEditTicket, onMarkDone, onDeleteTicket }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })
  const wipLimits = useStore(s => s.wipLimits)
  const wipLimit        = wipLimits[status.id]
  const nonRoutineCount = tickets.filter(t => !t.is_routine).length
  const overWip         = wipLimit != null && nonRoutineCount > wipLimit

  return (
    <div className="flex flex-col w-[80vw] md:w-[360px] shrink-0 min-h-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 mb-2 rounded-lg border-l-2 ${status.border} ${overWip ? 'bg-amber-950/40' : 'bg-slate-900/60'}`}>
        <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
        <div className="flex items-center gap-2">
          {overWip && (
            <span className="flex items-center gap-1 text-xs text-amber-400" title={`WIP limit: ${wipLimit}`}>
              <AlertTriangle size={11} />
              {nonRoutineCount}/{wipLimit}
            </span>
          )}
          {!overWip && wipLimit != null && (
            <span className="text-xs text-slate-500" title={`WIP limit: ${wipLimit}`}>
              {nonRoutineCount}/{wipLimit}
            </span>
          )}
          {wipLimit == null && (
            <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
              {tickets.length}
            </span>
          )}
          <button
            onClick={onAddTicket}
            className="text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded"
            title={`Add to ${status.label}`}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors overflow-y-auto flex-1 ${
          isOver ? 'bg-slate-800/60 ring-1 ring-indigo-500/50' : 'bg-transparent'
        }`}
      >
        <SortableContext items={tickets.map(t => String(t.id))} strategy={verticalListSortingStrategy}>
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onEdit={() => onEditTicket(ticket)}
              onMarkDone={onMarkDone}
              onDelete={onDeleteTicket}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <button
            onClick={onAddTicket}
            className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-400
                       border border-dashed border-slate-700 hover:border-slate-600
                       rounded-lg py-4 transition-colors"
          >
            <Plus size={13} /> Add ticket
          </button>
        )}
      </div>
    </div>
  )
}
