import { useState } from 'react'
import { Plus, Swords, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket } from '@/types'
import SkillModal from './SkillModal'
import TagBadge from './TagBadge'

function pts(estimation: string | null): number {
  return estimation ? parseInt(estimation, 10) : 0
}

/**
 * Level formula: to go from level n to level n+1 you need 5*n story points.
 * Total XP to reach level n = 5 * n*(n-1) / 2
 */
function getSkillLevel(earnedPts: number): { level: number; progress: number; needed: number } {
  let n = 1
  while (5 * (n + 1) * n / 2 <= earnedPts) n++
  const levelStart = 5 * n * (n - 1) / 2
  return { level: n, progress: earnedPts - levelStart, needed: 5 * n }
}

function SkillCard({ skill, onEdit }: { skill: Ticket; onEdit: () => void }) {
  const { tickets } = useStore()

  const children     = tickets.filter(t => t.project_id === skill.id)
  const doneChildren = children.filter(t => t.status === 'done')
  const earnedPts    = doneChildren.reduce((s, t) => s + pts(t.estimation), 0)

  const { level, progress, needed } = getSkillLevel(earnedPts)
  const barFill = needed > 0 ? Math.min(progress / needed, 1) : 0

  return (
    <button
      onClick={onEdit}
      className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors space-y-3"
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Swords size={15} className="shrink-0 text-slate-500" />
          <span className="font-medium text-slate-100 truncate">{skill.title}</span>
        </div>
        <div
          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--accent)22', color: 'var(--accent)', border: '1px solid var(--accent)44' }}
        >
          Lv.{level}
        </div>
      </div>

      {/* XP bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Zap size={10} />
            {earnedPts} XP total
          </span>
          <span>{progress} / {needed} XP to next level</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barFill * 100}%`, backgroundColor: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Stats */}
      {children.length > 0 && (
        <div className="text-[11px] text-slate-500">
          {children.length} ticket{children.length !== 1 ? 's' : ''}
          {doneChildren.length > 0 && ` · ${doneChildren.length} done`}
        </div>
      )}

      {/* Tags */}
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
        </div>
      )}
    </button>
  )
}

export default function SkillTab() {
  const { tickets } = useStore()
  const [editSkill,  setEditSkill]  = useState<Ticket | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const skills = tickets.filter(t => t.is_project)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Swords size={14} />
          Skills
        </h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary ml-auto shrink-0">
          <Plus size={15} /> New skill
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-3">
            <Swords size={40} strokeWidth={1} />
            <p className="text-sm">No skills yet. Add your first one!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> New skill
            </button>
          </div>
        ) : (
          skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={() => setEditSkill(skill)}
            />
          ))
        )}
      </div>

      {/* Edit modal */}
      {editSkill && (
        <SkillModal skill={editSkill} onClose={() => setEditSkill(null)} />
      )}

      {/* Create modal */}
      {showCreate && (
        <SkillModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
