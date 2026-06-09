import { useEffect, useState, type JSX } from 'react'
import type { Area, Naturaleza } from '@shared/domain/types'
import { Modal } from './ui/Modal'
import { Boton } from './ui/Boton'
import { Campo, Entrada, Selector } from './ui/Campo'
import { api, unwrap } from '../api/client'
import { useAppStore } from '../store/appStore'

const PALETA = ['#d7261e', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777']

interface Props {
  abierto: boolean
  area: Area | null
  onCerrar: () => void
  onGuardado: () => void
}

export function AreaFormModal({ abierto, area, onCerrar, onGuardado }: Props): JSX.Element {
  const notificar = useAppStore((s) => s.notificar)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [naturaleza, setNaturaleza] = useState<Naturaleza>('gasto')
  const [color, setColor] = useState(PALETA[0])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setNombre(area?.nombre ?? '')
    setDescripcion(area?.descripcion ?? '')
    setNaturaleza(area?.naturaleza ?? 'gasto')
    setColor(area?.color ?? PALETA[0])
  }, [abierto, area])

  async function guardar(): Promise<void> {
    if (!nombre.trim()) {
      notificar('error', 'El nombre del área es obligatorio')
      return
    }
    setGuardando(true)
    try {
      if (area) {
        await unwrap(api.areas.actualizar({ id: area.id, nombre, descripcion, naturaleza, color }))
        notificar('exito', 'Área actualizada')
      } else {
        await unwrap(api.areas.crear({ nombre, descripcion, naturaleza, color }))
        notificar('exito', 'Área creada')
      }
      onGuardado()
      onCerrar()
    } catch (e) {
      notificar('error', (e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={area ? 'Editar área' : 'Nueva área'} abierto={abierto} onCerrar={onCerrar}>
      <div className="space-y-4">
        <Campo etiqueta="Nombre">
          <Entrada
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Vacunación, Nómina, Infraestructura"
            autoFocus
          />
        </Campo>
        <Campo etiqueta="Descripción">
          <Entrada
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Opcional"
          />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Naturaleza" ayuda="Determina cómo se calcula la ejecución.">
            <Selector
              value={naturaleza}
              onChange={(e) => setNaturaleza(e.target.value as Naturaleza)}
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="costo">Costo</option>
            </Selector>
          </Campo>
          <Campo etiqueta="Color">
            <div className="flex flex-wrap items-center gap-1.5">
              {PALETA.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-slate-800' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Campo>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
