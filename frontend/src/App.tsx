import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import Header      from '@/components/layout/Header'
import KanbanBoard from '@/components/KanbanBoard'
import MemoTab     from '@/components/MemoTab'
import Sidebar     from '@/components/Sidebar'

export default function App() {
  const { activeTab, generateRoutineTickets, sidebarOpen, theme } = useStore()

  // Spawn any overdue routine-ticket instances whenever the app opens
  useEffect(() => { generateRoutineTickets() }, [])

  // Apply theme class to root html element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

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
