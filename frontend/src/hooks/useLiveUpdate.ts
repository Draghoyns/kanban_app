import { useState } from 'react'
import { Capacitor } from '@capacitor/core'

export type SyncStatus = 'idle' | 'checking' | 'downloading' | 'up-to-date' | 'updated' | 'error'

export function useLiveUpdate() {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')

  async function sync(backendUrl: string) {
    if (!Capacitor.isNativePlatform()) {
      setStatus('error')
      setMessage('OTA sync is only available on native (Android/iOS).')
      return
    }

    setStatus('checking')
    setMessage('Checking for updates…')

    try {
      // 1. Fetch the latest version from the backend
      const versionRes = await fetch(`${backendUrl}/sync/version`, { signal: AbortSignal.timeout(8000) })
      if (!versionRes.ok) throw new Error(`Backend returned ${versionRes.status}`)
      const { bundleId } = await versionRes.json() as { bundleId: string }

      // 2. Compare with the currently active bundle
      const { LiveUpdate } = await import('@capawesome/capacitor-live-update')
      const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle()

      if (currentBundleId === bundleId) {
        setStatus('up-to-date')
        setMessage('Already up to date.')
        return
      }

      // 3. Download the new bundle
      setStatus('downloading')
      setMessage('Downloading update…')
      await LiveUpdate.downloadBundle({ bundleId, url: `${backendUrl}/sync/bundle.zip` })

      // 4. Set the new bundle as active and reload
      await LiveUpdate.setBundle({ bundleId })
      setStatus('updated')
      setMessage('Update applied! Reloading…')

      // Short delay so the user sees the message, then reload
      setTimeout(() => LiveUpdate.reload(), 1200)
    } catch (err: unknown) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg.includes('Failed to fetch') || msg.includes('timeout')
        ? 'Cannot reach the backend — check that the server is running and the URL is correct.'
        : `Sync failed: ${msg}`)
    }
  }

  function reset() {
    setStatus('idle')
    setMessage('')
  }

  return { status, message, sync, reset }
}
