import { useEffect, useState, type JSX, type ReactNode } from 'react'
import type { PreviewImportacion } from '@shared/ipc/contract'
import type { Importacion } from '@shared/domain/types'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta, TarjetaTitulo } from '../components/ui/Tarjeta'
import { Boton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'
import { formatoMoneda, formatoFechaISO } from '../lib/formato'

const ETIQUETA_NATURALEZA = { ingreso: 'Ingreso', gasto: 'Gasto', costo: 'Costo' } as const

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }): JSX.Element {
  return (
    <div>
      <p className="text-xs text-slate-400">{etiqueta}</p>
      <p className="text-sm font-medium text-slate-700">{valor}</p>
    </div>
  )
}

export function ImportarPage(): JSX.Element {
  const notificar = useAppStore((s) => s.notificar)
  const refrescarWorkspace = useAppStore((s) => s.refrescarWorkspace)
  const [preview, setPreview] = useState<PreviewImportacion | null>(null)
  const [historial, setHistorial] = useState<Importacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  async function cargarHistorial(): Promise<void> {
    try {
      setHistorial(await unwrap(api.importacion.listar()))
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  useEffect(() => {
    void cargarHistorial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function seleccionar(): Promise<void> {
    setCargando(true)
    try {
      const resultado = await unwrap(api.importacion.previsualizar())
      if (resultado) setPreview(resultado)
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  async function confirmar(): Promise<void> {
    if (!preview) return
    setConfirmando(true)
    try {
      const r = await unwrap(api.importacion.confirmar(preview.token))
      notificar(
        'exito',
        `Importación completa: ${r.insertados} nuevos, ${r.actualizados} actualizados, ${r.cuentasCreadas} cuentas creadas.`
      )
      setPreview(null)
      await cargarHistorial()
      await refrescarWorkspace()
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setConfirmando(false)
    }
  }

  async function cancelar(): Promise<void> {
    if (preview) await api.importacion.descartar(preview.token)
    setPreview(null)
  }

  async function eliminar(imp: Importacion): Promise<void> {
    try {
      const r = await unwrap(api.importacion.eliminar(imp.id))
      notificar('info', `Importación eliminada (${r.movimientosEliminados} movimientos).`)
      await cargarHistorial()
      await refrescarWorkspace()
    } catch (e) {
      notificar('error', (e as Error).message)
    }
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Importar"
        descripcion="Cargue el archivo Libro Auxiliar exportado desde Siimed (Excel o CSV)."
        acciones={
          <Boton onClick={seleccionar} disabled={cargando}>
            <Icono nombre="importar" className="h-4 w-4" />
            {cargando ? 'Leyendo...' : 'Seleccionar archivo'}
          </Boton>
        }
      />

      {preview && (
        <Tarjeta className="mb-6">
          <TarjetaTitulo
            accion={
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  preview.checksumCuadra
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {preview.checksumCuadra ? 'Checksum verificado' : 'Checksum con diferencias'}
              </span>
            }
          >
            Vista previa: {preview.archivo}
          </TarjetaTitulo>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Dato
                etiqueta="Período"
                valor={
                  preview.periodoInicio && preview.periodoFin
                    ? `${formatoFechaISO(preview.periodoInicio)} a ${formatoFechaISO(preview.periodoFin)}`
                    : 'No detectado'
                }
              />
              <Dato etiqueta="Movimientos" valor={String(preview.totalMovimientos)} />
              <Dato etiqueta="Nuevos" valor={String(preview.nuevos)} />
              <Dato etiqueta="Duplicados (omitidos)" valor={String(preview.duplicados)} />
              <Dato etiqueta="Débitos archivo" valor={formatoMoneda(preview.debitosParse)} />
              <Dato etiqueta="Créditos archivo" valor={formatoMoneda(preview.creditosParse)} />
              <Dato
                etiqueta="Débitos reportados"
                valor={preview.debitosReporte !== null ? formatoMoneda(preview.debitosReporte) : '—'}
              />
              <Dato
                etiqueta="Créditos reportados"
                valor={
                  preview.creditosReporte !== null ? formatoMoneda(preview.creditosReporte) : '—'
                }
              />
            </div>

            {preview.archivoYaImportado && (
              <Aviso tipo="info">
                Este archivo ya fue importado antes. Confirmar volverá a sincronizar los movimientos
                (sin duplicarlos).
              </Aviso>
            )}

            {!preview.checksumCuadra && (
              <Aviso tipo="alerta">
                Los totales calculados no coinciden con los totales del reporte. Revise el archivo
                antes de confirmar.
              </Aviso>
            )}

            {preview.errores.length > 0 && (
              <Aviso tipo="alerta">
                {preview.errores.length} fila(s) no se pudieron interpretar y serán omitidas.
              </Aviso>
            )}

            {preview.cuentasNuevas.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cuentas nuevas detectadas ({preview.cuentasNuevas.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {preview.cuentasNuevas.map((c) => (
                    <span
                      key={c.codigo}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                    >
                      <span className="font-mono font-semibold">{c.codigo}</span> {c.descripcion} ·{' '}
                      {ETIQUETA_NATURALEZA[c.naturaleza]}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Se crearán automáticamente y podrá asignarlas a un área en la pestaña de áreas.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Boton variante="secundario" onClick={cancelar} disabled={confirmando}>
                Cancelar
              </Boton>
              <Boton onClick={confirmar} disabled={confirmando}>
                {confirmando ? 'Importando...' : 'Confirmar importación'}
              </Boton>
            </div>
          </div>
        </Tarjeta>
      )}

      <Tarjeta>
        <TarjetaTitulo>Historial de importaciones</TarjetaTitulo>
        {historial.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Aún no hay importaciones. Seleccione un archivo de Siimed para comenzar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-medium">Archivo</th>
                <th className="px-5 py-2.5 font-medium">Período</th>
                <th className="px-5 py-2.5 font-medium">Cargado</th>
                <th className="px-5 py-2.5 text-right font-medium">Registros</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {historial.map((imp) => (
                <tr key={imp.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-700">{imp.archivo}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {imp.periodoInicio && imp.periodoFin
                      ? `${formatoFechaISO(imp.periodoInicio)} - ${formatoFechaISO(imp.periodoFin)}`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(imp.fechaCarga).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">{imp.totalRegistros}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => eliminar(imp)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar importación"
                    >
                      <Icono nombre="eliminar" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </div>
  )
}

function Aviso({
  tipo,
  children
}: {
  tipo: 'info' | 'alerta'
  children: ReactNode
}): JSX.Element {
  const estilo =
    tipo === 'alerta'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-sky-200 bg-sky-50 text-sky-800'
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${estilo}`}>
      <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
