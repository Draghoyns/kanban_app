import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { useStore } from '@/store/useStore'
import { scheduleDailyReminder } from '@/hooks/useLocalNotifications'
import Header      from '@/components/layout/Header'
import KanbanBoard from '@/components/KanbanBoard'
import MemoTab     from '@/components/MemoTab'
import RoutineTab  from '@/components/RoutineTab'
import DashboardPage from '@/components/DashboardPage'
import Sidebar     from '@/components/Sidebar'

export default function App() {
  const { activeTab, generateRoutineTickets, sidebarOpen, theme, accentColor,
          setActiveTab, triggerNewTicket, triggerNewMemo, setFocusedColumn } = useStore()

  // Spawn any overdue routine-ticket instances whenever the app opens
  useEffect(() => { generateRoutineTickets() }, [])

  // Re-schedule daily notification whenever app comes to foreground.
  // This keeps content fresh and reliably re-arms the single-shot alarm
  // (Android exact repeating alarms are unreliable on API 23+).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    // Reschedule on mount with current ticket state
    const { notificationsEnabled, notificationHour, notificationMinute, tickets } = useStore.getState()
    if (notificationsEnabled) {
      scheduleDailyReminder(notificationHour, notificationMinute, tickets)
    }
    // Reschedule every time the app becomes active again
    const promise = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return
      const { notificationsEnabled, notificationHour, notificationMinute, tickets } = useStore.getState()
      if (notificationsEnabled) {
        scheduleDailyReminder(notificationHour, notificationMinute, tickets)
      }
    })
    return () => { promise.then(h => h.remove()).catch(() => {}) }
  }, [])

  // Android back button: use pushState sentinel so Capacitor routes the hardware
  // back button through WebView history (synchronous popstate) instead of the
  // async plugin bridge. This avoids the race between addListener registration
  // and the first back-press.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    // Push a sentinel so WebView.canGoBack() is true → Capacitor calls goBack()
    // → popstate fires synchronously in JS whenever back is pressed.
    window.history.pushState({ capBack: true }, '')
    function onPopState() {
      // Re-push immediately so canGoBack() stays true for the next press.
      window.history.pushState({ capBack: true }, '')
      if (useStore.getState().sidebarOpen) {
        useStore.getState().setSidebarOpen(false)
        return
      }
      const handled = !window.dispatchEvent(
        new CustomEvent('app:backButton', { cancelable: true, bubbles: false })
      )
      if (!handled) CapApp.minimizeApp()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Listen for notification taps: navigate to the indicated column
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cleanup: (() => void) | undefined
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      const handle = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const column = action.notification.extra?.column
        if (column) {
          setActiveTab('kanban')
          setFocusedColumn(column)
        }
      })
      cleanup = () => { handle.then(h => h.remove()) }
    }).catch(() => {})
    return () => { cleanup?.() }
  }, [])

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
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // Sync accent color CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'kanban' ? <KanbanBoard /> : activeTab === 'memo' ? <MemoTab /> : activeTab === 'routine' ? <RoutineTab /> : <DashboardPage />}
      </main>
      {sidebarOpen && <Sidebar />}
    </div>
  )
}
