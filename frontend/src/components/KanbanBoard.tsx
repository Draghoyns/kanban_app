import { useState, useRef, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  MouseSensor, TouchSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'

import { useStore } from '@/store/useStore'
import { STATUSES, type Ticket, type TicketStatus } from '@/types'
import KanbanColumn        from './KanbanColumn'
import TicketCard          from './TicketCard'
import TicketModal         from './TicketModal'
import FilterBar, { type ActiveFilters } from './FilterBar'
import WeekendCleanupModal from './WeekendCleanupModal'

// Returns the day-appropriate visible statuses:
// on weekends replace Today with Saturday + Sunday; on weekdays keep Today.
function getVisibleStatuses(hideDone: boolean) {
  const dow = new Date().getDay() // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6
  return STATUSES.filter(s => {
    if (s.id === 'done' && hideDone) return false
    if (isWeekend && s.id === 'today')    return false  // swap out Today
    if (!isWeekend && s.id === 'saturday') return false // keep on weekends only
    if (!isWeekend && s.id === 'sunday')   return false
    return true
  })
}

const PRIORITY_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }

function ticketMatchesFilter(ticket: Ticket, filters: ActiveFilters): boolean {
  const priorityOk = filters.priorities.length === 0 ||
    (ticket.priority != null && filters.priorities.includes(ticket.priority))
  const epicOk = filters.epicIds.length === 0 ||
    ticket.tags.some(t => filters.epicIds.includes(t.id))
  const estimationOk = filters.estimations.length === 0 ||
    (ticket.estimation != null && filters.estimations.includes(ticket.estimation))

  let dueDateOk = true
  if (filters.dueDate === 'no_due_date') {
    dueDateOk = ticket.due_date == null
  } else if (filters.dueDate != null && ticket.due_date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(ticket.due_date + 'T00:00:00')
    const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
    if (filters.dueDate === 'overdue')    dueDateOk = diff < 0
    if (filters.dueDate === 'this_week')  dueDateOk = diff >= 0 && diff <= 7
    if (filters.dueDate === 'this_month') dueDateOk = diff >= 0 && diff <= 31
  } else if (filters.dueDate != null) {
    // Ticket has no due date — exclude it when a due-date filter is active
    dueDateOk = false
  }

  return priorityOk && epicOk && estimationOk && dueDateOk
}

