import { useState } from 'react'
import { Pin, Trash2, Edit2 } from 'lucide-react'
import type { Memo } from '@/types'
import { useStore } from '@/store/useStore'
import TagBadge from './TagBadge'
import { renderMarkdown } from './MarkdownField'

interface Props {
  memo:   Memo
  onEdit: () => void
}

export default function MemoCard({ memo, onEdit }: Props) {
  const { updateMemo, deleteMemo, theme } = useStore()
  const [deleting, setDeleting]           = useState(false)
  const bgColor = theme === 'dark'
    ? `color-mix(in srgb, ${memo.color} 20%, transparent)`
    : memo.color

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (window.confirm(`Delete "${memo.title}"?`)) {
      setDeleting(true)
      deleteMemo(memo.id)
    }
  }

  function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    updateMemo(memo.id, { pinned: !memo.pinned })
  }

  return (
    <div
      className="group relative rounded-xl border border-slate-700 hover:border-slate-600 p-4 cursor-pointer
                 transition-all flex flex-col gap-2"
      style={{ backgroundColor: bgColor }}
      onClick={onEdit}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handlePin}   className="p-1 rounded-lg bg-black/25 text-white/70 hover:text-amber-400 transition-colors">
          <Pin size={13} className={memo.pinned ? 'text-amber-400 fill-current' : ''} />
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit() }}
          className="p-1 rounded-lg bg-black/25 text-white/70 hover:text-white transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="p-1 rounded-lg bg-black/25 text-white/70 hover:text-rose-300 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {memo.pinned && (
        <Pin size={11} className="absolute top-2 left-2 text-amber-400 fill-current" />
      )}

      <h3 className={`font-semibold text-sm pr-16 leading-snug ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
        {memo.title}
      </h3>

      {memo.content && (
        <div className={`text-xs leading-relaxed [&_p]:mb-0.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_li]:leading-snug [&_li]:mb-px ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
          {renderMarkdown(memo.content)}
        </div>
      )}

      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {memo.tags.map(t => <TagBadge key={t.id} tag={t} small />)}
        </div>
      )}
    </div>
  )
}
