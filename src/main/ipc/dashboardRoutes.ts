import { IPC_CHANNELS } from '@shared/ipc/contract'
import {
  periodoQuerySchema,
  detalleAreaQuerySchema,
  movimientosQuerySchema
} from '@shared/schemas/dto'
import { dashboardService } from '../services/dashboardService'
import { movimientoService } from '../services/movimientoService'
import { handle } from './helpers'

export function registrarDashboardRoutes(): void {
  handle(IPC_CHANNELS.dashboard.resumen, periodoQuerySchema, (query) =>
    dashboardService.resumen(query)
  )
  handle(IPC_CHANNELS.dashboard.detalleArea, detalleAreaQuerySchema, (query) =>
    dashboardService.detalleArea(query)
  )
  handle(IPC_CHANNELS.movimientos.listar, movimientosQuerySchema, (query) =>
    movimientoService.listar(query)
  )
}
