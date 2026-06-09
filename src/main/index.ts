import { app, shell, session, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { store } from './infra/store'
import { registrarIpc } from './ipc'

const esDesarrollo = !app.isPackaged

function aplicarCSP(): void {
  const politica = esDesarrollo
    ? "default-src 'self' 'unsafe-inline' data:; connect-src 'self' ws: http://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
  session.defaultSession.webRequest.onHeadersReceived((detalles, callback) => {
    callback({
      responseHeaders: {
        ...detalles.responseHeaders,
        'Content-Security-Policy': [politica]
      }
    })
  })
}

function crearVentana(): void {
  const ventana = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: 'Presupuesto CRC Cesar',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  ventana.on('ready-to-show', () => ventana.show())

  ventana.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  ventana.webContents.on('will-navigate', (evento) => evento.preventDefault())

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (esDesarrollo && rendererUrl) {
    void ventana.loadURL(rendererUrl)
  } else {
    void ventana.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setName('Presupuesto CRC Cesar')
  aplicarCSP()
  await store.init()
  registrarIpc()
  crearVentana()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

let cerrando = false
app.on('before-quit', async (evento) => {
  if (cerrando) return
  cerrando = true
  evento.preventDefault()
  try {
    await store.flush()
  } catch (error) {
    console.error('Error al guardar antes de cerrar:', error)
  } finally {
    app.exit(0)
  }
})
