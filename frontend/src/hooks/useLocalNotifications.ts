import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useStore } from '@/store/useStore'
import type { Ticket } from '@/types'

const NOTIFICATION_ID = 1

export function useLocalNotifications() {
  const [loading, setLoading] = useState(false)
  const { notificationHour, notificationMinute, notificationsEnabled: enabled, setNotificationsEnabled: setEnabled, tickets } = useStore()

  useEffect(() => {
    // Sync permission state on mount (native only); on web the store value is canonical.
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
        LocalNotifications.checkPermissions().then(p => setEnabled(p.display === 'granted'))
      }).catch(() => {/* plugin not linked yet */})
    }
  }, [])

  async function enable() {
    if (loading || enabled) return
    setLoading(true)
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        const result = await LocalNotifications.requestPermissions()
        if (result.display !== 'granted') return
        // Android 12+: check exact alarm permission; if not granted, open system settings
        try {
          const result2 = await LocalNotifications.checkExactNotificationSetting()
          if (result2.exact_alarm !== 'granted') {
            await LocalNotifications.changeExactNotificationSetting()
            return // user must re-tap enable after granting in settings
          }
        } catch { /* plugin doesn't support this on older Android — proceed */ }
        setEnabled(true)
        await scheduleDailyReminder(notificationHour, notificationMinute, tickets)
      } else {
        // Web: no actual push notifications on non-native platform.
        // Optionally surface browser permission dialog, but always toggle state.
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => { /* ignore */ })
        }
        setEnabled(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        const pending = await LocalNotifications.getPending()
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications })
        }
      } catch { /* ignore */ }
    }
    setEnabled(false)
  }

  /** Re-schedule the notification at a new hour+minute (call after user changes the time). */
  async function reschedule(hour: number, minute: number) {
    if (!enabled) return
    await scheduleDailyReminder(hour, minute, tickets)
  }

  return { enabled, loading, enable, disable, reschedule }
}

/** Schedule (or reschedule) a single repeating daily reminder at the given hour and minute. */
export async function scheduleDailyReminder(hour = 9, minute = 0, tickets: Ticket[] = []): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Cancel any existing scheduled notifications first
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    // Build dynamic content based on today column state
    const todayTickets = tickets.filter(t => t.status === 'today')
    const n = todayTickets.length
    const column = n === 0 ? 'backlog' : 'today'
    const title  = n === 0
      ? '🍒 Plan your day'
      : `🍒 ${n} task${n !== 1 ? 's' : ''} today`
    const body   = n === 0
      ? 'Your today column is empty — check your backlog'
      : todayTickets.slice(0, 3).map(t => t.title).join(', ') + (n > 3 ? ` +${n - 3} more` : '')

    const at = new Date()
    at.setHours(hour, minute, 0, 0)
    // If the target time already passed today, start tomorrow
    if (at <= new Date()) at.setDate(at.getDate() + 1)

    await LocalNotifications.schedule({
      notifications: [{
        id:        NOTIFICATION_ID,
        title,
        body,
        schedule:  { at, every: 'day', allowWhileIdle: true },
        smallIcon: 'ic_stat_cherry',
        iconColor: '#6366f1',
        extra:     { column },
      }],
    })
  } catch (err) {
    console.warn('Failed to schedule local notification:', err)
  }
}
