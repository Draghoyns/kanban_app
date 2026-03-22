import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useStore } from '@/store/useStore'
import Header      from '@/components/layout/Header'
import KanbanBoard from '@/components/KanbanBoard'
import MemoTab     from '@/components/MemoTab'
import Sidebar     from '@/components/Sidebar'

export default function App() {
  const { activeTab, generateRoutineTickets, sidebarOpen, theme, accentColor,
          setActiveTab, triggerNewTicket, triggerNewMemo } = useStore()

  // Spawn any overdue routine-ticket instances whenever the app opens
  useEffect(() => { generateRoutineTickets() }, [])

  // Keyboard shortcuts — only fire when no input/textarea/select is focused
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setActiveTab('kanban')
        triggerNewTicket()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        setActiveTab('memo')
        triggerNewMemo()
      } else if (e.key === '/') {
        e.preventDefault()
        setActiveTab('kanban')
        // Small delay lets the board render before focusing
        setTimeout(() => document.getElementById('board-search')?.focus(), 50)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Notify LiveUpdate plugin that the app loaded successfully (prevents rollback)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capawesome/capacitor-live-update')
        .then(({ LiveUpdate }) => LiveUpdate.ready())
        .catch(() => { /* plugin not available */ })
    }
  }, [])

  // Apply theme class to root html element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  // Sync accent color CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'kanban' ? <KanbanBoard /> : <MemoTab />}
      </main>
      {sidebarOpen && <Sidebar />}
    </div>
  )
}
