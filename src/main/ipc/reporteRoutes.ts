import { IPC_CHANNELS } from '@shared/ipc/contract'
import { periodoQuerySchema } from '@shared/schemas/dto'
import { reporteService } from '../services/reporteService'
import { handle } from './helpers'

export function registrarReporteRoutes(): void {
  handle(IPC_CHANNELS.reporte.generarPdf, periodoQuerySchema, (query) =>
    reporteService.generarPdf(query)
  )
}
