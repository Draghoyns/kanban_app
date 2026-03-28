import { useState } from 'react'
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket } from '@/types'
import { WEEKDAYS } from '@/types'
import TicketModal from './TicketModal'
import { routineCountdown } from './TicketCard'

function freqLabel(t: Ticket): string {
  switch (t.frequency_type) {
    case 'daily':    return 'Every day'
    case 'weekdays': return 'Weekdays (Mon–Fri)'
    case 'weekly': {
      const days = (t.frequency_days ?? [])
        .map(d => WEEKDAYS.find(w => w.id === d)?.label ?? d)
        .join(', ')
      return `Weekly: ${days || '—'}`
    }
    case 'interval':
      return `Every ${t.frequency_interval ?? '?'} day${(t.frequency_interval ?? 1) !== 1 ? 's' : ''}`
    default:
      return '—'
  }
}

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RoutineTab() {
  const { tickets, deleteTicket } = useStore()

  const [editRoutine, setEditRoutine] = useState<Ticket | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)

  const templates = tickets.filter(t => t.is_routine)
  const today     = todayDateStr()

  // Find today's instance for a given template
  function todayInstance(templateId: number): Ticket | undefined {
    return tickets.find(
      t => t.parent_id === templateId && t.created_at.startsWith(today)
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Repeat size={14} />
          Routines
        </h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary ml-auto shrink-0">
          <Plus size={15} /> New routine
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-3">
            <Repeat size={40} strokeWidth={1} />
            <p className="text-sm">No routines yet. Create your first one!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> New routine
            </button>
          </div>
        ) : (
          templates.map(template => {
            const instance = todayInstance(template.id)
            const instanceLabel =
              instance?.status === 'done'        ? 'Done ✓'              :
              instance?.status === 'in_progress' ? 'In progress'         :
              instance?.status === 'blocked'     ? 'Blocked'             :
              instance                           ? 'In today'            :
              template.last_generated?.startsWith(today) ? 'Done ✓'     : // last_generated === today means instance was completed & cleared
              null

            const instanceColor =
              instance?.status === 'done' || (!instance && template.last_generated?.startsWith(today))
                ? 'text-emerald-500'
                : instance
                  ? 'text-amber-400'
                  : 'text-slate-600'

            const dotColor =
              instance?.status === 'done' ? 'bg-emerald-500' :
              instance                    ? 'bg-amber-400'   :
              'bg-slate-600'

            return (
              <div
                key={template.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-500/10 border border-slate-500/20"
              >
                {/* Status dot */}
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotColor}`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{template.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{freqLabel(template)}</p>
                  {(() => {
                    const cd = routineCountdown(template)
                    return cd ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-1 ${cd.cls}`}>
                        {cd.label}
                      </span>
                    ) : null
                  })()}
                  {template.start_date && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      From {new Date(template.start_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  {instanceLabel && (
                    <p className={`text-xs mt-1 font-medium ${instanceColor}`}>
                      Today: {instanceLabel}
                    </p>
                  )}
                  {!instanceLabel && (
                    <p className="text-xs mt-1 text-slate-600">Not due yet today</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditRoutine(template)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-500/20 transition-colors"
                    title="Edit routine"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteTicket(template.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                    title="Delete routine"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showCreate && (
        <TicketModal
          initialIsRoutine
          onClose={() => setShowCreate(false)}
        />
      )}

      {editRoutine && (
        <TicketModal
          ticket={editRoutine}
          onClose={() => setEditRoutine(null)}
        />
      )}
    </div>
  )
}
