import { app } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '@shared/ipc/contract'
import {
  crearAreaSchema,
  actualizarAreaSchema,
  asignarCuentaAreaSchema,
  guardarPresupuestoSchema,
  listarPresupuestosSchema,
  actualizarConfiguracionSchema,
  sedeIdSchema
} from '@shared/schemas/dto'
import { areaService } from '../services/areaService'
import { cuentaService } from '../services/cuentaService'
import { presupuestoService } from '../services/presupuestoService'
import { configService } from '../services/configService'
import { sedeService } from '../services/sedeService'
import { handle } from './helpers'

export function registrarCatalogoRoutes(): void {
  handle(IPC_CHANNELS.app.version, null, () => app.getVersion())

  handle(IPC_CHANNELS.config.obtener, null, () => configService.obtener())
  handle(IPC_CHANNELS.config.actualizar, actualizarConfiguracionSchema, (input) =>
    configService.actualizar(input)
  )

  handle(IPC_CHANNELS.sedes.listar, null, () => sedeService.listar())

  handle(IPC_CHANNELS.areas.listar, sedeIdSchema, (sedeId) => areaService.listar(sedeId))
  handle(IPC_CHANNELS.areas.crear, crearAreaSchema, (input) => areaService.crear(input))
  handle(IPC_CHANNELS.areas.actualizar, actualizarAreaSchema, (input) =>
    areaService.actualizar(input)
  )
  handle(IPC_CHANNELS.areas.eliminar, z.string().min(1), (id) => areaService.eliminar(id))

  handle(IPC_CHANNELS.cuentas.listar, sedeIdSchema, (sedeId) => cuentaService.listar(sedeId))
  handle(IPC_CHANNELS.cuentas.asignarArea, asignarCuentaAreaSchema, (input) =>
    cuentaService.asignarArea(input)
  )

  handle(IPC_CHANNELS.presupuestos.listarPorAnio, listarPresupuestosSchema, (input) =>
    presupuestoService.listarPorAnio(input.sedeId, input.anio)
  )
  handle(IPC_CHANNELS.presupuestos.guardar, guardarPresupuestoSchema, (input) =>
    presupuestoService.guardar(input)
  )
  handle(IPC_CHANNELS.presupuestos.eliminar, z.string().min(1), (id) =>
    presupuestoService.eliminar(id)
  )
}
