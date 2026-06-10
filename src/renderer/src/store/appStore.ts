import { create } from 'zustand'
import type { Configuracion, Sede } from '@shared/domain/types'
import type { WorkspaceEstado } from '@shared/ipc/contract'
import { api, unwrap } from '../api/client'

export type Vista = 'dashboard' | 'importar' | 'areas' | 'detalle' | 'informes' | 'configuracion'

export interface Toast {
  id: number
  tipo: 'exito' | 'error' | 'info'
  mensaje: string
}

interface AppState {
  vista: Vista
  workspace: WorkspaceEstado | null
  config: Configuracion | null
  sedes: Sede[]
  sedeActiva: string | null
  areaSeleccionada: string | null
  toasts: Toast[]
  irA: (vista: Vista, areaId?: string | null) => void
  cargarInicial: () => Promise<void>
  refrescarWorkspace: () => Promise<void>
  refrescarSedes: () => Promise<void>
  seleccionarSede: (prefijo: string) => Promise<void>
  cambiarSede: () => void
  setConfig: (config: Configuracion) => void
  notificar: (tipo: Toast['tipo'], mensaje: string) => void
  cerrarToast: (id: number) => void
}

let toastSeq = 0

export const useAppStore = create<AppState>((set, get) => ({
  vista: 'dashboard',
  workspace: null,
  config: null,
  sedes: [],
  sedeActiva: null,
  areaSeleccionada: null,
  toasts: [],

  irA: (vista, areaId) =>
    set((s) => ({ vista, areaSeleccionada: areaId !== undefined ? areaId : s.areaSeleccionada })),

  cargarInicial: async () => {
    const [workspace, config, sedes] = await Promise.all([
      unwrap(api.workspace.estado()),
      unwrap(api.config.obtener()),
      unwrap(api.sedes.listar())
    ])
    set({ workspace, config, sedes, sedeActiva: null })
  },

  refrescarWorkspace: async () => {
    set({ workspace: await unwrap(api.workspace.estado()) })
  },

  refrescarSedes: async () => {
    set({ sedes: await unwrap(api.sedes.listar()) })
  },

  seleccionarSede: async (prefijo) => {
    set({ sedeActiva: prefijo, vista: 'dashboard', areaSeleccionada: null })
    const config = get().config
    if (!config || config.sedeActiva === prefijo) return
    try {
      const actualizada = await unwrap(
        api.config.actualizar({
          umbralRiesgo: config.umbralRiesgo,
          umbralBajoUso: config.umbralBajoUso,
          anioActivo: config.anioActivo,
          sedeActiva: prefijo
        })
      )
      set({ config: actualizada })
    } catch (e) {
      get().notificar('error', `No se pudo recordar la sede: ${(e as Error).message}`)
    }
  },

  cambiarSede: () => set({ sedeActiva: null, areaSeleccionada: null }),

  setConfig: (config) => set({ config }),

  notificar: (tipo, mensaje) => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, tipo, mensaje }] }))
    setTimeout(() => get().cerrarToast(id), 4500)
  },

  cerrarToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))
