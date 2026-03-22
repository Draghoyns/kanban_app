import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.portfolio.kanbanmemo',
  appName: 'Kanban Memo',
  webDir:  'dist',
  plugins: {
    LiveUpdate: {
      autoDeleteBundles: true,
      resetOnUpdate:     false,
    },
    LocalNotifications: {
      smallIcon:  'ic_launcher_foreground',
      iconColor:  '#f59e0b',
      sound:      'default',
    },
  },
}

export default config

