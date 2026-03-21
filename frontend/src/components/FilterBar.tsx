import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'

export interface ActiveFilters {
  priorities:  string[]
  epicIds:     number[]
  estimations: string[]
}

interface Props {
  filters:  ActiveFilters
  onChange: (f: ActiveFilters) => void
}

export default function FilterBar({ filters, onChange }: Props) {
  const { tags } = useStore()
  const [open, setOpen] = useState(false)

  const hasFilters = filters.priorities.length > 0 || filters.epicIds.length > 0 || filters.estimations.length > 0

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
    onChange({ priorities: [], epicIds: [], estimations: [] })
  }

  return (
    <div className="border-b border-slate-800 bg-slate-950/60 shrink-0">
      {/* Toggle row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span className="uppercase tracking-wider flex items-center gap-2">
          Filters
          {hasFilters && (
            <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-bold">
              {filters.priorities.length + filters.epicIds.length + filters.estimations.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

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
