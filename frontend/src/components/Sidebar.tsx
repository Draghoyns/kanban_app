import { useState, useRef } from 'react'
import { X, Bell, BellOff, EyeOff, Eye, Sun, Moon, Info, BookOpen, Settings, Palette, ChevronDown, Tag, Plus, RefreshCw, AlertCircle, CheckCircle, Download, Upload } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useLocalNotifications } from '@/hooks/useLocalNotifications'
import { useLiveUpdate } from '@/hooks/useLiveUpdate'
import TagBadge from '@/components/TagBadge'
import type { Ticket, Memo, Tag as TagType } from '@/types'

const PALETTE_PRESETS = [
  { name: 'Pink',    color: '#ec4899' },
  { name: 'Rose',    color: '#f43f5e' },
  { name: 'Amber',   color: '#f59e0b' },
  { name: 'Violet',  color: '#8b5cf6' },
  { name: 'Sky',     color: '#0ea5e9' },
  { name: 'Emerald', color: '#10b981' },
]

interface SectionProps {
  icon:     React.ReactNode
  title:    string
  open:     boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ icon, title, open, onToggle, children }: SectionProps) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-1 mb-1"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--accent)' }}
          >
            {title}
          </h3>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  )
}

export default function Sidebar() {
  const { setSidebarOpen, hideDone, setHideDone, theme, setTheme, accentColor, setAccentColor, notificationHour, notificationMinute, setNotificationHour, setNotificationMinute, tags, createTag, deleteTag, backendUrl, setBackendUrl, tickets, memos } = useStore()
  const { enabled, enable, disable, reschedule } = useLocalNotifications()
  const { status: syncStatus, message: syncMessage, sync, reset: resetSync } = useLiveUpdate()

  const importRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk,    setImportOk]    = useState(false)

  function handleExport() {
    const payload = { version: 1, exportedAt: new Date().toISOString(), tickets, memos, tags }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `kanban-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportOk(false)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file')
        const inTickets: Ticket[] = Array.isArray(parsed.tickets) ? parsed.tickets : []
        const inMemos:   Memo[]   = Array.isArray(parsed.memos)   ? parsed.memos   : []
        const inTags:    TagType[] = Array.isArray(parsed.tags)   ? parsed.tags    : []
        if (inTickets.length === 0 && inMemos.length === 0 && inTags.length === 0)
          throw new Error('File contains no data')
        if (!window.confirm(
          `This will REPLACE all current data with the backup\n(${inTickets.length} tickets, ${inMemos.length} memos, ${inTags.length} EPICs).\n\nContinue?`
        )) return
        useStore.setState({ tickets: inTickets, memos: inMemos, tags: inTags })
        setImportOk(true)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse file')
      } finally {
        // Reset the input so the same file can be re-selected
        if (importRef.current) importRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const [newEpicName,  setNewEpicName]  = useState('')
  const [newEpicColor, setNewEpicColor] = useState('#ec4899')

  function handleAddEpic() {
    if (!newEpicName.trim()) return
    createTag({ name: newEpicName.trim(), color: newEpicColor })
    setNewEpicName('')
  }

  const [open, setOpen] = useState<Record<string, boolean>>({
    howto:         false,
    notifications: false,
    settings:      true,
    about:         false,
  })
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Panel — left side */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-slate-900 border-r border-slate-700 z-50 flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <span className="font-semibold text-slate-100">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── Sync ─────────────────────────────────────────────────── */}
          <Section
            icon={<RefreshCw size={15} style={{ color: 'var(--accent)' }} />}
            title="Sync"
            open={open.sync ?? false}
            onToggle={() => toggle('sync')}
          >
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Update the app over WiFi from your Mac. Make sure the Mac's backend
              is running and both devices are on the same network.
            </p>

            {/* Server URL input */}
            <label className="text-xs text-slate-500 block mb-1">Backend URL</label>
            <input
              className="input w-full h-8 text-xs mb-3 font-mono"
              value={backendUrl}
              onChange={e => { setBackendUrl(e.target.value); resetSync() }}
              placeholder="http://192.168.1.x:8000"
            />

            {/* Sync button */}
            <button
              onClick={() => sync(backendUrl)}
              disabled={syncStatus === 'checking' || syncStatus === 'downloading' || syncStatus === 'updated'}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: 'color-mix(in srgb, var(--accent) 60%, black)', color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
            >
              <RefreshCw
                size={13}
                className={syncStatus === 'checking' || syncStatus === 'downloading' ? 'animate-spin' : ''}
              />
              {syncStatus === 'idle'        && 'Sync now'}
              {syncStatus === 'checking'    && 'Checking…'}
              {syncStatus === 'downloading' && 'Downloading…'}
              {syncStatus === 'up-to-date'  && 'Up to date'}
              {syncStatus === 'updated'     && 'Reloading…'}
              {syncStatus === 'error'       && 'Retry sync'}
            </button>

            {/* Status message */}
            {syncMessage && (
              <div className={`flex items-start gap-1.5 mt-2 text-xs leading-relaxed ${
                syncStatus === 'error'      ? 'text-rose-400'  :
                syncStatus === 'up-to-date' ? 'text-slate-400' : 'text-emerald-400'
              }`}>
                {syncStatus === 'error'
                  ? <AlertCircle size={12} className="shrink-0 mt-px" />
                  : syncStatus === 'up-to-date' || syncStatus === 'updated'
                  ? <CheckCircle size={12} className="shrink-0 mt-px" />
                  : null
                }
                {syncMessage}
              </div>
            )}
          </Section>

          {/* ── How to use ───────────────────────────────────────────── */}
          <Section
            icon={<BookOpen size={15} style={{ color: 'var(--accent)' }} />}
            title="How to use"
            open={open.howto}
            onToggle={() => toggle('howto')}
          >
            <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <li><span className="text-slate-300 font-medium">Create a ticket</span> — tap <span style={{ color: 'var(--accent)' }}>+</span> in any column header.</li>
              <li><span className="text-slate-300 font-medium">Edit a ticket</span> — tap anywhere on the card.</li>
              <li><span className="text-slate-300 font-medium">Move (web)</span> — drag any card to another column.</li>
              <li><span className="text-slate-300 font-medium">Move (mobile)</span> — long-press a card to pick a new status.</li>
              <li><span className="text-slate-300 font-medium">Filter</span> — tap <em>Filters</em> above the board to expand; filter by priority, estimate, or EPIC.</li>
              <li><span className="text-slate-300 font-medium">Description</span> — each ticket has three fields: <em>Why</em> (motivation), <em>What</em> (goal), and <em>How</em> (checklist of steps you can tick off).</li>
              <li><span className="text-slate-300 font-medium">EPICs</span> — coloured labels attached to tickets. Create or delete them in the EPICs section.</li>
              <li><span className="text-slate-300 font-medium">Priority</span> — P1 (critical) → P4 (low).</li>
              <li><span className="text-slate-300 font-medium">Estimate</span> — Fibonacci points: 1 · 2 · 3 · 5 · 8.</li>
              <li><span className="text-slate-300 font-medium">Routines</span> — tickets that auto-spawn on a schedule.</li>
              <li><span className="text-slate-300 font-medium">Notifications</span> — set your daily reminder time in the Notifications section.</li>
            </ul>
          </Section>

          {/* ── Notifications ────────────────────────────────────────── */}
          <Section
            icon={<Bell size={15} style={{ color: 'var(--accent)' }} />}
            title="Notifications"
            open={open.notifications}
            onToggle={() => toggle('notifications')}
          >
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              A daily reminder fires at the time you choose below.
              The bell icon in the header also toggles this.
            </p>
            <button
              onClick={enabled ? disable : enable}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors mb-3"
              style={enabled
                ? { borderColor: 'color-mix(in srgb, var(--accent) 70%, black)', color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)' }
                : { borderColor: '#475569', color: '#94a3b8' }
              }
            >
              {enabled ? <Bell size={13} /> : <BellOff size={13} />}
              {enabled ? 'Notifications on — tap to disable' : 'Notifications off — tap to enable'}
            </button>
            {/* Hour + minute picker */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-300">Reminder time</span>
              <input
                type="time"
                value={`${String(notificationHour).padStart(2, '0')}:${String(notificationMinute).padStart(2, '0')}`}
                onChange={e => {
                  const [hStr, mStr] = e.target.value.split(':')
                  const h = parseInt(hStr, 10)
                  const m = parseInt(mStr, 10)
                  if (!isNaN(h) && !isNaN(m)) {
                    setNotificationHour(h)
                    setNotificationMinute(m)
                    reschedule(h, m)
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </Section>

          {/* ── Settings ─────────────────────────────────────────────── */}
          <Section
            icon={<Settings size={15} style={{ color: 'var(--accent)' }} />}
            title="Settings"
            open={open.settings}
            onToggle={() => toggle('settings')}
          >
            <div className="space-y-2">
              {/* Show/hide Done */}
              <button
                onClick={() => setHideDone(!hideDone)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  {hideDone
                    ? <EyeOff size={13} style={{ color: 'var(--accent)' }} />
                    : <Eye    size={13} className="text-slate-400" />
                  }
                  {hideDone ? 'Done column hidden' : 'Done column visible'}
                </div>
                <div
                  className="w-8 h-4 rounded-full flex items-center px-0.5 transition-colors"
                  style={hideDone
                    ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { backgroundColor: '#334155', borderColor: '#475569' }
                  }
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${hideDone ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Theme — sun/moon icon toggle */}
              <div className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-300">Theme</span>
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setTheme('light')}
                    title="Light theme"
                    className={`p-1.5 rounded-md transition-colors ${
                      theme === 'light'
                        ? 'bg-slate-600 text-yellow-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    title="Dark theme"
                    className={`p-1.5 rounded-md transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-blue-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Moon size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Appearance ───────────────────────────────────────────── */}
          <Section
            icon={<Palette size={15} style={{ color: 'var(--accent)' }} />}
            title="Appearance"
            open={open.appearance ?? true}
            onToggle={() => toggle('appearance')}
          >
            <p className="text-xs text-slate-400 mb-3">Accent color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {PALETTE_PRESETS.map(preset => (
                <button
                  key={preset.color}
                  onClick={() => setAccentColor(preset.color)}
                  title={preset.name}
                  style={{
                    backgroundColor: preset.color,
                    outline:         accentColor === preset.color ? '2px solid white' : 'none',
                    outlineOffset:   '2px',
                  }}
                  className="w-6 h-6 rounded-full transition-all"
                />
              ))}
              {/* Custom color wheel */}
              <label
                title="Custom color"
                className="w-6 h-6 rounded-full border-2 border-dashed border-slate-600 hover:border-slate-400 flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
              >
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-8 h-8 opacity-0 absolute cursor-pointer"
                />
                <Palette size={12} className="text-slate-500" />
              </label>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">{accentColor}</p>
          </Section>

          {/* ── EPICs ────────────────────────────────────────────────── */}
          <Section
            icon={<Tag size={15} style={{ color: 'var(--accent)' }} />}
            title="EPICs"
            open={open.epics ?? true}
            onToggle={() => toggle('epics')}
          >
            {tags.length === 0 ? (
              <p className="text-xs text-slate-500 italic mb-3">No EPICs yet. Use the form below to create one.</p>
            ) : (
              <ul className="space-y-1.5 mb-3">
                {tags.map(tag => (
                  <li key={tag.id} className="flex items-center justify-between gap-2">
                    <TagBadge tag={tag} small />
                    <button
                      onClick={() => deleteTag(tag.id)}
                      title="Delete EPIC"
                      className="shrink-0 text-slate-600 hover:text-rose-400 transition-colors p-0.5 rounded"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Create EPIC */}
            <div className="flex items-center gap-2">
              <input
                className="input flex-1 h-8 text-xs"
                placeholder="New EPIC name…"
                value={newEpicName}
                onChange={e => setNewEpicName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEpic()}
              />
              <input
                type="color"
                className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5 shrink-0"
                value={newEpicColor}
                onChange={e => setNewEpicColor(e.target.value)}
              />
              <button
                onClick={handleAddEpic}
                className="btn-ghost py-1 px-2 text-xs shrink-0"
                title="Add EPIC"
              >
                <Plus size={13} />
              </button>
            </div>
          </Section>

          {/* ── Data ─────────────────────────────────────────────────── */}
          <Section
            icon={<Download size={15} style={{ color: 'var(--accent)' }} />}
            title="Data"
            open={open.data ?? false}
            onToggle={() => toggle('data')}
          >
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Export a full backup of all tickets, memos, and EPICs as a JSON file.
              Import to restore from a previous backup — this replaces all current data.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
              >
                <Download size={13} /> Export backup
              </button>
              <button
                onClick={() => { setImportError(null); setImportOk(false); importRef.current?.click() }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
              >
                <Upload size={13} /> Import backup
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              {importError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {importError}
                </p>
              )}
              {importOk && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={11} /> Data restored successfully
                </p>
              )}
            </div>
          </Section>

          {/* ── About ────────────────────────────────────────────────── */}
          <Section
            icon={<Info size={15} className="text-slate-500" />}
            title="About"
            open={open.about}
            onToggle={() => toggle('about')}
          >
            <p className="text-xs text-slate-500 leading-relaxed">
              Kanban Memo runs fully offline. All data is stored on this device.
            </p>
          </Section>
        </div>
      </aside>
    </>
  )
}
