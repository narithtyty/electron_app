import { app, BrowserWindow, Menu, MenuItem } from 'electron'
import path from 'node:path'
import os from 'node:os'

import { registerRoute } from 'lib/electron-router-dom'
import { setupIpcHandlers } from './ipcHandlers'

// Create application menu with copy/paste shortcuts
function createAppMenu() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

async function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    fullscreenable: true,
    show: false,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration
      contextIsolation: false, // WARNING: Disabling contextIsolation is not recommended for production builds due to security risks.
      // Consider using a preload script to expose necessary APIs safely.
      webSecurity: true, // Keep webSecurity enabled by default when nodeIntegration is true
      // Enable web security features for copy/paste
      enableBlinkFeatures: 'CSSColorSchemeUARendering',
    }
  })

  registerRoute({
    id: 'main',
    browserWindow: mainWindow,
    htmlFile: path.join(__dirname, '../renderer/index.html'),
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // Open DevTools in development mode to see console logs
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools()
    }
  })

  // Enable context menu (right-click menu) for copy/paste
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu()

    // Add copy/paste options when text is selected
    if (params.selectionText) {
      menu.append(new MenuItem({
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        click: () => {
          mainWindow.webContents.copy()
        }
      }))
    }

    // Add paste option in editable fields
    if (params.isEditable) {
      menu.append(new MenuItem({
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        click: () => {
          mainWindow.webContents.paste()
        }
      }))
    }

    // Add select all option
    if (params.selectionText || params.isEditable) {
      menu.append(new MenuItem({
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: () => {
          mainWindow.webContents.selectAll()
        }
      }))
    }

    // Show the context menu if it has items
    if (menu.items.length > 0) {
      menu.popup()
    }
  })
}

// Set app user data path to avoid cache permission issues
app.setPath('userData', path.join(os.tmpdir(), 'electron-app-data'))

// Add command line switches to reduce cache-related errors
app.commandLine.appendSwitch('--disable-gpu-sandbox')
app.commandLine.appendSwitch('--disable-software-rasterizer')
app.commandLine.appendSwitch('--disable-gpu')

app.whenReady().then(() => {
  setupIpcHandlers()
  createMainWindow()
  createAppMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})