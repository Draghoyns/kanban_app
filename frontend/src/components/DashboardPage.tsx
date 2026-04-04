import { useState } from 'react'
import { BarChart2, Zap, CheckCheck, Hash } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PRIORITY_LEVELS } from '@/types'

type Period = 'day' | 'week' | 'month' | 'year'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'day',   label: 'Today'     },
  { id: 'week',  label: 'This week' },
  { id: 'month', label: 'This month'},
  { id: 'year',  label: 'This year' },
]

function inPeriod(dateStr: string, period: Period): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  switch (period) {
    case 'day':
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth()    === now.getMonth()    &&
             d.getDate()     === now.getDate()
    case 'week': {
      const startOfWeek = new Date(now)
      const dow = now.getDay()
      const diff = dow === 0 ? -6 : 1 - dow  // Monday
      startOfWeek.setDate(now.getDate() + diff)
      startOfWeek.setHours(0, 0, 0, 0)
      return d >= startOfWeek
    }
    case 'month':
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth()    === now.getMonth()
    case 'year':
      return d.getFullYear() === now.getFullYear()
  }
}

function pts(estimation: string | null): number {
  return estimation ? parseInt(estimation, 10) : 0
}

export default function DashboardPage() {
  const { tickets, tags } = useStore()
  const [period, setPeriod] = useState<Period>('week')

  const done = tickets.filter(t => t.status === 'done' && inPeriod(t.updated_at, period))

  const totalPts   = done.reduce((s, t) => s + pts(t.estimation), 0)
  const totalCount = done.length

  // EPIC breakdown
  const epicRows = tags.map(tag => {
    const tagDone = done.filter(t => t.tags.some(t2 => t2.id === tag.id))
    return { tag, count: tagDone.length, pts: tagDone.reduce((s, t) => s + pts(t.estimation), 0) }
  }).filter(r => r.count > 0).sort((a, b) => b.pts - a.pts)

  const maxEpicPts = Math.max(...epicRows.map(r => r.pts), 1)

  // Priority breakdown
  const priorityRows = PRIORITY_LEVELS.map(p => {
    const pDone = done.filter(t => t.priority === p.id)
    return { p, count: pDone.length, pts: pDone.reduce((s, t) => s + pts(t.estimation), 0) }
  }).filter(r => r.count > 0)

  const maxPriorityPts = Math.max(...priorityRows.map(r => r.pts), 1)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <BarChart2 size={18} style={{ color: 'var(--accent)' }} />
        <h1 className="font-semibold text-slate-100 text-lg">Kanban Wrapped</h1>
      </div>

      {/* Period switcher */}
      <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 w-fit">
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p.id
                ? 'text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            style={period === p.id ? { backgroundColor: 'var(--accent)' } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <Zap size={11} style={{ color: 'var(--accent)' }} />
            Story points
          </div>
          <p className="text-4xl font-bold text-slate-100">{totalPts}</p>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <CheckCheck size={11} className="text-emerald-500" />
            Tickets done
          </div>
          <p className="text-4xl font-bold text-slate-100">{totalCount}</p>
        </div>
      </div>

      {done.length === 0 && (
        <p className="text-sm text-slate-500 italic text-center py-4">No done tickets in this period yet.</p>
      )}

      {/* EPIC breakdown */}
      {epicRows.length > 0 && (
        <section className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Hash size={11} /> By EPIC
          </h2>
          {epicRows.map(({ tag, count, pts: p }) => (
            <div key={tag.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-slate-300 font-medium">{tag.name}</span>
                </span>
                <span className="text-slate-500">{count} ticket{count !== 1 ? 's' : ''} · <span className="text-slate-400 font-semibold">{p} pts</span></span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(p / maxEpicPts) * 100}%`, backgroundColor: tag.color }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Priority breakdown */}
      {priorityRows.length > 0 && (
        <section className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Hash size={11} /> By Priority
          </h2>
          {priorityRows.map(({ p, count, pts: points }) => (
            <div key={p.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${p.color}`}>{p.label}</span>
                <span className="text-slate-500">{count} ticket{count !== 1 ? 's' : ''} · <span className="text-slate-400 font-semibold">{points} pts</span></span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(points / maxPriorityPts) * 100}%`, backgroundColor: 'var(--accent)' }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Done ticket list */}
      {done.length > 0 && (
        <section className="card p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckCheck size={11} className="text-emerald-400" /> Done tickets
          </h2>
          {done.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-xs py-0.5">
              <span className="text-slate-300 truncate">{t.title}</span>
              <span className="shrink-0 font-semibold text-slate-400">{pts(t.estimation) > 0 ? `${pts(t.estimation)} pts` : '—'}</span>
            </div>
          ))}
        </section>
      )}

      <div className="pb-4" />
    </div>
  )
}
