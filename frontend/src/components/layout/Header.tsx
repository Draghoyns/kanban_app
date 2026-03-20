import { useStore } from '@/store/useStore'
import { useLocalNotifications } from '@/hooks/useLocalNotifications'
import { LayoutDashboard, StickyNote, Bell, BellOff } from 'lucide-react'

const tabs = [
  { id: 'kanban' as const, label: 'Kanban', icon: LayoutDashboard },
  { id: 'memo'   as const, label: 'Memos',  icon: StickyNote       },
]

export default function Header() {
  const { activeTab, setActiveTab } = useStore()
  const { enabled, loading, enable } = useLocalNotifications()

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">K</span>
        </div>
        <span className="font-semibold text-slate-100 tracking-tight hidden sm:block">Kanban Memo</span>
      </div>

      <nav className="flex items-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="ml-auto">
        <button
          onClick={enable}
          disabled={loading || enabled}
          title={enabled ? 'Notifications enabled' : 'Enable daily reminders'}
          className={`p-2 rounded-lg transition-colors ${
            enabled
              ? 'text-indigo-400 cursor-default'
              : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {enabled ? <Bell size={17} /> : <BellOff size={17} />}
        </button>
      </div>
    </header>
  )
}


