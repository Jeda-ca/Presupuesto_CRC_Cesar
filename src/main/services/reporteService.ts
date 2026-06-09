import { app, dialog, BrowserWindow } from 'electron'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PeriodoQuery } from '@shared/schemas/dto'
import { dashboardService } from './dashboardService'
import { construirInformeHTML } from '../lib/informeHtml'

const ENTIDAD = 'Cruz Roja Colombiana Seccional Cesar'

function nombreSugerido(query: PeriodoQuery): string {
  return `Informe-Presupuesto-${query.desde}_a_${query.hasta}.pdf`
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
  async generarPdf(query: PeriodoQuery): Promise<{ ruta: string } | null> {
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
      generadoEn: new Date().toLocaleString('es-CO')
    })

    const pdf = await renderizarPDF(html)
    await writeFile(destino.filePath, pdf)
    return { ruta: destino.filePath }
  }
}
