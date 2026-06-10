import { useState, type JSX } from 'react'
import { EncabezadoPagina } from '../components/EncabezadoPagina'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Campo, Entrada } from '../components/ui/Campo'
import { Boton } from '../components/ui/Boton'
import { useAppStore } from '../store/appStore'
import { api, unwrap } from '../api/client'

export function ConfiguracionPage(): JSX.Element {
  const config = useAppStore((s) => s.config)
  const setConfig = useAppStore((s) => s.setConfig)
  const notificar = useAppStore((s) => s.notificar)

  const [riesgo, setRiesgo] = useState(Math.round((config?.umbralRiesgo ?? 0.85) * 100))
  const [bajoUso, setBajoUso] = useState(Math.round((config?.umbralBajoUso ?? 0.3) * 100))
  const [anio, setAnio] = useState(config?.anioActivo ?? new Date().getFullYear())
  const [guardando, setGuardando] = useState(false)

  async function guardar(): Promise<void> {
    setGuardando(true)
    try {
      const actualizada = await unwrap(
        api.config.actualizar({
          umbralRiesgo: riesgo / 100,
          umbralBajoUso: bajoUso / 100,
          anioActivo: anio,
          sedeActiva: config?.sedeActiva ?? null
        })
      )
      setConfig(actualizada)
      notificar('exito', 'Configuración guardada')
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Configuración"
        descripcion="Parámetros generales de cálculo y alertas."
      />
      <Tarjeta className="max-w-xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Año activo">
            <Entrada
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            />
          </Campo>
          <div />
          <Campo etiqueta="Umbral de riesgo (%)" ayuda="A partir de este % de ejecución se marca en riesgo.">
            <Entrada
              type="number"
              min={1}
              max={100}
              value={riesgo}
              onChange={(e) => setRiesgo(Number(e.target.value))}
            />
          </Campo>
          <Campo
            etiqueta="Umbral de bajo uso (%)"
            ayuda="Por debajo de este % se marca como subejecución."
          >
            <Entrada
              type="number"
              min={0}
              max={99}
              value={bajoUso}
              onChange={(e) => setBajoUso(Number(e.target.value))}
            />
          </Campo>
        </div>
        <div className="mt-5 flex justify-end">
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Boton>
        </div>
      </Tarjeta>
    </div>
  )
}
