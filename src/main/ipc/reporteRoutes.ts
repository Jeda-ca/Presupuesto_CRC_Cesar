import { IPC_CHANNELS } from '@shared/ipc/contract'
import { resumenQuerySchema } from '@shared/schemas/dto'
import { reporteService } from '../services/reporteService'
import { handle } from './helpers'

export function registrarReporteRoutes(): void {
  handle(IPC_CHANNELS.reporte.generarPdf, resumenQuerySchema, (query) =>
    reporteService.generarPdf(query)
  )
}
