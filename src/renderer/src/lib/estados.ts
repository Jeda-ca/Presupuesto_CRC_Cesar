import type { EstadoEjecucion } from '@shared/ipc/contract'
import type { Naturaleza } from '@shared/domain/types'

export interface MetaEstado {
  label: string
  chip: string
  barra: string
  color: string
}

const BASE: Record<EstadoEjecucion, MetaEstado> = {
  normal: {
    label: 'En rango',
    chip: 'bg-emerald-100 text-emerald-700',
    barra: 'bg-emerald-500',
    color: '#16a34a'
  },
  en_riesgo: {
    label: 'En riesgo',
    chip: 'bg-amber-100 text-amber-700',
    barra: 'bg-amber-500',
    color: '#d97706'
  },
  excedido: {
    label: 'Excedido',
    chip: 'bg-red-100 text-red-700',
    barra: 'bg-red-500',
    color: '#dc2626'
  },
  meta_superada: {
    label: 'Meta superada',
    chip: 'bg-emerald-100 text-emerald-800',
    barra: 'bg-emerald-600',
    color: '#059669'
  },
  bajo_uso: {
    label: 'Subejecución',
    chip: 'bg-sky-100 text-sky-700',
    barra: 'bg-sky-500',
    color: '#0284c7'
  },
  sin_presupuesto: {
    label: 'Sin presupuesto',
    chip: 'bg-slate-100 text-slate-500',
    barra: 'bg-slate-300',
    color: '#94a3b8'
  }
}

const INGRESO: Partial<Record<EstadoEjecucion, MetaEstado>> = {
  bajo_uso: {
    label: 'Recaudo bajo',
    chip: 'bg-amber-100 text-amber-700',
    barra: 'bg-amber-500',
    color: '#d97706'
  },
  normal: {
    label: 'En progreso',
    chip: 'bg-emerald-100 text-emerald-700',
    barra: 'bg-emerald-500',
    color: '#16a34a'
  }
}

/**
 * Presentación de un estado de ejecución según la naturaleza: para ingresos el
 * presupuesto es una meta (superarla es positivo, recaudar poco es la alerta).
 */
export function estadoMeta(estado: EstadoEjecucion, naturaleza?: Naturaleza | null): MetaEstado {
  if (naturaleza === 'ingreso') return INGRESO[estado] ?? BASE[estado]
  return BASE[estado]
}

/** Sentido presupuestal agregado de un conjunto de áreas: meta de ingresos, límite de egresos, o mixto. */
export type SentidoPresupuesto = 'ingreso' | 'egreso' | null

export function sentidoDeAreas(areas: { naturaleza: Naturaleza }[]): SentidoPresupuesto {
  if (areas.length === 0) return null
  const hayIngreso = areas.some((a) => a.naturaleza === 'ingreso')
  const hayEgreso = areas.some((a) => a.naturaleza !== 'ingreso')
  if (hayIngreso && hayEgreso) return null
  return hayIngreso ? 'ingreso' : 'egreso'
}

export interface KpiDisponible {
  titulo: string
  valor: number
  acento: string
  detalle?: string
}

/** Presenta el KPI "Disponible" según el sentido: superávit para ingresos, sobregiro para egresos. */
export function kpiDisponible(sentido: SentidoPresupuesto, disponible: number): KpiDisponible {
  if (sentido === 'ingreso') {
    return disponible < 0
      ? {
          titulo: 'Superávit',
          valor: -disponible,
          acento: 'text-emerald-600',
          detalle: 'Meta de ingresos superada'
        }
      : { titulo: 'Por recaudar', valor: disponible, acento: 'text-slate-800' }
  }
  if (sentido === 'egreso') {
    return disponible < 0
      ? {
          titulo: 'Disponible',
          valor: disponible,
          acento: 'text-red-600',
          detalle: 'Presupuesto excedido'
        }
      : { titulo: 'Disponible', valor: disponible, acento: 'text-emerald-600' }
  }
  return { titulo: 'Disponible', valor: disponible, acento: 'text-slate-800' }
}

/** Color del valor "disponible" de una fila individual según su naturaleza. */
export function acentoDisponibleFila(naturaleza: Naturaleza, disponible: number): string {
  if (disponible >= 0) return 'text-slate-600'
  return naturaleza === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
}
