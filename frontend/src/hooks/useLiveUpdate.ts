import { useState } from 'react'
import { Capacitor, CapacitorHttp } from '@capacitor/core'

export type SyncStatus = 'idle' | 'checking' | 'downloading' | 'up-to-date' | 'updated' | 'error'

export function useLiveUpdate() {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [message, setMessage] = useState('')

  async function sync(backendUrl: string) {
    if (!Capacitor.isNativePlatform()) {
      setStatus('error')
      setMessage('OTA sync is only available on the native app (Android/iOS).')
      return
    }

    setStatus('checking')
    setMessage('Checking for updates…')

    try {
      // 1. Fetch version via native HTTP (bypasses WebView restrictions)
      let bundleId: string
      try {
        const res = await CapacitorHttp.get({ url: `${backendUrl}/sync/version` })
        if (res.status !== 200) throw new Error(`Backend returned HTTP ${res.status}`)
        bundleId = (res.data as { bundleId: string }).bundleId
      } catch (fetchErr: unknown) {
        const detail = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
        throw new Error(`Cannot reach ${backendUrl} — ${detail}`)
      }

      // 2. Compare with currently active bundle
      const { LiveUpdate } = await import('@capawesome/capacitor-live-update')
      const { bundleId: currentBundleId } = await LiveUpdate.getCurrentBundle()

      if (currentBundleId === bundleId) {
        setStatus('up-to-date')
        setMessage('Already up to date.')
        return
      }

      // 3. Download the new bundle (native download, not WebView)
      setStatus('downloading')
      setMessage('Downloading update…')
      await LiveUpdate.downloadBundle({ bundleId, url: `${backendUrl}/sync/bundle.zip` })

      // 4. Activate and reload
      await LiveUpdate.setBundle({ bundleId })
      setStatus('updated')
      setMessage('Update applied! Reloading…')
      setTimeout(() => LiveUpdate.reload(), 1200)

    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  function reset() {
    setStatus('idle')
    setMessage('')
  }

  return { status, message, sync, reset }
}
