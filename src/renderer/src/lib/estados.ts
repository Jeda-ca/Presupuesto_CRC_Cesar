import type { EstadoEjecucion } from '@shared/ipc/contract'

export const ESTADO_META: Record<
  EstadoEjecucion,
  { label: string; chip: string; barra: string; color: string }
> = {
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
