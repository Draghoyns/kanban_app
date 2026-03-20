import { useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

import { useStore } from '@/store/useStore'
import { STATUSES, type Ticket, type TicketStatus } from '@/types'
import KanbanColumn from './KanbanColumn'
import TicketCard   from './TicketCard'
import TicketModal  from './TicketModal'

export default function KanbanBoard() {
  const { tickets, updateTicketStatus } = useStore()

  const [activeTicket, setActiveTicket]     = useState<Ticket | null>(null)
  const [localTickets, setLocalTickets]     = useState<Ticket[]>([])
  const [createStatus, setCreateStatus]     = useState<TicketStatus | null>(null)
  const [editTicket,   setEditTicket]       = useState<Ticket | null>(null)

  // Use local copy during drag to enable optimistic moves
  const displayed = activeTicket ? localTickets : tickets

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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

    // Is the target a column header droppable?
    const overStatus = STATUSES.find(s => s.id === overId)
    // Or another ticket?
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
    const movedId   = Number(active.id)
    const final     = localTickets.find(t => t.id === movedId)
    setActiveTicket(null)

    if (final) {
      const original = tickets.find(t => t.id === movedId)
      if (original && original.status !== final.status) {
        await updateTicketStatus(movedId, final.status)
      }
    }
  }

  const ticketsByStatus = (status: TicketStatus) =>
    displayed.filter(t => t.status === status).sort((a, b) => a.position - b.position)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 overflow-x-auto flex-1 items-start">
          {STATUSES.map(status => (
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
