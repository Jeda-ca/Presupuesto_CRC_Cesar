import { app, dialog, BrowserWindow } from 'electron'
import { writeFile, unlink, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ResumenQuery } from '@shared/schemas/dto'
import { nombreSede } from '@shared/domain/sedes'
import { dashboardService } from './dashboardService'
import { construirInformeHTML } from '../lib/informeHtml'

const ENTIDAD = 'Cruz Roja Colombiana Seccional Cesar'

function nombreSugerido(query: ResumenQuery): string {
  return `Informe-${nombreSede(query.sedeId)}-${query.desde}_a_${query.hasta}.pdf`
}

/**
 * Lee el logo institucional y lo devuelve como data URI base64 para incrustarlo
 * en el HTML del informe. Funciona en empaquetado (process.resourcesPath) y en
 * desarrollo (carpeta resources del proyecto). Si no existe, devuelve undefined
 * y el informe usa el distintivo por defecto.
 */
async function logoComoDataUri(): Promise<string | undefined> {
  const ruta = app.isPackaged
    ? join(process.resourcesPath, 'logo.png')
    : join(app.getAppPath(), 'resources', 'logo.png')
  if (!existsSync(ruta)) return undefined
  try {
    const datos = await readFile(ruta)
    return `data:image/png;base64,${datos.toString('base64')}`
  } catch {
    return undefined
  }
}

async function renderizarPDF(html: string): Promise<Buffer> {
  const tempHtml = join(app.getPath('temp'), `informe-${Date.now()}.html`)
  await writeFile(tempHtml, html, 'utf-8')

  const ventana = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true, sandbox: false, javascript: false }
  })

  try {
    await ventana.loadURL(pathToFileURL(tempHtml).toString())
    return await ventana.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'none' },
      pageSize: 'A4'
    })
  } finally {
    if (!ventana.isDestroyed()) ventana.destroy()
    await unlink(tempHtml).catch(() => undefined)
  }
}

export const reporteService = {
  async generarPdf(query: ResumenQuery): Promise<{ ruta: string } | null> {
    const ventanaActiva =
      BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null

    const destino = await dialog.showSaveDialog(ventanaActiva!, {
      title: 'Guardar informe PDF',
      defaultPath: nombreSugerido(query),
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (destino.canceled || !destino.filePath) return null

    const resumen = dashboardService.resumen(query)
    const html = construirInformeHTML(resumen, {
      titulo: 'Informe de ejecución presupuestal',
      entidad: ENTIDAD,
      sede: nombreSede(query.sedeId),
      generadoEn: new Date().toLocaleString('es-CO'),
      logoDataUri: await logoComoDataUri()
    })

    const pdf = await renderizarPDF(html)
    await writeFile(destino.filePath, pdf)
    return { ruta: destino.filePath }
  }
}
