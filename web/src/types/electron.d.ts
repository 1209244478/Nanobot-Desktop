interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  quitApp: () => Promise<void>
  getBackendPort: () => Promise<number>
  isBackendReady: () => Promise<boolean>
  onBackendReady: (callback: () => void) => () => void
  onBackendError: (callback: (error: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
