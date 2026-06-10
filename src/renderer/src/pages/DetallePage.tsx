import { useEffect, useState, type JSX } from 'react'
import type { Area } from '@shared/domain/types'
import type { AreaDetalle, MovimientoVista } from '@shared/ipc/contract'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta, TarjetaTitulo } from '../components/ui/Tarjeta'
import { KpiCard } from '../components/KpiCard'
import { Selector } from '../components/ui/Campo'
import { PeriodoSelector, rangoAnio, type Periodo } from '../components/PeriodoSelector'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'
import { formatoMoneda, formatoPorcentaje, formatoFechaISO } from '../lib/formato'
import { ESTADO_META } from '../lib/estados'

const MAX_FILAS_MOVIMIENTOS = 500

export function DetallePage(): JSX.Element {
  const anio = useAppStore((s) => s.config?.anioActivo ?? new Date().getFullYear())
  const notificar = useAppStore((s) => s.notificar)
  const areaSeleccionada = useAppStore((s) => s.areaSeleccionada)

  const [areas, setAreas] = useState<Area[]>([])
  const [areaId, setAreaId] = useState<string | null>(areaSeleccionada)
  const [periodo, setPeriodo] = useState<Periodo>(rangoAnio(anio))
  const [detalle, setDetalle] = useState<AreaDetalle | null>(null)
  const [cuentaSel, setCuentaSel] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoVista[]>([])

  useEffect(() => setPeriodo(rangoAnio(anio)), [anio])

  useEffect(() => {
    unwrap(api.areas.listar())
      .then((a) => {
        setAreas(a)
        setAreaId((actual) => actual ?? (a.length > 0 ? a[0].id : null))
      })
      .catch((e: Error) => notificar('error', e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!areaId) return
    let activo = true
    unwrap(api.dashboard.detalleArea({ areaId, ...periodo }))
      .then((d) => activo && setDetalle(d))
      .catch((e: Error) => notificar('error', e.message))
    setCuentaSel(null)
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, periodo])

  useEffect(() => {
    if (!areaId) return
    let activo = true
    const query = cuentaSel
      ? { ...periodo, cuenta: cuentaSel }
      : { ...periodo, areaId }
    unwrap(api.movimientos.listar(query))
      .then((m) => activo && setMovimientos(m))
      .catch((e: Error) => notificar('error', e.message))
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, periodo, cuentaSel])

  return (
    <div>
      <EncabezadoPagina
        titulo="Detalle por área"
        descripcion="Ejecución por cuenta, principales terceros y movimientos."
        acciones={
          <div className="flex flex-wrap items-center gap-2">
            <Selector
              className="h-9 w-56"
              value={areaId ?? ''}
              onChange={(e) => setAreaId(e.target.value || null)}
            >
              <option value="" disabled>
                Seleccione un área
              </option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </Selector>
            <PeriodoSelector periodo={periodo} anio={anio} onCambio={setPeriodo} />
          </div>
        }
      />

      {!detalle ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
          {areas.length === 0 ? 'Cree un área primero.' : 'Seleccione un área para ver el detalle.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard titulo="Presupuestado" valor={formatoMoneda(detalle.presupuesto)} />
            <KpiCard
              titulo="Ejecutado"
              valor={formatoMoneda(detalle.ejecutado)}
              detalle={`${detalle.numMovimientos} movimientos`}
            />
            <KpiCard
              titulo="% Ejecución"
              valor={formatoPorcentaje(detalle.porcentaje)}
              acento={detalle.estado === 'excedido' ? 'text-red-600' : 'text-slate-800'}
            />
            <KpiCard
              titulo="Disponible"
              valor={formatoMoneda(detalle.disponible)}
              acento={detalle.disponible < 0 ? 'text-red-600' : 'text-emerald-600'}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <Tarjeta className="xl:col-span-3">
              <TarjetaTitulo
                accion={
                  cuentaSel && (
                    <button
                      onClick={() => setCuentaSel(null)}
                      className="text-xs font-medium text-crc-600 hover:underline"
                    >
                      Ver todas
                    </button>
                  )
                }
              >
                Cuentas del área
              </TarjetaTitulo>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5 font-medium">Cuenta</th>
                    <th className="px-4 py-2.5 text-right font-medium">Presupuesto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ejecutado</th>
                    <th className="px-4 py-2.5 text-right font-medium">%</th>
                    <th className="px-5 py-2.5 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.cuentas.map((c) => {
                    const meta = ESTADO_META[c.estado]
                    return (
                      <tr
                        key={c.codigo}
                        onClick={() => setCuentaSel(cuentaSel === c.codigo ? null : c.codigo)}
                        className={`cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 ${
                          cuentaSel === c.codigo ? 'bg-crc-50' : ''
                        }`}
                      >
                        <td className="px-5 py-2.5">
                          <span className="font-mono text-xs text-slate-500">{c.codigo}</span>
                          <span className="ml-2 text-slate-700">{c.descripcion}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {c.presupuesto > 0 ? formatoMoneda(c.presupuesto) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {formatoMoneda(c.ejecutado)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">
                          {c.presupuesto > 0 ? formatoPorcentaje(c.porcentaje, 0) : '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${meta.chip}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Tarjeta>

            <Tarjeta className="xl:col-span-2">
              <TarjetaTitulo>Principales terceros</TarjetaTitulo>
              {detalle.topTerceros.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400">Sin movimientos en el período.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {detalle.topTerceros.map((t) => (
                    <li key={t.nit || t.tercero} className="flex items-center justify-between px-5 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{t.tercero || 'Sin nombre'}</p>
                        <p className="text-xs text-slate-400">
                          {t.nit || 's/n'} · {t.numMovimientos} mov.
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 text-sm font-medium text-slate-700">
                        {formatoMoneda(t.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          </div>

          <Tarjeta>
            <TarjetaTitulo>
              Movimientos {cuentaSel ? `· cuenta ${cuentaSel}` : '· todas las cuentas'} (
              {movimientos.length})
            </TarjetaTitulo>
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5 font-medium">Fecha</th>
                    <th className="px-3 py-2.5 font-medium">Comprobante</th>
                    <th className="px-3 py-2.5 font-medium">Tercero</th>
                    <th className="px-3 py-2.5 font-medium">Detalle</th>
                    <th className="px-3 py-2.5 font-medium">C. Costo</th>
                    <th className="px-5 py-2.5 text-right font-medium">Ejecutado</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                        Sin movimientos en el período.
                      </td>
                    </tr>
                  ) : (
                    movimientos.slice(0, MAX_FILAS_MOVIMIENTOS).map((m) => (
                      <tr key={m.id} className="border-b border-slate-50 last:border-0">
                        <td className="whitespace-nowrap px-5 py-2 text-slate-500">
                          {formatoFechaISO(m.fecha)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-500">
                          {m.comprobante}
                        </td>
                        <td className="max-w-48 truncate px-3 py-2 text-slate-700">{m.tercero}</td>
                        <td className="max-w-64 truncate px-3 py-2 text-slate-500">{m.detalle}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                          {m.centroCosto}
                        </td>
                        <td className="whitespace-nowrap px-5 py-2 text-right text-slate-700">
                          {formatoMoneda(m.ejecutado)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {movimientos.length > MAX_FILAS_MOVIMIENTOS && (
              <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-400">
                Mostrando los primeros {MAX_FILAS_MOVIMIENTOS} de {movimientos.length} movimientos.
                Seleccione una cuenta o acote el período para ver menos registros.
              </p>
            )}
          </Tarjeta>
        </div>
      )}
    </div>
  )
}
