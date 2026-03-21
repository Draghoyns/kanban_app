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
  },
}

export default config

