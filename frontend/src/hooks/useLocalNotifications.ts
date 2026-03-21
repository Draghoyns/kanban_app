import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const NOTIFICATION_ID = 1

export function useLocalNotifications() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

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
        await scheduleDailyReminder()
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

  return { enabled, loading, enable, disable }
}

/** Schedule (or reschedule) a single repeating 9 am daily reminder. */
export async function scheduleDailyReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    // Cancel any existing scheduled notifications first
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }

    const at = new Date()
    at.setHours(9, 0, 0, 0)
    // If 9 am already passed today, start tomorrow
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
