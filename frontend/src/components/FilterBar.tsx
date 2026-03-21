import { X } from 'lucide-react'
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
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 overflow-x-auto shrink-0 bg-slate-950/60">
      {/* Priority chips */}
      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider shrink-0">Priority</span>
      {PRIORITY_LEVELS.map(p => {
        const active = filters.priorities.includes(p.id)
        return (
          <button
            key={p.id}
            onClick={() => togglePriority(p.id)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all shrink-0
              ${active ? p.badge : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}
          >
            {p.label}
          </button>
        )
      })}

      {/* Separator + Estimation chips */}
      <div className="w-px h-4 bg-slate-700 shrink-0 mx-1" />
      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider shrink-0">Est</span>
      {ESTIMATION_SIZES.map(e => {
        const active = filters.estimations.includes(e.id)
        return (
          <button
            key={e.id}
            onClick={() => toggleEstimation(e.id)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all shrink-0
              ${active ? e.badge : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'}`}
          >
            {e.label}
          </button>
        )
      })}

      {/* Separator + EPIC chips (only if epics exist) */}
      {tags.length > 0 && (
        <>
          <div className="w-px h-4 bg-slate-700 shrink-0 mx-1" />
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider shrink-0">EPIC</span>
          {tags.map(tag => {
            const active = filters.epicIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleEpic(tag.id)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all shrink-0"
                style={active
                  ? { backgroundColor: tag.color + '33', color: tag.color, borderColor: tag.color + '88' }
                  : { backgroundColor: 'transparent', color: '#475569', borderColor: '#334155' }
                }
              >
                {tag.name}
              </button>
            )
          })}
        </>
      )}

      {/* Clear button */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 shrink-0 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  )
}
