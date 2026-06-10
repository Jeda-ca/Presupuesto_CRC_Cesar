import { z } from 'zod'

export const naturalezaSchema = z.enum(['ingreso', 'gasto', 'costo'])

export const cuentaContableSchema = z.object({
  codigo: z.string().min(1),
  descripcion: z.string(),
  clase: z.number().int(),
  naturaleza: naturalezaSchema,
  areaId: z.string().nullable(),
  activa: z.boolean()
})

export const areaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(120),
  descripcion: z.string().max(500),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  naturaleza: naturalezaSchema,
  createdAt: z.string(),
  updatedAt: z.string()
})

export const ambitoPresupuestoSchema = z.enum(['area', 'cuenta'])

export const presupuestoSchema = z.object({
  id: z.string().min(1),
  ambito: ambitoPresupuestoSchema,
  referenciaId: z.string().min(1),
  anio: z.number().int().gte(2000).lte(2100),
  montoAnual: z.number().nonnegative(),
  meses: z.array(z.number().nonnegative()).length(12),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const movimientoSchema = z.object({
  id: z.string().min(1),
  cuenta: z.string().min(1),
  nit: z.string(),
  tercero: z.string(),
  comprobante: z.string(),
  fecha: z.string(),
  detalle: z.string(),
  centroCosto: z.string(),
  debito: z.number(),
  credito: z.number(),
  importacionId: z.string()
})

export const importacionSchema = z.object({
  id: z.string().min(1),
  archivo: z.string(),
  hash: z.string(),
  fechaProcesado: z.string().nullable(),
  periodoInicio: z.string().nullable(),
  periodoFin: z.string().nullable(),
  totalRegistros: z.number().int().nonnegative(),
  sedes: z.array(z.string()).default([]),
  fechaCarga: z.string()
})

export const configuracionSchema = z.object({
  umbralRiesgo: z.number().gt(0).lte(1),
  umbralBajoUso: z.number().gte(0).lt(1),
  anioActivo: z.number().int().gte(2000).lte(2100)
})

export const STORE_VERSION = 1

export const storeDataSchema = z.object({
  version: z.number().int(),
  areas: z.array(areaSchema),
  cuentas: z.array(cuentaContableSchema),
  presupuestos: z.array(presupuestoSchema),
  movimientos: z.array(movimientoSchema),
  importaciones: z.array(importacionSchema),
  configuracion: configuracionSchema
})
