import { app } from 'electron'
import { z } from 'zod'
import { IPC_CHANNELS } from '@shared/ipc/contract'
import {
  crearAreaSchema,
  actualizarAreaSchema,
  asignarCuentaAreaSchema,
  guardarPresupuestoSchema,
  actualizarConfiguracionSchema
} from '@shared/schemas/dto'
import { areaService } from '../services/areaService'
import { cuentaService } from '../services/cuentaService'
import { presupuestoService } from '../services/presupuestoService'
import { configService } from '../services/configService'
import { handle } from './helpers'

export function registrarCatalogoRoutes(): void {
  handle(IPC_CHANNELS.app.version, null, () => app.getVersion())

  handle(IPC_CHANNELS.config.obtener, null, () => configService.obtener())
  handle(IPC_CHANNELS.config.actualizar, actualizarConfiguracionSchema, (input) =>
    configService.actualizar(input)
  )

  handle(IPC_CHANNELS.areas.listar, null, () => areaService.listar())
  handle(IPC_CHANNELS.areas.crear, crearAreaSchema, (input) => areaService.crear(input))
  handle(IPC_CHANNELS.areas.actualizar, actualizarAreaSchema, (input) =>
    areaService.actualizar(input)
  )
  handle(IPC_CHANNELS.areas.eliminar, z.string().min(1), (id) => areaService.eliminar(id))

  handle(IPC_CHANNELS.cuentas.listar, null, () => cuentaService.listar())
  handle(IPC_CHANNELS.cuentas.asignarArea, asignarCuentaAreaSchema, (input) =>
    cuentaService.asignarArea(input)
  )

  handle(IPC_CHANNELS.presupuestos.listarPorAnio, z.number().int(), (anio) =>
    presupuestoService.listarPorAnio(anio)
  )
  handle(IPC_CHANNELS.presupuestos.guardar, guardarPresupuestoSchema, (input) =>
    presupuestoService.guardar(input)
  )
  handle(IPC_CHANNELS.presupuestos.eliminar, z.string().min(1), (id) =>
    presupuestoService.eliminar(id)
  )
}
