import { useEffect, useState, type JSX } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts'
import type { DashboardResumen } from '@shared/ipc/contract'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta, TarjetaTitulo } from '../components/ui/Tarjeta'
import { KpiCard } from '../components/KpiCard'
import { PeriodoSelector, rangoAnio, type Periodo } from '../components/PeriodoSelector'
import { Icono } from '../components/ui/Icono'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'
import { formatoMoneda, formatoCompacto, formatoPorcentaje, nombreMes } from '../lib/formato'
import {
  estadoMeta,
  sentidoDeAreas,
  kpiDisponible,
  acentoDisponibleFila,
  type SentidoPresupuesto
} from '../lib/estados'
import type { Naturaleza } from '@shared/domain/types'

type FiltroNaturaleza = 'todas' | Naturaleza

const FILTROS: { valor: FiltroNaturaleza; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'ingreso', etiqueta: 'Ingresos' },
  { valor: 'gasto', etiqueta: 'Gastos' },
  { valor: 'costo', etiqueta: 'Costos' }
]

export function DashboardPage(): JSX.Element {
  const anio = useAppStore((s) => s.config?.anioActivo ?? new Date().getFullYear())
  const notificar = useAppStore((s) => s.notificar)
  const irA = useAppStore((s) => s.irA)
  const [periodo, setPeriodo] = useState<Periodo>(rangoAnio(anio))
  const [naturaleza, setNaturaleza] = useState<FiltroNaturaleza>('todas')
  const [data, setData] = useState<DashboardResumen | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => setPeriodo(rangoAnio(anio)), [anio])

  useEffect(() => {
    let activo = true
    setCargando(true)
    unwrap(
      api.dashboard.resumen({
        ...periodo,
        naturaleza: naturaleza === 'todas' ? null : naturaleza
      })
    )
      .then((r) => activo && setData(r))
      .catch((e: Error) => notificar('error', e.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, naturaleza])

  const barData =
    data?.areas
      .filter((a) => a.presupuesto > 0 || a.ejecutado > 0)
      .map((a) => ({
        nombre: a.nombre,
        Presupuesto: Math.round(a.presupuesto),
        Ejecutado: Math.round(a.ejecutado)
      })) ?? []

  const lineData =
    data?.serieMensual.map((s) => ({
      mes: nombreMes(s.mes).slice(0, 3),
      Presupuesto: Math.round(s.presupuesto),
      Ejecutado: Math.round(s.ejecutado)
    })) ?? []

  const sentido: SentidoPresupuesto =
    naturaleza !== 'todas'
      ? naturaleza === 'ingreso'
        ? 'ingreso'
        : 'egreso'
      : sentidoDeAreas(data?.areas ?? [])
  const kpiDisp = kpiDisponible(sentido, data?.totalDisponible ?? 0)

  return (
    <div>
      <EncabezadoPagina
        titulo="Dashboard"
        descripcion="Comparación entre lo presupuestado y lo ejecutado en el período seleccionado."
        acciones={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setNaturaleza(f.valor)}
                  className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${
                    naturaleza === f.valor
                      ? 'bg-crc-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.etiqueta}
                </button>
              ))}
            </div>
            <PeriodoSelector periodo={periodo} anio={anio} onCambio={setPeriodo} />
          </div>
        }
      />

      {!data || (!data.hayDatos && data.areas.length === 0) ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-400">
          {cargando ? (
            'Calculando...'
          ) : (
            <>
              <p>No hay datos para mostrar.</p>
              <p className="mt-1">Importe un archivo de Siimed y configure sus áreas y presupuestos.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              titulo={sentido === 'ingreso' ? 'Meta de ingresos' : 'Presupuestado'}
              valor={formatoMoneda(data.totalPresupuesto)}
            />
            <KpiCard
              titulo={sentido === 'ingreso' ? 'Recaudado' : 'Ejecutado'}
              valor={formatoMoneda(data.totalEjecutado)}
              detalle={`${data.numMovimientos} movimientos`}
            />
            <KpiCard
              titulo={sentido === 'ingreso' ? '% De la meta' : '% Ejecución'}
              valor={formatoPorcentaje(data.porcentaje)}
              acento={
                data.totalPresupuesto > 0 && data.totalEjecutado > data.totalPresupuesto
                  ? sentido === 'ingreso'
                    ? 'text-emerald-600'
                    : sentido === 'egreso'
                      ? 'text-red-600'
                      : 'text-slate-800'
                  : 'text-slate-800'
              }
            />
            <KpiCard
              titulo={kpiDisp.titulo}
              valor={formatoMoneda(kpiDisp.valor)}
              detalle={kpiDisp.detalle}
              acento={kpiDisp.acento}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                'excedido',
                'en_riesgo',
                'meta_superada',
                'bajo_uso',
                'sin_presupuesto',
                'normal'
              ] as const
            )
              .filter((estado) => data.conteoEstados[estado] > 0)
              .map((estado) => {
                const meta = estadoMeta(estado, naturaleza === 'todas' ? null : naturaleza)
                return (
                  <span
                    key={estado}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${meta.chip}`}
                  >
                    {meta.label}: {data.conteoEstados[estado]}
                  </span>
                )
              })}
            {(data.ejecutadoSinArea !== 0 || data.cuentasSinAsignar > 0) && (
              <button
                onClick={() => irA('areas')}
                title="Asignar cuentas a un área"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 hover:border-crc-300 hover:bg-crc-50 hover:text-crc-700"
              >
                Sin área: {formatoMoneda(data.ejecutadoSinArea)}
                {data.cuentasSinAsignar > 0 && ` · ${data.cuentasSinAsignar} cuentas`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Tarjeta>
              <TarjetaTitulo>Presupuesto vs ejecutado por área</TarjetaTitulo>
              <div className="h-80 p-4">
                {barData.length === 0 ? (
                  <Vacio />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="nombre"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={formatoCompacto} width={64} />
                      <Tooltip formatter={(v: number) => formatoMoneda(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Presupuesto" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Ejecutado" fill="#d7261e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Tarjeta>

            <Tarjeta>
              <TarjetaTitulo>Evolución mensual</TarjetaTitulo>
              <div className="h-80 p-4">
                {lineData.length === 0 ? (
                  <Vacio />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={formatoCompacto} width={64} />
                      <Tooltip formatter={(v: number) => formatoMoneda(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="Presupuesto"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Ejecutado"
                        stroke="#d7261e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Tarjeta>
          </div>

          <Tarjeta>
            <TarjetaTitulo>Ejecución por área</TarjetaTitulo>
            {data.areas.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">
                Aún no ha creado áreas. Vaya a "Áreas y presupuestos".
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-2.5 font-medium">Área</th>
                    <th className="px-5 py-2.5 text-right font-medium">Presupuesto</th>
                    <th className="px-5 py-2.5 text-right font-medium">Ejecutado</th>
                    <th className="px-5 py-2.5 text-right font-medium">Disponible</th>
                    <th className="w-48 px-5 py-2.5 font-medium">Avance</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.areas.map((a) => {
                    const meta = estadoMeta(a.estado, a.naturaleza)
                    return (
                      <tr
                        key={a.areaId}
                        className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                        onClick={() => irA('detalle', a.areaId)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: a.color }}
                            />
                            <span className="font-medium text-slate-700">{a.nombre}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${meta.chip}`}>
                              {meta.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {formatoMoneda(a.presupuesto)}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {formatoMoneda(a.ejecutado)}
                        </td>
                        <td
                          className={`px-5 py-3 text-right ${acentoDisponibleFila(a.naturaleza, a.disponible)}`}
                        >
                          {formatoMoneda(a.disponible)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${meta.barra}`}
                                style={{ width: `${Math.min(100, a.porcentaje * 100)}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs text-slate-500">
                              {formatoPorcentaje(a.porcentaje, 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          <Icono nombre="chevron" className="h-4 w-4" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Tarjeta>
        </div>
      )}
    </div>
  )
}

function Vacio(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-300">
      Sin datos en el período
    </div>
  )
}
