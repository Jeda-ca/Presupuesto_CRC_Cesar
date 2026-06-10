import { dialog, BrowserWindow } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS, type PreviewImportacion } from '@shared/ipc/contract'
import { confirmarImportacionSchema } from '@shared/schemas/dto'
import { importService } from '../services/importService'
import { handle } from './helpers'

function ventanaActiva(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export function registrarImportRoutes(): void {
  handle(
    IPC_CHANNELS.importacion.previsualizar,
    null,
    async (): Promise<PreviewImportacion | null> => {
      const resultado = await dialog.showOpenDialog(ventanaActiva()!, {
        title: 'Seleccionar exportación de Siimed',
        filters: [{ name: 'Libro Auxiliar (Excel/CSV)', extensions: ['xlsx', 'xls', 'csv'] }],
        properties: ['openFile']
      })
      if (resultado.canceled || resultado.filePaths.length === 0) return null
      return importService.previsualizar(resultado.filePaths[0])
    }
  )

  handle(IPC_CHANNELS.importacion.confirmar, confirmarImportacionSchema, (input) =>
    importService.confirmar(input.token, input.sedes)
  )

  handle(IPC_CHANNELS.importacion.descartar, z.string().min(1), (token) =>
    importService.descartar(token)
  )

  handle(IPC_CHANNELS.importacion.listar, null, () => importService.listar())

  handle(IPC_CHANNELS.importacion.eliminar, z.string().min(1), (id) => importService.eliminar(id))
}
