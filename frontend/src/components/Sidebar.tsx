import { X, Bell, BellOff, EyeOff, Eye, Sun, Moon, Info, BookOpen, Settings } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useLocalNotifications } from '@/hooks/useLocalNotifications'

export default function Sidebar() {
  const { setSidebarOpen, hideDone, setHideDone, theme, setTheme } = useStore()
  const { enabled, enable, disable } = useLocalNotifications()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl animate-fade-in">
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

        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* ── How to use ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-amber-400" />
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">How to use</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <li><span className="text-slate-300 font-medium">Create a ticket</span> — tap <span className="text-amber-400">+</span> in any column header or the empty column area.</li>
              <li><span className="text-slate-300 font-medium">Edit a ticket</span> — tap anywhere on the card.</li>
              <li><span className="text-slate-300 font-medium">Move status (web)</span> — drag any card to another column.</li>
              <li><span className="text-slate-300 font-medium">Move status (mobile)</span> — long-press a card to pick a new status.</li>
              <li><span className="text-slate-300 font-medium">Filter</span> — use the filter bar below the header to narrow by priority or epic.</li>
              <li><span className="text-slate-300 font-medium">Epics</span> — coloured labels attached to tickets. Create them in the ticket editor.</li>
              <li><span className="text-slate-300 font-medium">Priority</span> — P1 (critical) → P4 (low). Set it in the ticket editor.</li>
              <li><span className="text-slate-300 font-medium">Routines</span> — tickets that auto-spawn on a schedule. Mark a ticket as routine in the editor.</li>
            </ul>
          </section>

          {/* ── Notifications ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-amber-400" />
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Notifications</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              When enabled, a daily reminder fires every morning at <span className="text-slate-300 font-medium">9:00 AM</span> to check your board.
              The bell icon in the header toggles notifications on or off at any time.
            </p>
            <button
              onClick={enabled ? disable : enable}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors
                ${enabled
                  ? 'border-amber-600 text-amber-400 bg-amber-950/50 hover:bg-amber-950'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
            >
              {enabled ? <Bell size={13} /> : <BellOff size={13} />}
              {enabled ? 'Notifications on — tap to disable' : 'Notifications off — tap to enable'}
            </button>
          </section>

          {/* ── Settings ─────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={15} className="text-amber-400" />
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Settings</h3>
            </div>

            <div className="space-y-2">
              {/* Show/hide Done */}
              <button
                onClick={() => setHideDone(!hideDone)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  {hideDone ? <EyeOff size={13} className="text-amber-400" /> : <Eye size={13} className="text-slate-400" />}
                  {hideDone ? 'Done column hidden' : 'Done column visible'}
                </div>
                <div className={`w-8 h-4 rounded-full border transition-colors flex items-center px-0.5 ${hideDone ? 'bg-amber-500 border-amber-500' : 'bg-slate-700 border-slate-600'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${hideDone ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {/* Theme */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  {theme === 'dark' ? <Moon size={13} className="text-amber-400" /> : <Sun size={13} className="text-amber-400" />}
                  {theme === 'dark' ? 'Dark theme' : 'Light theme'}
                </div>
                <div className={`w-8 h-4 rounded-full border transition-colors flex items-center px-0.5 ${theme === 'light' ? 'bg-amber-500 border-amber-500' : 'bg-slate-700 border-slate-600'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === 'light' ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>
          </section>

          {/* ── Info ─────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Info size={15} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">About</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kanban Memo runs fully offline. All data is stored on this device.
            </p>
          </section>
        </div>
      </aside>
    </>
  )
}
