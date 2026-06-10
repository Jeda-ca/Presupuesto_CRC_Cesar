import { useEffect, useMemo, useState, type JSX } from 'react'
import type { Area, CuentaContable, Presupuesto, Naturaleza } from '@shared/domain/types'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta, TarjetaTitulo } from '../components/ui/Tarjeta'
import { Boton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { Modal } from '../components/ui/Modal'
import { Selector } from '../components/ui/Campo'
import { AreaFormModal } from '../components/AreaFormModal'
import { PresupuestoEditor } from '../components/PresupuestoEditor'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'
import { formatoMoneda } from '../lib/formato'

const ETIQUETA: Record<Naturaleza, string> = { ingreso: 'Ingreso', gasto: 'Gasto', costo: 'Costo' }
const SIN_AREA = '__sin__'

function Badge({ naturaleza }: { naturaleza: Naturaleza }): JSX.Element {
  const estilo: Record<Naturaleza, string> = {
    ingreso: 'bg-emerald-100 text-emerald-700',
    gasto: 'bg-rose-100 text-rose-700',
    costo: 'bg-amber-100 text-amber-700'
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo[naturaleza]}`}>
      {ETIQUETA[naturaleza]}
    </span>
  )
}

export function AreasPage(): JSX.Element {
  const notificar = useAppStore((s) => s.notificar)
  const refrescarWorkspace = useAppStore((s) => s.refrescarWorkspace)
  const anio = useAppStore((s) => s.config?.anioActivo ?? new Date().getFullYear())
  const sedeActiva = useAppStore((s) => s.sedeActiva)!

  const [areas, setAreas] = useState<Area[]>([])
  const [cuentas, setCuentas] = useState<CuentaContable[]>([])
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [modalArea, setModalArea] = useState<{ abierto: boolean; area: Area | null }>({
    abierto: false,
    area: null
  })
  const [cuentaPresupuesto, setCuentaPresupuesto] = useState<CuentaContable | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function cargarTodo(): Promise<void> {
    try {
      const [a, c, p] = await Promise.all([
        unwrap(api.areas.listar(sedeActiva)),
        unwrap(api.cuentas.listar(sedeActiva)),
        unwrap(api.presupuestos.listarPorAnio({ sedeId: sedeActiva, anio }))
      ])
      setAreas(a)
      setCuentas(c)
      setPresupuestos(p)
      setSeleccion((s) => s ?? (a.length > 0 ? a[0].id : SIN_AREA))
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  useEffect(() => {
    void cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio])

  const cuentasSinArea = useMemo(() => cuentas.filter((c) => c.areaId === null), [cuentas])
  const areaSel = areas.find((a) => a.id === seleccion) ?? null
  const cuentasArea = useMemo(
    () => (areaSel ? cuentas.filter((c) => c.areaId === areaSel.id) : []),
    [cuentas, areaSel]
  )

  function presupuestoDe(ambito: 'area' | 'cuenta', refId: string): Presupuesto | null {
    return presupuestos.find((p) => p.ambito === ambito && p.referenciaId === refId) ?? null
  }
  function anualArea(areaId: string): number {
    return presupuestoDe('area', areaId)?.montoAnual ?? 0
  }

  async function asignar(codigo: string, areaId: string | null): Promise<void> {
    try {
      await unwrap(api.cuentas.asignarArea({ sedeId: sedeActiva, codigo, areaId }))
      await cargarTodo()
      await refrescarWorkspace()
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  async function eliminarArea(area: Area): Promise<void> {
    try {
      await unwrap(api.areas.eliminar(area.id))
      notificar('info', `Área "${area.nombre}" eliminada`)
      setSeleccion(null)
      await cargarTodo()
      await refrescarWorkspace()
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  async function guardarPresupuesto(
    ambito: 'area' | 'cuenta',
    refId: string,
    montoAnual: number,
    meses: number[]
  ): Promise<void> {
    setGuardando(true)
    try {
      await unwrap(
        api.presupuestos.guardar({
          sedeId: sedeActiva,
          ambito,
          referenciaId: refId,
          anio,
          montoAnual,
          meses
        })
      )
      notificar('exito', 'Presupuesto guardado')
      await cargarTodo()
      await refrescarWorkspace()
      setCuentaPresupuesto(null)
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarPresupuesto(p: Presupuesto): Promise<void> {
    setGuardando(true)
    try {
      await unwrap(api.presupuestos.eliminar(p.id))
      await cargarTodo()
      await refrescarWorkspace()
      setCuentaPresupuesto(null)
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Áreas y presupuestos"
        descripcion={`Agrupe cuentas en áreas y defina el presupuesto anual y mensual del año ${anio}.`}
        acciones={
          <Boton onClick={() => setModalArea({ abierto: true, area: null })}>
            <Icono nombre="mas" className="h-4 w-4" /> Nueva área
          </Boton>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 space-y-2">
          {areas.map((a) => (
            <button
              key={a.id}
              onClick={() => setSeleccion(a.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                seleccion === a.id
                  ? 'border-crc-500 bg-crc-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">{a.nombre}</span>
                <span className="text-xs text-slate-400">
                  {cuentas.filter((c) => c.areaId === a.id).length} cuentas ·{' '}
                  {formatoMoneda(anualArea(a.id))}
                </span>
              </span>
              <Badge naturaleza={a.naturaleza} />
            </button>
          ))}

          <button
            onClick={() => setSeleccion(SIN_AREA)}
            className={`flex w-full items-center justify-between rounded-lg border border-dashed p-3 text-left text-sm transition-colors ${
              seleccion === SIN_AREA
                ? 'border-slate-400 bg-slate-100'
                : 'border-slate-300 bg-white hover:bg-slate-50'
            }`}
          >
            <span className="text-slate-600">Cuentas sin asignar</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
              {cuentasSinArea.length}
            </span>
          </button>
        </div>

        <div className="col-span-8">
          {areaSel ? (
            <div className="space-y-5">
              <Tarjeta>
                <TarjetaTitulo
                  accion={
                    <div className="flex gap-1">
                      <button
                        onClick={() => setModalArea({ abierto: true, area: areaSel })}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Editar área"
                      >
                        <Icono nombre="editar" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarArea(areaSel)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar área"
                      >
                        <Icono nombre="eliminar" className="h-4 w-4" />
                      </button>
                    </div>
                  }
                >
                  Presupuesto del área · {areaSel.nombre}
                </TarjetaTitulo>
                <div className="p-5">
                  <PresupuestoEditor
                    presupuesto={presupuestoDe('area', areaSel.id)}
                    anio={anio}
                    guardando={guardando}
                    onGuardar={(monto, meses) => guardarPresupuesto('area', areaSel.id, monto, meses)}
                    onEliminar={() => {
                      const p = presupuestoDe('area', areaSel.id)
                      if (p) void eliminarPresupuesto(p)
                    }}
                  />
                </div>
              </Tarjeta>

              <Tarjeta>
                <TarjetaTitulo>Cuentas del área ({cuentasArea.length})</TarjetaTitulo>
                {cuentasArea.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">
                    Esta área no tiene cuentas. Agréguelas desde la lista de abajo.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {cuentasArea.map((c) => {
                        const pc = presupuestoDe('cuenta', c.codigo)
                        return (
                          <tr key={c.codigo} className="border-b border-slate-50 last:border-0">
                            <td className="px-5 py-3">
                              <span className="font-mono text-xs text-slate-500">{c.codigo}</span>
                              <span className="ml-2 text-slate-700">{c.descripcion}</span>
                            </td>
                            <td className="px-3 py-3 text-right text-slate-500">
                              {pc ? formatoMoneda(pc.montoAnual) : 'sin presupuesto'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Boton
                                  variante="secundario"
                                  tam="sm"
                                  onClick={() => setCuentaPresupuesto(c)}
                                >
                                  Presupuesto
                                </Boton>
                                <button
                                  onClick={() => asignar(c.codigo, null)}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  title="Quitar del área"
                                >
                                  <Icono nombre="cerrar" className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </Tarjeta>

              {cuentasSinArea.length > 0 && (
                <Tarjeta>
                  <TarjetaTitulo>Agregar cuentas a esta área</TarjetaTitulo>
                  <div className="flex flex-wrap gap-2 p-5">
                    {cuentasSinArea.map((c) => (
                      <button
                        key={c.codigo}
                        onClick={() => asignar(c.codigo, areaSel.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 hover:border-crc-300 hover:bg-crc-50"
                      >
                        <Icono nombre="mas" className="h-3.5 w-3.5" />
                        <span className="font-mono font-semibold">{c.codigo}</span>
                        <span className="max-w-40 truncate">{c.descripcion}</span>
                      </button>
                    ))}
                  </div>
                </Tarjeta>
              )}
            </div>
          ) : (
            <CuentasSinAreaPanel
              cuentas={cuentasSinArea}
              areas={areas}
              onAsignar={asignar}
            />
          )}
        </div>
      </div>

      <AreaFormModal
        abierto={modalArea.abierto}
        area={modalArea.area}
        sedeId={sedeActiva}
        onCerrar={() => setModalArea({ abierto: false, area: null })}
        onGuardado={cargarTodo}
      />

      {cuentaPresupuesto && (
        <Modal
          titulo={`Presupuesto · ${cuentaPresupuesto.codigo} ${cuentaPresupuesto.descripcion}`}
          abierto={true}
          onCerrar={() => setCuentaPresupuesto(null)}
          ancho="max-w-2xl"
        >
          <PresupuestoEditor
            presupuesto={presupuestoDe('cuenta', cuentaPresupuesto.codigo)}
            anio={anio}
            guardando={guardando}
            onGuardar={(monto, meses) =>
              guardarPresupuesto('cuenta', cuentaPresupuesto.codigo, monto, meses)
            }
            onEliminar={() => {
              const p = presupuestoDe('cuenta', cuentaPresupuesto.codigo)
              if (p) void eliminarPresupuesto(p)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function CuentasSinAreaPanel({
  cuentas,
  areas,
  onAsignar
}: {
  cuentas: CuentaContable[]
  areas: Area[]
  onAsignar: (codigo: string, areaId: string | null) => void
}): JSX.Element {
  return (
    <Tarjeta>
      <TarjetaTitulo>Cuentas sin asignar ({cuentas.length})</TarjetaTitulo>
      {cuentas.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">
          Todas las cuentas están asignadas a un área.
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.codigo} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-slate-500">{c.codigo}</span>
                  <span className="ml-2 text-slate-700">{c.descripcion}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Selector
                    className="h-9 w-56"
                    defaultValue=""
                    onChange={(e) => e.target.value && onAsignar(c.codigo, e.target.value)}
                  >
                    <option value="" disabled>
                      Asignar a área...
                    </option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </Selector>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Tarjeta>
  )
}
