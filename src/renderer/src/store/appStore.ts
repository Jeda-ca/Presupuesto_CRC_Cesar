import { create } from 'zustand'
import type { Configuracion } from '@shared/domain/types'
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
  areaSeleccionada: string | null
  toasts: Toast[]
  irA: (vista: Vista, areaId?: string | null) => void
  cargarInicial: () => Promise<void>
  refrescarWorkspace: () => Promise<void>
  setConfig: (config: Configuracion) => void
  notificar: (tipo: Toast['tipo'], mensaje: string) => void
  cerrarToast: (id: number) => void
}

let toastSeq = 0

export const useAppStore = create<AppState>((set, get) => ({
  vista: 'dashboard',
  workspace: null,
  config: null,
  areaSeleccionada: null,
  toasts: [],

  irA: (vista, areaId) =>
    set((s) => ({ vista, areaSeleccionada: areaId !== undefined ? areaId : s.areaSeleccionada })),

  cargarInicial: async () => {
    const [workspace, config] = await Promise.all([
      unwrap(api.workspace.estado()),
      unwrap(api.config.obtener())
    ])
    set({ workspace, config })
  },

  refrescarWorkspace: async () => {
    set({ workspace: await unwrap(api.workspace.estado()) })
  },

  setConfig: (config) => set({ config }),

  notificar: (tipo, mensaje) => {
    const id = ++toastSeq
    set((s) => ({ toasts: [...s.toasts, { id, tipo, mensaje }] }))
    setTimeout(() => get().cerrarToast(id), 4500)
  },

  cerrarToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))
