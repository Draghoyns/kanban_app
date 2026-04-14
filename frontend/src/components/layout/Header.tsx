import { useStore } from '@/store/useStore'
import { useLocalNotifications } from '@/hooks/useLocalNotifications'
import { LayoutDashboard, StickyNote, Repeat, Bell, BellOff, FolderKanban } from 'lucide-react'

const tabs = [
  { id: 'kanban'  as const, label: 'Kanban',   icon: LayoutDashboard },
  { id: 'project' as const, label: 'Projects', icon: FolderKanban    },
  { id: 'memo'    as const, label: 'Memos',    icon: StickyNote      },
  { id: 'routine' as const, label: 'Routines', icon: Repeat          },
]

export default function Header() {
  const { activeTab, setActiveTab, setSidebarOpen } = useStore()
  const { enabled, loading, enable, disable } = useLocalNotifications()

  return (
    <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex items-center gap-2 mr-2 rounded-lg hover:opacity-80 transition-opacity"
        title="Open menu"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <img
            src="/app-icon.png"
            alt=""
            className="w-5 h-5 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <span className="font-semibold text-slate-100 tracking-tight hidden sm:block">Kanban Memo</span>
      </button>

      <nav className="flex items-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`p-2 rounded-lg transition-colors
              ${activeTab === id
                ? 'text-slate-950'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
            style={activeTab === id ? { backgroundColor: 'var(--accent)' } : {}}
          >
            <Icon size={18} />
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* Keyboard shortcut hints — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-600 font-mono select-none">
          <span title="New ticket"><kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900">N</kbd> ticket</span>
          <span title="New memo"><kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900">M</kbd> memo</span>
          <span title="Search tickets"><kbd className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900">/</kbd> search</span>
        </div>

        <button
          onClick={enabled ? disable : enable}
          disabled={loading}
          title={enabled ? 'Disable notifications' : 'Enable notifications'}
          className="p-2 rounded-lg transition-colors hover:bg-slate-800"
          style={{ color: enabled ? 'var(--accent)' : '#64748b' }}
        >
          {enabled ? <Bell size={18} /> : <BellOff size={18} />}
        </button>
      </div>
    </header>
  )
}
