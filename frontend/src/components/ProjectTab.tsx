import { useState } from 'react'
import { Plus, FolderKanban, Layers } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Ticket } from '@/types'
import { PRIORITY_LEVELS, ESTIMATION_SIZES } from '@/types'
import TicketModal from './TicketModal'
import TagBadge from './TagBadge'

function pts(estimation: string | null): number {
  return estimation ? parseInt(estimation, 10) : 0
}

function ProjectCard({ project, onEdit }: { project: Ticket; onEdit: () => void }) {
  const { tickets } = useStore()

  const children = tickets.filter(t => t.project_id === project.id)
  const doneChildren = children.filter(t => t.status === 'done')
  const earnedPts = doneChildren.reduce((s, t) => s + pts(t.estimation), 0)
  const totalPts  = children.reduce((s, t) => s + pts(t.estimation), 0)
  const goalPts   = project.project_goal ?? totalPts
  const progress  = goalPts > 0 ? Math.min(earnedPts / goalPts, 1) : 0

  const priority = PRIORITY_LEVELS.find(p => p.id === project.priority)

  return (
    <button
      onClick={onEdit}
      className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors space-y-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FolderKanban size={15} className="shrink-0 text-slate-500" />
          <span className="font-medium text-slate-100 truncate">{project.title}</span>
        </div>
        {priority && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: priority.color + '33', color: priority.color }}
          >
            {priority.id}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {goalPts > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{earnedPts} / {goalPts} pts</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress * 100}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Layers size={11} />
          {children.length} ticket{children.length !== 1 ? 's' : ''}
          {doneChildren.length > 0 && ` · ${doneChildren.length} done`}
        </span>
        {project.due_date && (
          <span>Due {project.due_date}</span>
        )}
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
        </div>
      )}
    </button>
  )
}

export default function ProjectTab() {
  const { tickets } = useStore()
  const [editProject, setEditProject] = useState<Ticket | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)

  const projects = tickets.filter(t => t.is_project)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <FolderKanban size={14} />
          Projects
        </h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary ml-auto shrink-0">
          <Plus size={15} /> New project
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-3">
            <FolderKanban size={40} strokeWidth={1} />
            <p className="text-sm">No projects yet. Create your first one!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> New project
            </button>
          </div>
        ) : (
          projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => setEditProject(project)}
            />
          ))
        )}
      </div>

      {/* Edit modal */}
      {editProject && (
        <TicketModal
          ticket={editProject}
          onClose={() => setEditProject(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <TicketModal
          initialIsProject
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
