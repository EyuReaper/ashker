import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import activeWin from 'active-win'
import Store from 'electron-store'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize electron-store
const store = new Store()

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Tracking interval reference
let trackingInterval: NodeJS.Timeout | null = null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Remove the native application menu for a cleaner look
  win.setMenu(null);

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// --- Tracking Logic ---

async function trackActiveWindow() {
  try {
    const result = await activeWin()
    if (!result) return

    const today = new Date().toISOString().split('T')[0]
    const logs = (store.get('logs') as Record<string, Record<string, number>>) || {}
    
    if (!logs[today]) {
      logs[today] = {}
    }

    const appName = result.owner.name
    // Increment by 5 seconds (the interval duration)
    logs[today][appName] = (logs[today][appName] || 0) + 5
    
    store.set('logs', logs)
  } catch (err) {
    console.error('Tracking error:', err)
  }
}

// IPC Handlers
ipcMain.handle('get-logs', () => {
  return store.get('logs') || {}
})

ipcMain.handle('get-categories', () => {
  return store.get('categories') || {}
})

ipcMain.handle('set-category', (_, appName: string, category: string) => {
  const categories = (store.get('categories') as Record<string, string>) || {}
  categories[appName] = category
  store.set('categories', categories)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  
  // Start tracking heartbeat (every 5 seconds)
  trackingInterval = setInterval(trackActiveWindow, 5000)
})

app.on('will-quit', () => {
  if (trackingInterval) clearInterval(trackingInterval)
})
