import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import Header      from '@/components/layout/Header'
import KanbanBoard from '@/components/KanbanBoard'
import MemoTab     from '@/components/MemoTab'

export default function App() {
  const { activeTab, generateRoutineTickets } = useStore()

  // Spawn any overdue routine-ticket instances whenever the app opens
  useEffect(() => { generateRoutineTickets() }, [])

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'kanban' ? <KanbanBoard /> : <MemoTab />}
      </main>
    </div>
  )
}
