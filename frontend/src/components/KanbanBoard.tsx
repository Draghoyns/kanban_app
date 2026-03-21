import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

import { useStore } from '@/store/useStore'
import { STATUSES, type Ticket, type TicketStatus } from '@/types'
import KanbanColumn from './KanbanColumn'
import TicketCard   from './TicketCard'
import TicketModal  from './TicketModal'
import FilterBar, { type ActiveFilters } from './FilterBar'

function ticketMatchesFilter(ticket: Ticket, filters: ActiveFilters): boolean {
  const priorityOk = filters.priorities.length === 0 ||
    (ticket.priority != null && filters.priorities.includes(ticket.priority))
  const epicOk = filters.epicIds.length === 0 ||
    ticket.tags.some(t => filters.epicIds.includes(t.id))
  const estimationOk = filters.estimations.length === 0 ||
    (ticket.estimation != null && filters.estimations.includes(ticket.estimation))
  return priorityOk && epicOk && estimationOk
}

export default function KanbanBoard() {
  const { tickets, updateTicketStatus, hideDone } = useStore()

  const [activeTicket, setActiveTicket]   = useState<Ticket | null>(null)
  const [localTickets, setLocalTickets]   = useState<Ticket[]>([])
  const [createStatus, setCreateStatus]   = useState<TicketStatus | null>(null)
  const [editTicket,   setEditTicket]     = useState<Ticket | null>(null)
  const [filters,      setFilters]        = useState<ActiveFilters>({ priorities: [], epicIds: [], estimations: [] })

  const visibleStatuses = hideDone ? STATUSES.filter(s => s.id !== 'done') : STATUSES

  // Use local copy during drag to enable optimistic moves
  const displayed = activeTicket ? localTickets : tickets

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    const ticket = tickets.find(t => String(t.id) === String(active.id))
    if (ticket) {
      setActiveTicket(ticket)
      setLocalTickets([...tickets])
    }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || !activeTicket) return

    const overId = String(over.id)

    const overStatus = STATUSES.find(s => s.id === overId)
    const overTicket = localTickets.find(t => String(t.id) === overId)

    const newStatus: TicketStatus | null = overStatus
      ? overStatus.id
      : overTicket
        ? overTicket.status
        : null

    if (!newStatus) return

    setLocalTickets(prev =>
      prev.map(t => String(t.id) === String(active.id) ? { ...t, status: newStatus } : t)
    )
  }

  async function handleDragEnd({ active }: DragEndEvent) {
    const movedId = Number(active.id)
    const final   = localTickets.find(t => t.id === movedId)
    setActiveTicket(null)

    if (final) {
      const original = tickets.find(t => t.id === movedId)
      if (original && original.status !== final.status) {
        await updateTicketStatus(movedId, final.status)
      }
    }
  }

  const PRIORITY_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }

  const ticketsByStatus = (status: TicketStatus) =>
    displayed
      .filter(t => t.status === status)
      .filter(t => ticketMatchesFilter(t, filters))
      .sort((a, b) => {
        const pa = a.priority != null ? (PRIORITY_ORDER[a.priority] ?? 99) : 99
        const pb = b.priority != null ? (PRIORITY_ORDER[b.priority] ?? 99) : 99
        if (pa !== pb) return pa - pb
        return a.position - b.position
      })

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 overflow-x-auto flex-1 items-start">
          {visibleStatuses.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              tickets={ticketsByStatus(status.id)}
              onAddTicket={() => setCreateStatus(status.id)}
              onEditTicket={setEditTicket}
            />
          ))}
        </div>

        {createPortal(
          <DragOverlay>
            {activeTicket && (
              <div className="rotate-2 opacity-90">
                <TicketCard ticket={activeTicket} isDragging />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {createStatus !== null && (
        <TicketModal
          initialStatus={createStatus}
          onClose={() => setCreateStatus(null)}
        />
      )}

      {editTicket && (
        <TicketModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
        />
      )}
    </>
  )
}
