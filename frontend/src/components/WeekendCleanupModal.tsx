import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  MouseSensor, TouchSensor, useSensor, useSensors, closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import { X, GripVertical } from 'lucide-react'

import { useStore } from '@/store/useStore'
import type { Ticket, TicketStatus } from '@/types'

// The target statuses users can move weekend tickets to
const TARGETS: { id: TicketStatus; label: string; color: string; border: string }[] = [
  { id: 'backlog',     label: 'Backlog',     color: 'text-slate-400',  border: 'border-slate-500'  },
  { id: 'today',       label: 'Today',       color: 'text-amber-400',  border: 'border-amber-500'  },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400',   border: 'border-blue-500'   },
  { id: 'blocked',     label: 'Blocked',     color: 'text-rose-400',   border: 'border-rose-500'   },
]

// ── Draggable ticket row ─────────────────────────────────────────────────────
function DraggableTicket({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(ticket.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-white/30 hover:text-white/60 touch-none"
      >
        <GripVertical size={14} />
      </span>
      <span className="truncate flex-1">{ticket.title}</span>
      {ticket.status === 'saturday' && (
        <span className="shrink-0 text-xs text-violet-400">Sat</span>
      )}
      {ticket.status === 'sunday' && (
        <span className="shrink-0 text-xs text-violet-400">Sun</span>
      )}
    </div>
  )
}

// ── Drop column ──────────────────────────────────────────────────────────────
function DropColumn({
  target,
  tickets,
}: {
  target: (typeof TARGETS)[number]
  tickets: Ticket[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id })

  return (
    <div className="flex flex-col gap-2 min-w-0 flex-1">
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${target.color}`}>
        {target.label}
        <span className="ml-1 text-white/30 normal-case tracking-normal font-normal">
          ({tickets.length})
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[80px] rounded-xl border-2 border-dashed p-2 transition-colors ${
          isOver ? `${target.border} bg-white/5` : 'border-white/10'
        }`}
      >
        <SortableContext
          items={tickets.map(t => String(t.id))}
          strategy={verticalListSortingStrategy}
        >
          {tickets.map(t => (
            <DraggableTicket key={t.id} ticket={t} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <p className="text-xs text-white/20 text-center py-2">Drop here</p>
        )}
      </div>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────
interface Props {
  tickets: Ticket[]   // the saturday+sunday undone tickets
  onClose: () => void
}

export default function WeekendCleanupModal({ tickets, onClose }: Props) {
  const { updateTicketStatus, setWeekendCleanupDate } = useStore()

  // assignments: ticketId → targetStatus (default: backlog)
  const [assignments, setAssignments] = useState<Record<number, TicketStatus>>(
    () => Object.fromEntries(tickets.map(t => [t.id, 'backlog' as TicketStatus]))
  )

  // Track active drag for DragOverlay
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor,  { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    const t = tickets.find(t => String(t.id) === String(active.id))
    if (t) setActiveTicket(t)
  }

  function handleDragOver({ over }: DragOverEvent) {
    if (!over || !activeTicket) return
    const target = TARGETS.find(c => c.id === over.id)
    if (target) {
      setAssignments(prev => ({ ...prev, [activeTicket.id]: target.id }))
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTicket(null)
    if (!over) return
    const target = TARGETS.find(c => c.id === over.id)
    if (target) {
      const id = Number(active.id)
      setAssignments(prev => ({ ...prev, [id]: target.id }))
    }
  }

  function handleConfirm() {
    const today = new Date()
    for (const ticket of tickets) {
      const dest = assignments[ticket.id] ?? 'backlog'
      updateTicketStatus(ticket.id, dest)
    }
    // Mark cleanup as done for today (Monday)
    const dateStr = today.toISOString().slice(0, 10)
    setWeekendCleanupDate(dateStr)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">Weekend wrap-up</h2>
            <p className="text-xs text-white/50 mt-0.5">
              {tickets.length} unfinished task{tickets.length !== 1 ? 's' : ''} from the weekend — drag each where it belongs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* DnD board */}
        <div className="flex-1 overflow-y-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TARGETS.map(target => (
                <DropColumn
                  key={target.id}
                  target={target}
                  tickets={tickets.filter(t => (assignments[t.id] ?? 'backlog') === target.id)}
                />
              ))}
            </div>

            {createPortal(
              <DragOverlay>
                {activeTicket && (
                  <div className="rotate-1 opacity-90 flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white shadow-xl">
                    <GripVertical size={14} className="text-white/40" />
                    <span className="truncate">{activeTicket.title}</span>
                  </div>
                )}
              </DragOverlay>,
              document.body,
            )}
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-medium rounded-xl text-white transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
