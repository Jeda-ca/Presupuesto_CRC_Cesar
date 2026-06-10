import { useEffect, useState, type JSX } from 'react'
import type { DashboardResumen } from '@shared/ipc/contract'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta, TarjetaTitulo } from '../components/ui/Tarjeta'
import { KpiCard } from '../components/KpiCard'
import { Boton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { PeriodoSelector, rangoAnio, type Periodo } from '../components/PeriodoSelector'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'
import { formatoMoneda, formatoPorcentaje } from '../lib/formato'
import {
  estadoMeta,
  sentidoDeAreas,
  kpiDisponible,
  acentoDisponibleFila
} from '../lib/estados'

export function InformesPage(): JSX.Element {
  const anio = useAppStore((s) => s.config?.anioActivo ?? new Date().getFullYear())
  const notificar = useAppStore((s) => s.notificar)
  const sedeActiva = useAppStore((s) => s.sedeActiva)!
  const [periodo, setPeriodo] = useState<Periodo>(rangoAnio(anio))
  const [resumen, setResumen] = useState<DashboardResumen | null>(null)
  const [generando, setGenerando] = useState(false)

  useEffect(() => setPeriodo(rangoAnio(anio)), [anio])

  useEffect(() => {
    let activo = true
    unwrap(api.dashboard.resumen({ ...periodo, sedeId: sedeActiva }))
      .then((r) => activo && setResumen(r))
      .catch((e: Error) => notificar('error', e.message))
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, sedeActiva])

  const kpiDispInforme = kpiDisponible(
    sentidoDeAreas(resumen?.areas ?? []),
    resumen?.totalDisponible ?? 0
  )

  async function generar(): Promise<void> {
    setGenerando(true)
    try {
      const r = await unwrap(api.reporte.generarPdf({ ...periodo, sedeId: sedeActiva }))
      if (r) notificar('exito', `Informe guardado en: ${r.ruta}`)
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Informes"
        descripcion="Genere un informe en PDF para presentar en juntas directivas."
        acciones={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodoSelector periodo={periodo} anio={anio} onCambio={setPeriodo} />
            <Boton onClick={generar} disabled={generando || !resumen}>
              <Icono nombre="informes" className="h-4 w-4" />
              {generando ? 'Generando...' : 'Generar PDF'}
            </Boton>
          </div>
        }
      />

      {resumen && (
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Vista previa del contenido del informe. Al generar el PDF se le pedirá dónde guardarlo.
          </p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard titulo="Presupuestado" valor={formatoMoneda(resumen.totalPresupuesto)} />
            <KpiCard titulo="Ejecutado" valor={formatoMoneda(resumen.totalEjecutado)} />
            <KpiCard titulo="% Ejecución" valor={formatoPorcentaje(resumen.porcentaje)} />
            <KpiCard
              titulo={kpiDispInforme.titulo}
              valor={formatoMoneda(kpiDispInforme.valor)}
              detalle={kpiDispInforme.detalle}
              acento={kpiDispInforme.acento}
            />
          </div>

          <Tarjeta>
            <TarjetaTitulo>Comparativo por área</TarjetaTitulo>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2.5 font-medium">Área</th>
                  <th className="px-5 py-2.5 text-right font-medium">Presupuesto</th>
                  <th className="px-5 py-2.5 text-right font-medium">Ejecutado</th>
                  <th className="px-5 py-2.5 text-right font-medium">Disponible</th>
                  <th className="px-5 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {resumen.areas.map((a) => {
                  const meta = estadoMeta(a.estado, a.naturaleza)
                  return (
                    <tr key={a.areaId} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: a.color }} />
                        <span className="text-slate-700">{a.nombre}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-600">{formatoMoneda(a.presupuesto)}</td>
                      <td className="px-5 py-2.5 text-right text-slate-600">{formatoMoneda(a.ejecutado)}</td>
                      <td className={`px-5 py-2.5 text-right ${acentoDisponibleFila(a.naturaleza, a.disponible)}`}>
                        {formatoMoneda(a.disponible)}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {resumen.areas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                      Configure áreas y presupuestos para incluirlos en el informe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Tarjeta>
        </div>
      )}
    </div>
  )
}