export default function KanbanBoard() {
  const { tickets, updateTicketStatus, reorderColumn, deleteTicket, hideDone,
          newTicketTrigger, focusedColumn, setFocusedColumn,
          weekendCleanupDate, setWeekendCleanupDate } = useStore()

  const [activeTicket, setActiveTicket]   = useState<Ticket | null>(null)
  const [localTickets, setLocalTickets]   = useState<Ticket[]>([])
  const [createStatus, setCreateStatus]   = useState<TicketStatus | null>(null)
  const [editTicket,   setEditTicket]     = useState<Ticket | null>(null)
  const [filters,      setFilters]        = useState<ActiveFilters>({ priorities: [], epicIds: [], estimations: [], dueDate: null })
  const [search,       setSearch]         = useState('')
  const [showCleanup,  setShowCleanup]    = useState(false)

  // Weekend migration: if it's a weekend and there are orphaned 'today' tickets,
  // move them to backlog so they stay visible and can be re-planned.
  useEffect(() => {
    const dow = new Date().getDay() // 0=Sun, 6=Sat
    if (dow !== 6 && dow !== 0) return
    const orphans = tickets.filter(t => t.status === 'today')
    for (const t of orphans) updateTicketStatus(t.id, 'backlog')
  }, []) // run once on mount

  // Monday cleanup: if today is Monday and we haven't cleaned up yet, and there
  // are leftover saturday/sunday tickets, open the cleanup modal.
  useEffect(() => {
    const dow = new Date().getDay()
    const todayStr = new Date().toISOString().slice(0, 10)
    if (dow !== 1) return                            // only on Mondays
    if (weekendCleanupDate === todayStr) return      // already done today
    const leftovers = tickets.filter(
      t => !t.is_routine && (t.status === 'saturday' || t.status === 'sunday')
    )
    if (leftovers.length > 0) {
      setShowCleanup(true)
    } else {
      // Nothing to clean up — mark done so we don't check again today
      setWeekendCleanupDate(todayStr)
    }
  }, [])  // run once on mount

  // Open new-ticket modal when shortcut fires
  useEffect(() => {
    if (newTicketTrigger > 0) setCreateStatus('backlog')
  }, [newTicketTrigger])

  // Android back button: close topmost open modal
  useEffect(() => {
    function onBack(e: Event) {
      if (showCleanup)        { setShowCleanup(false);  e.preventDefault(); return }
      if (editTicket !== null) { setEditTicket(null);   e.preventDefault(); return }
      if (createStatus !== null) { setCreateStatus(null); e.preventDefault(); return }
    }
    window.addEventListener('app:backButton', onBack)
    return () => window.removeEventListener('app:backButton', onBack)
  }, [showCleanup, editTicket, createStatus])

  // Scroll to the column requested by a notification tap
  useEffect(() => {
    if (!focusedColumn) return
    const el = document.querySelector(`[data-col="${focusedColumn}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setFocusedColumn(null)
  }, [focusedColumn])

  // Undo toast state (mark-done)
  const [undoTicket, setUndoTicket]     = useState<{ ticket: Ticket; prevStatus: TicketStatus } | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout>>()
  const [undoProgress, setUndoProgress] = useState(0)
  const progressTimer = useRef<ReturnType<typeof setInterval>>()

  // Pending-delete undo state
  const [deleteTicketPending, setDeleteTicketPending] = useState<Ticket | null>(null)
  const deleteTimer        = useRef<ReturnType<typeof setTimeout>>()
  const deleteProgressTimer = useRef<ReturnType<typeof setInterval>>()
  const [deleteProgress, setDeleteProgress] = useState(0)

  function handleDeleteTicket(ticket: Ticket) {
    // If another delete/undo is in flight, immediately commit it
    if (deleteTicketPending) {
      clearTimeout(deleteTimer.current)
      clearInterval(deleteProgressTimer.current)
      deleteTicket(deleteTicketPending.id)
    }
    // Cancel any mark-done undo too (one toast at a time)
    clearTimeout(undoTimer.current)
    clearInterval(progressTimer.current)
    setUndoTicket(null)

    setDeleteTicketPending(ticket)
    setDeleteProgress(0)
    const start = Date.now()
    const DURATION = 5000
    deleteProgressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start
      setDeleteProgress(Math.min(elapsed / DURATION, 1))
      if (elapsed >= DURATION) clearInterval(deleteProgressTimer.current)
    }, 50)
    deleteTimer.current = setTimeout(() => {
      deleteTicket(ticket.id)
      setDeleteTicketPending(null)
      setDeleteProgress(0)
    }, DURATION)
  }

  function handleUndoDelete() {
    clearTimeout(deleteTimer.current)
    clearInterval(deleteProgressTimer.current)
    setDeleteTicketPending(null)
    setDeleteProgress(0)
  }

  function handleMarkDone(ticket: Ticket) {
    const prevStatus = ticket.status
    updateTicketStatus(ticket.id, 'done')
    // Cancel any pending delete (one toast at a time)
    if (deleteTicketPending) {
      clearTimeout(deleteTimer.current)
      clearInterval(deleteProgressTimer.current)
      deleteTicket(deleteTicketPending.id)
      setDeleteTicketPending(null)
    }
    // Clear any existing undo
    clearTimeout(undoTimer.current)
    clearInterval(progressTimer.current)
    setUndoTicket({ ticket, prevStatus })
    setUndoProgress(0)
    // Animate progress bar
    const start = Date.now()
    const DURATION = 5000
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - start
      setUndoProgress(Math.min(elapsed / DURATION, 1))
      if (elapsed >= DURATION) clearInterval(progressTimer.current)
    }, 50)
    // Auto-dismiss
    undoTimer.current = setTimeout(() => {
      setUndoTicket(null)
      setUndoProgress(0)
    }, DURATION)
  }

  function handleUndo() {
    if (!undoTicket) return
    clearTimeout(undoTimer.current)
    clearInterval(progressTimer.current)
    updateTicketStatus(undoTicket.ticket.id, undoTicket.prevStatus)
    setUndoTicket(null)
    setUndoProgress(0)
  }

  const visibleStatuses = getVisibleStatuses(hideDone)

  // Use local copy during drag to enable optimistic moves
  const displayed = (activeTicket ? localTickets : tickets)
    .filter(t => t.id !== deleteTicketPending?.id)
    .filter(t => !t.is_routine)                                        // templates live only in Routine tab
    .filter(t => !(t.parent_id !== null && t.status === 'done'))       // done routine instances disappear

  const sensors = useSensors(
    useSensor(MouseSensor,  { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,  { activationConstraint: { delay: 250, tolerance: 8 } })
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

    const activeId = String(active.id)
    const overId   = String(over.id)
    if (activeId === overId) return

    const overStatus = STATUSES.find(s => s.id === overId)
    const overTicket = localTickets.find(t => String(t.id) === overId)

    const newStatus: TicketStatus | null = overStatus
      ? overStatus.id
      : overTicket?.status ?? null

    if (!newStatus) return

    const activeIndex = localTickets.findIndex(t => String(t.id) === activeId)
    const overIndex   = localTickets.findIndex(t => String(t.id) === overId)

    if (overStatus) {
      // Dropped on a column header — change status only, place at end
      setLocalTickets(prev =>
        prev.map(t => String(t.id) === activeId ? { ...t, status: newStatus } : t)
      )
    } else if (overTicket) {
      if (activeTicket.status === overTicket.status) {
        // Same column — only reorder within the same priority group
        if (activeTicket.priority === overTicket.priority) {
          setLocalTickets(prev => arrayMove(prev, activeIndex, overIndex))
        }
      } else {
        // Cross-column — change status and insert near the over ticket
        setLocalTickets(prev =>
          arrayMove(
            prev.map(t => String(t.id) === activeId ? { ...t, status: newStatus } : t),
            activeIndex,
            overIndex,
          )
        )
      }
    }
  }

  function handleDragEnd({ active }: DragEndEvent) {
    const movedId = Number(active.id)
    const final   = localTickets.find(t => t.id === movedId)
    setActiveTicket(null)

    if (final) {
      const original = tickets.find(t => t.id === movedId)
      if (!original) return

      if (original.status !== final.status) {
        updateTicketStatus(movedId, final.status)
      } else {
        const columnIds = localTickets
          .filter(t => t.status === final.status && t.priority === final.priority)
          .map(t => t.id)
        reorderColumn(columnIds)
      }
    }
  }

  const ticketsByStatus = (status: TicketStatus) => {
    const q = search.trim().toLowerCase()
    return displayed
      .filter(t => t.status === status)
      .filter(t => ticketMatchesFilter(t, filters))
      .filter(t => {
        if (!q) return true
        if (t.title.toLowerCase().includes(q)) return true
        if (t.description) {
          try {
            const p = JSON.parse(t.description)
            if (typeof p === 'object' && p !== null) {
              return [p.why, p.what, ...(p.how ?? []).map((h: { text: string }) => h.text)]
                .filter(Boolean).some((s: string) => s.toLowerCase().includes(q))
            }
          } catch {}
          return t.description.toLowerCase().includes(q)
        }
        return false
      })
      .sort((a, b) => {
        const pa = a.priority != null ? (PRIORITY_ORDER[a.priority] ?? 99) : 99
        const pb = b.priority != null ? (PRIORITY_ORDER[b.priority] ?? 99) : 99
        if (pa !== pb) return pa - pb
        return a.position - b.position
      })
  }

  const weekendLeftovers = tickets.filter(
    t => !t.is_routine && (t.status === 'saturday' || t.status === 'sunday')
  )

  return (
    <>
      {showCleanup && weekendLeftovers.length > 0 && (
        <WeekendCleanupModal
          tickets={weekendLeftovers}
          onClose={() => {
            setShowCleanup(false)
            setWeekendCleanupDate(new Date().toISOString().slice(0, 10))
          }}
        />
      )}
      <FilterBar filters={filters} onChange={setFilters} search={search} onSearch={setSearch} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-4 p-4 items-stretch h-full">
          {visibleStatuses.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              tickets={ticketsByStatus(status.id)}
              onAddTicket={() => setCreateStatus(status.id)}
              onEditTicket={setEditTicket}
              onMarkDone={handleMarkDone}
              onDeleteTicket={handleDeleteTicket}
            />
          ))}
        </div>
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

      {/* Undo toast */}
      {undoTicket && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <span className="text-sm text-slate-300">
              Ticket done
            </span>
            <button
              onClick={handleUndo}
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            >
              Undo
            </button>
          </div>
          {/* Progress bar draining left-to-right */}
          <div className="h-0.5 bg-slate-500/30">
            <div
              className="h-full transition-none"
              style={{ width: `${(1 - undoProgress) * 100}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>,
        document.body
      )}
      {/* Delete undo toast */}
      {deleteTicketPending && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-72 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <span className="text-sm text-slate-300 truncate">
              Deleted "{deleteTicketPending.title}"
            </span>
            <button
              onClick={handleUndoDelete}
              className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}
            >
              Undo
            </button>
          </div>
          <div className="h-0.5 bg-slate-500/30">
            <div
              className="h-full transition-none"
              style={{ width: `${(1 - deleteProgress) * 100}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
