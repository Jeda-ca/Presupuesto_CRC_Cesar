import type { z } from 'zod'
import type {
  naturalezaSchema,
  sedeSchema,
  cuentaContableSchema,
  areaSchema,
  ambitoPresupuestoSchema,
  presupuestoSchema,
  movimientoSchema,
  importacionSchema,
  configuracionSchema,
  storeDataSchema
} from '../schemas/models'

export type Naturaleza = z.infer<typeof naturalezaSchema>
export type Sede = z.infer<typeof sedeSchema>
export type CuentaContable = z.infer<typeof cuentaContableSchema>
export type Area = z.infer<typeof areaSchema>
export type AmbitoPresupuesto = z.infer<typeof ambitoPresupuestoSchema>
export type Presupuesto = z.infer<typeof presupuestoSchema>
export type Movimiento = z.infer<typeof movimientoSchema>
export type Importacion = z.infer<typeof importacionSchema>
export type Configuracion = z.infer<typeof configuracionSchema>
export type StoreData = z.infer<typeof storeDataSchema>
