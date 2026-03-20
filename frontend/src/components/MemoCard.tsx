import { useState } from 'react'
import { Pin, Trash2, Edit2 } from 'lucide-react'
import type { Memo } from '@/types'
import { useStore } from '@/store/useStore'
import TagBadge from './TagBadge'

interface Props {
  memo:   Memo
  onEdit: () => void
}

export default function MemoCard({ memo, onEdit }: Props) {
  const { updateMemo, deleteMemo } = useStore()
  const [deleting, setDeleting]   = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (window.confirm(`Delete "${memo.title}"?`)) {
      setDeleting(true)
      await deleteMemo(memo.id)
    }
  }

  async function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    await updateMemo(memo.id, { pinned: !memo.pinned })
  }

  return (
    <div
      className="group relative rounded-xl border border-slate-700 hover:border-slate-600 p-4 cursor-pointer
                 transition-all flex flex-col gap-2"
      style={{ backgroundColor: memo.color }}
      onClick={onEdit}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handlePin}   className="p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-amber-400 transition-colors">
          <Pin size={13} className={memo.pinned ? 'text-amber-400 fill-current' : ''} />
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit() }}
          className="p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-slate-100 transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="p-1 rounded-lg bg-slate-900/80 text-slate-400 hover:text-rose-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {memo.pinned && (
        <Pin size={11} className="absolute top-2 left-2 text-amber-400 fill-current" />
      )}

      <h3 className="font-semibold text-slate-100 text-sm pr-16 line-clamp-2 leading-snug">
        {memo.title}
      </h3>

      {memo.content && (
        <p className="text-xs text-slate-400 line-clamp-5 leading-relaxed whitespace-pre-wrap">
          {memo.content}
        </p>
      )}

      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {memo.tags.map(t => <TagBadge key={t.id} tag={t} small />)}
        </div>
      )}
    </div>
  )
}
