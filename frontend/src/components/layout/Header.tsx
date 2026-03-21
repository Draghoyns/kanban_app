import { useStore } from '@/store/useStore'
import { useLocalNotifications } from '@/hooks/useLocalNotifications'
import { LayoutDashboard, StickyNote, Bell, BellOff } from 'lucide-react'

const tabs = [
  { id: 'kanban' as const, label: 'Kanban', icon: LayoutDashboard },
  { id: 'memo'   as const, label: 'Memos',  icon: StickyNote       },
]

export default function Header() {
  const { activeTab, setActiveTab, setSidebarOpen } = useStore()
  const { enabled, loading, enable, disable } = useLocalNotifications()

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex items-center gap-2 mr-4 rounded-lg hover:opacity-80 transition-opacity"
        title="Open menu"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
          <span className="text-slate-950 font-bold text-xs">K</span>
        </div>
        <span className="font-semibold text-slate-100 tracking-tight hidden sm:block">Kanban Memo</span>
      </button>

      <nav className="flex items-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === id
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="ml-auto">
        <button
          onClick={enabled ? disable : enable}
          disabled={loading}
          title={enabled ? 'Disable notifications' : 'Enable notifications'}
          className={`p-2 rounded-lg transition-colors ${
            enabled
              ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {enabled ? <Bell size={17} /> : <BellOff size={17} />}
        </button>
      </div>
    </header>
  )
}



