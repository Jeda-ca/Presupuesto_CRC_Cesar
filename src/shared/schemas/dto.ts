import { z } from 'zod'
import { naturalezaSchema, ambitoPresupuestoSchema } from './models'

export const sedeIdSchema = z.string().min(1)

export const crearAreaSchema = z.object({
  sedeId: sedeIdSchema,
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500).default(''),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#d7261e'),
  naturaleza: naturalezaSchema
})

export const actualizarAreaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  naturaleza: naturalezaSchema
})

export const asignarCuentaAreaSchema = z.object({
  sedeId: sedeIdSchema,
  codigo: z.string().min(1),
  areaId: z.string().min(1).nullable()
})

export const guardarPresupuestoSchema = z
  .object({
    sedeId: sedeIdSchema,
    ambito: ambitoPresupuestoSchema,
    referenciaId: z.string().min(1),
    anio: z.number().int().gte(2000).lte(2100),
    montoAnual: z.number().nonnegative(),
    meses: z.array(z.number().nonnegative()).length(12)
  })
  .refine(
    (p) => Math.abs(p.meses.reduce((a, b) => a + b, 0) - p.montoAnual) < 1,
    'La suma de los meses debe coincidir con el monto anual'
  )

export const listarPresupuestosSchema = z.object({
  sedeId: sedeIdSchema,
  anio: z.number().int().gte(2000).lte(2100)
})

export const actualizarConfiguracionSchema = z.object({
  umbralRiesgo: z.number().gt(0).lte(1),
  umbralBajoUso: z.number().gte(0).lt(1),
  anioActivo: z.number().int().gte(2000).lte(2100),
  sedeActiva: z.string().nullable()
})

export const periodoQuerySchema = z.object({
  desde: z.string(),
  hasta: z.string()
})

export const resumenQuerySchema = periodoQuerySchema.extend({
  sedeId: sedeIdSchema,
  naturaleza: naturalezaSchema.nullish()
})

export const detalleAreaQuerySchema = z.object({
  areaId: z.string().min(1),
  desde: z.string(),
  hasta: z.string()
})

export const movimientosQuerySchema = z.object({
  sedeId: sedeIdSchema,
  desde: z.string(),
  hasta: z.string(),
  areaId: z.string().min(1).nullish(),
  cuenta: z.string().min(1).nullish()
})

export const confirmarImportacionSchema = z.object({
  token: z.string().min(1),
  sedes: z.array(z.string().min(1)).nullish()
})

export const idSchema = z.object({ id: z.string().min(1) })

export type CrearAreaInput = z.infer<typeof crearAreaSchema>
export type ActualizarAreaInput = z.infer<typeof actualizarAreaSchema>
export type AsignarCuentaAreaInput = z.infer<typeof asignarCuentaAreaSchema>
export type GuardarPresupuestoInput = z.infer<typeof guardarPresupuestoSchema>
export type ListarPresupuestosInput = z.infer<typeof listarPresupuestosSchema>
export type ActualizarConfiguracionInput = z.infer<typeof actualizarConfiguracionSchema>
export type PeriodoQuery = z.infer<typeof periodoQuerySchema>
export type ResumenQuery = z.infer<typeof resumenQuerySchema>
export type DetalleAreaQuery = z.infer<typeof detalleAreaQuerySchema>
export type MovimientosQuery = z.infer<typeof movimientosQuerySchema>
export type ConfirmarImportacionInput = z.infer<typeof confirmarImportacionSchema>
