import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Memo } from '@/types'
import { MEMO_COLORS } from '@/types'
import TagBadge from './TagBadge'

interface Props {
  memo?:   Memo
  onClose: () => void
}

export default function MemoModal({ memo, onClose }: Props) {
  const { tags, createMemo, updateMemo, createTag } = useStore()

  const [title,          setTitle]          = useState(memo?.title   ?? '')
  const [content,        setContent]        = useState(memo?.content ?? '')
  const [color,          setColor]          = useState(memo?.color   ?? MEMO_COLORS[0])
  const [pinned,         setPinned]         = useState(memo?.pinned  ?? false)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(memo?.tags.map(t => t.id) ?? [])
  const [newTagName,     setNewTagName]     = useState('')
  const [newTagColor,    setNewTagColor]    = useState('#6366f1')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  function toggleTag(id: number) {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return
    try {
      const tag = await createTag({ name: newTagName.trim(), color: newTagColor })
      setSelectedTagIds(prev => [...prev, tag.id])
      setNewTagName('')
    } catch { setError('Tag name already exists') }
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { title: title.trim(), content: content.trim() || undefined, color, pinned, tag_ids: selectedTagIds }
      if (memo) {
        await updateMemo(memo.id, payload)
      } else {
        await createMemo(payload)
      }
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to save memo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100">{memo ? 'Edit Memo' : 'New Memo'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <input
            autoFocus
            className="input text-base font-medium"
            placeholder="Memo title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          {/* Content */}
          <textarea
            className="textarea"
            rows={8}
            placeholder="Write your memo…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Color</label>
            <div className="flex gap-2">
              {MEMO_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${color === c ? 'border-indigo-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPinned(!pinned)}
              className={`relative w-10 h-5 rounded-full transition-colors ${pinned ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${pinned ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-slate-400">Pin memo</span>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`transition-opacity ${selectedTagIds.includes(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                >
                  <TagBadge tag={tag} small />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 h-8 text-xs"
                placeholder="New tag name…"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
              <input type="color" className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 p-0.5 cursor-pointer"
                value={newTagColor} onChange={e => setNewTagColor(e.target.value)} />
              <button onClick={handleAddTag} className="btn-ghost py-1 px-2 text-xs"><Plus size={13} /></button>
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-700">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : memo ? 'Save changes' : 'Create memo'}
          </button>
        </div>
      </div>
    </div>
  )
}
