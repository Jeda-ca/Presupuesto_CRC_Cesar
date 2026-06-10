import type { JSX } from 'react'
import { useAppStore } from '../store/appStore'
import { Icono } from '../components/ui/Icono'

export function SedeSelectorPage(): JSX.Element {
  const sedes = useAppStore((s) => s.sedes)
  const ultima = useAppStore((s) => s.config?.sedeActiva ?? null)
  const seleccionar = useAppStore((s) => s.seleccionarSede)
  const workspace = useAppStore((s) => s.workspace)

  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-100 p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-crc-600 text-3xl font-bold text-white">
          +
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Herramienta de Presupuesto</h1>
        <p className="mt-1 text-sm text-slate-500">Cruz Roja Colombiana Seccional Cesar</p>
      </div>

      <p className="mb-5 text-sm font-medium text-slate-600">
        Seleccione la sede con la que desea trabajar
      </p>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {sedes.map((sede) => (
          <button
            key={sede.prefijo}
            onClick={() => seleccionar(sede.prefijo)}
            className="group relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-crc-400 hover:shadow-md"
          >
            {ultima === sede.prefijo && (
              <span className="absolute right-3 top-3 rounded-full bg-crc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crc-600">
                Última usada
              </span>
            )}
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600 group-hover:bg-crc-50 group-hover:text-crc-600">
              {sede.nombre.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-base font-semibold text-slate-800">{sede.nombre}</span>
            <span className="mt-1 text-xs text-slate-400">
              Centro de costo {sede.prefijo}-***
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-crc-600 opacity-0 transition-opacity group-hover:opacity-100">
              Entrar <Icono nombre="chevron" className="h-4 w-4" />
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Cada sede maneja sus propias áreas, cuentas y presupuestos · {workspace?.nombre ?? ''}
      </p>
    </div>
  )
}
