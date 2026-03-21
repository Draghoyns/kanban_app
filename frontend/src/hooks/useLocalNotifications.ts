import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useStore } from '@/store/useStore'

const NOTIFICATION_ID = 1

export function useLocalNotifications() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notificationHour, notificationMinute } = useStore()

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
        LocalNotifications.checkPermissions().then(p => setEnabled(p.display === 'granted'))
      }).catch(() => {/* plugin not linked yet */})
    } else if ('Notification' in window) {
      setEnabled(Notification.permission === 'granted')
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
        setEnabled(true)
        await scheduleDailyReminder(notificationHour, notificationMinute)
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
    await scheduleDailyReminder(hour, minute)
  }

  return { enabled, loading, enable, disable, reschedule }
}

/** Schedule (or reschedule) a single repeating daily reminder at the given hour and minute. */
export async function scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Cancel any existing scheduled notifications first
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const at = new Date()
    at.setHours(hour, minute, 0, 0)
    // If the target time already passed today, start tomorrow
    if (at <= new Date()) at.setDate(at.getDate() + 1)

    await LocalNotifications.schedule({
      notifications: [{
        id:        NOTIFICATION_ID,
        title:     'Kanban Memo',
        body:      'Check your routine tasks for today',
        schedule:  { at, every: 'day', allowWhileIdle: true },
        iconColor: '#f59e0b',
      }],
    })
  } catch (err) {
    console.warn('Failed to schedule local notification:', err)
  }
}
