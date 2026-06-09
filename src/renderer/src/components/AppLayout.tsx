import type { JSX, ReactNode } from 'react'
import { useAppStore, type Vista } from '../store/appStore'
import { Icono, type NombreIcono } from './ui/Icono'
import { api, unwrap } from '../api/client'

const NAV: { vista: Vista; etiqueta: string; icono: NombreIcono }[] = [
  { vista: 'dashboard', etiqueta: 'Dashboard', icono: 'dashboard' },
  { vista: 'importar', etiqueta: 'Importar', icono: 'importar' },
  { vista: 'areas', etiqueta: 'Áreas y presupuestos', icono: 'areas' },
  { vista: 'detalle', etiqueta: 'Detalle por área', icono: 'detalle' },
  { vista: 'informes', etiqueta: 'Informes', icono: 'informes' },
  { vista: 'configuracion', etiqueta: 'Configuración', icono: 'config' }
]

function horaCorta(iso: string | null): string {
  if (!iso) return 'sin cambios'
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export function AppLayout({ children }: { children: ReactNode }): JSX.Element {
  const vista = useAppStore((s) => s.vista)
  const irA = useAppStore((s) => s.irA)
  const workspace = useAppStore((s) => s.workspace)
  const refrescarWorkspace = useAppStore((s) => s.refrescarWorkspace)
  const notificar = useAppStore((s) => s.notificar)

  async function abrir(): Promise<void> {
    try {
      const estado = await unwrap(api.workspace.abrir())
      if (estado) {
        await refrescarWorkspace()
        notificar('exito', 'Espacio de trabajo abierto')
      }
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  async function guardarComo(): Promise<void> {
    try {
      const estado = await unwrap(api.workspace.guardarComo())
      if (estado) {
        await refrescarWorkspace()
        notificar('exito', 'Copia guardada correctamente')
      }
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crc-600 font-bold text-white">
            +
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Presupuesto</p>
            <p className="text-xs text-slate-400">Cruz Roja Cesar</p>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const activo = vista === item.vista
            return (
              <button
                key={item.vista}
                onClick={() => irA(item.vista)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  activo ? 'bg-crc-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icono nombre={item.icono} className="h-5 w-5" />
                {item.etiqueta}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
          v0.1.0
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {workspace?.nombre ?? 'Cargando...'}
            </p>
            <p className="text-xs text-slate-400">
              Guardado automático · {horaCorta(workspace?.modificadoEn ?? null)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={abrir}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icono nombre="abrir" className="h-4 w-4" /> Abrir
            </button>
            <button
              onClick={guardarComo}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icono nombre="guardar" className="h-4 w-4" /> Guardar copia
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
