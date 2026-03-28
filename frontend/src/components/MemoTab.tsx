import { useState, useEffect, useRef } from 'react'
import { Plus, Search, StickyNote } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { Memo } from '@/types'
import MemoCard  from './MemoCard'
import MemoModal from './MemoModal'
import TagBadge  from './TagBadge'

export default function MemoTab() {
  const { memos, tags, newMemoTrigger } = useStore()

  const [showModal,     setShowModal]     = useState(false)
  const [editMemo,      setEditMemo]      = useState<Memo | null>(null)
  const [search,        setSearch]        = useState('')
  const [filterTag,     setFilterTag]     = useState<number | null>(null)

  // Open new-memo modal when shortcut fires (skip first render)
  const isFirst = useRef(true)
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return }
    if (newMemoTrigger > 0) setShowModal(true)
  }, [newMemoTrigger])

  // Android back button: close open memo modal
  useEffect(() => {
    function onBack(e: Event) {
      if (editMemo !== null) { setEditMemo(null);   e.preventDefault(); return }
      if (showModal)         { setShowModal(false); e.preventDefault(); return }
    }
    window.addEventListener('app:backButton', onBack)
    return () => window.removeEventListener('app:backButton', onBack)
  }, [editMemo, showModal])

  const filtered = memos.filter(m => {
    const matchTag    = filterTag == null || m.tags.some(t => t.id === filterTag)
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase())
                        || (m.content ?? '').toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  const pinned   = filtered.filter(m => m.pinned)
  const unpinned = filtered.filter(m => !m.pinned)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-8 h-8 text-sm"
            placeholder="Search memos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary ml-auto shrink-0">
          <Plus size={15} /> New memo
        </button>
      </div>

      {/* EPIC filter strip — below the search bar */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-b border-slate-800/60">
          <button
            onClick={() => setFilterTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap
                     ${filterTag == null ? 'border-indigo-500/70 text-indigo-500 bg-indigo-500/15' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
          >
            All
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              className={`transition-opacity ${filterTag === tag.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
            >
              <TagBadge tag={tag} small />
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-3">
            <StickyNote size={40} strokeWidth={1} />
            <p className="text-sm">No memos yet. Create your first one!</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={15} /> New memo
            </button>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">📌 Pinned</p>
                <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                  {pinned.map(m => (
                    <MemoCard key={m.id} memo={m} onEdit={() => setEditMemo(m)} />
                  ))}
                </div>
              </div>
            )}
            {unpinned.length > 0 && (
              <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                {unpinned.map(m => (
                  <MemoCard key={m.id} memo={m} onEdit={() => setEditMemo(m)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <MemoModal onClose={() => setShowModal(false)} />}
      {editMemo  && <MemoModal memo={editMemo} onClose={() => setEditMemo(null)} />}
    </div>
  )
}
