import { useRef, useState } from 'react'
import { X, ChevronDown, ChevronUp, Calendar, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'

export type DueDateFilter = 'overdue' | 'this_week' | 'this_month' | 'no_due_date'

export interface ActiveFilters {
  priorities:  string[]
  epicIds:     number[]
  estimations: string[]
  dueDate:     DueDateFilter | null
}

const DUE_DATE_OPTIONS: { id: DueDateFilter; label: string; cls: string; activeCls: string }[] = [
  { id: 'overdue',      label: 'Overdue',      cls: 'border-slate-700 text-slate-600 hover:border-rose-700 hover:text-rose-400',   activeCls: 'bg-rose-950 text-rose-400 border-rose-800'     },
  { id: 'this_week',   label: 'This week',    cls: 'border-slate-700 text-slate-600 hover:border-amber-700 hover:text-amber-400', activeCls: 'bg-amber-950 text-amber-400 border-amber-800'   },
  { id: 'this_month',  label: 'This month',   cls: 'border-slate-700 text-slate-600 hover:border-blue-700 hover:text-blue-400',   activeCls: 'bg-blue-950 text-blue-400 border-blue-800'     },
  { id: 'no_due_date', label: 'No due date',  cls: 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400', activeCls: 'bg-slate-800 text-slate-300 border-slate-600'  },
]

interface Props {
  filters:  ActiveFilters
  onChange: (f: ActiveFilters) => void
  search:   string
  onSearch: (q: string) => void
}

export default function FilterBar({ filters, onChange, search, onSearch }: Props) {
  const { tags } = useStore()
  const [open, setOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const hasFilters = filters.priorities.length > 0 || filters.epicIds.length > 0 || filters.estimations.length > 0 || filters.dueDate != null

  function toggleDueDate(id: DueDateFilter) {
    onChange({ ...filters, dueDate: filters.dueDate === id ? null : id })
  }

  function togglePriority(id: string) {
    const next = filters.priorities.includes(id)
      ? filters.priorities.filter(p => p !== id)
      : [...filters.priorities, id]
    onChange({ ...filters, priorities: next })
  }

  function toggleEstimation(id: string) {
    const next = filters.estimations.includes(id)
      ? filters.estimations.filter(e => e !== id)
      : [...filters.estimations, id]
    onChange({ ...filters, estimations: next })
  }

  function toggleEpic(id: number) {
    const next = filters.epicIds.includes(id)
      ? filters.epicIds.filter(e => e !== id)
      : [...filters.epicIds, id]
    onChange({ ...filters, epicIds: next })
  }

  function clearAll() {
    onChange({ priorities: [], epicIds: [], estimations: [], dueDate: null })
  }

  return (
    <div className="border-b border-slate-800 bg-slate-950/60 shrink-0">
      {/* Search + filter toggle row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchRef}
            id="board-search"
            className="input h-7 pl-7 pr-7 text-xs w-full"
            placeholder="Search tickets…"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors border border-transparent hover:border-slate-700"
        >
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            Filters
            {hasFilters && (
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-bold">
                {filters.priorities.length + filters.epicIds.length + filters.estimations.length + (filters.dueDate != null ? 1 : 0)}
              </span>
            )}
          </span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expandable filter rows */}
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {/* Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-14 shrink-0">Priority</span>
            {PRIORITY_LEVELS.map(p => {
              const active = filters.priorities.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePriority(p.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all
                    ${active ? p.badge : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Estimation */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-14 shrink-0">Est</span>
            {ESTIMATION_SIZES.map(e => {
              const active = filters.estimations.includes(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() => toggleEstimation(e.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all
                    ${active ? e.badge : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}
                >
                  {e.label}
                </button>
              )
            })}
          </div>

          {/* EPICs */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-14 shrink-0">EPIC</span>
              {tags.map(tag => {
                const active = filters.epicIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleEpic(tag.id)}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all"
                    style={active
                      ? { backgroundColor: tag.color + '33', color: tag.color, borderColor: tag.color + '88' }
                      : { backgroundColor: 'transparent', color: '#475569', borderColor: '#334155' }
                    }
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Due date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-14 shrink-0 flex items-center gap-1">
              <Calendar size={10} /> Due
            </span>
            {DUE_DATE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => toggleDueDate(opt.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all
                  ${filters.dueDate === opt.id ? opt.activeCls : opt.cls}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={11} />
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
