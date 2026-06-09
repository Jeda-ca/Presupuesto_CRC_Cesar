import type { Area } from '@shared/domain/types'
import type { CrearAreaInput, ActualizarAreaInput } from '@shared/schemas/dto'
import { areaRepo } from '../repositories/areaRepo'
import { nuevoId } from '../lib/id'

export const areaService = {
  listar(): Area[] {
    return areaRepo.listar()
  },

  crear(input: CrearAreaInput): Area {
    if (areaRepo.existeNombre(input.nombre)) {
      throw new Error(`Ya existe un área con el nombre "${input.nombre}"`)
    }
    const ahora = new Date().toISOString()
    const area: Area = {
      id: nuevoId(),
      nombre: input.nombre.trim(),
      descripcion: input.descripcion.trim(),
      color: input.color,
      naturaleza: input.naturaleza,
      createdAt: ahora,
      updatedAt: ahora
    }
    return areaRepo.insertar(area)
  },

  actualizar(input: ActualizarAreaInput): Area {
    const actual = areaRepo.buscarPorId(input.id)
    if (!actual) throw new Error('Área no encontrada')
    if (areaRepo.existeNombre(input.nombre, input.id)) {
      throw new Error(`Ya existe un área con el nombre "${input.nombre}"`)
    }
    const area: Area = {
      ...actual,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion.trim(),
      color: input.color,
      naturaleza: input.naturaleza,
      updatedAt: new Date().toISOString()
    }
    return areaRepo.actualizar(area)
  },

  eliminar(id: string): void {
    const actual = areaRepo.buscarPorId(id)
    if (!actual) throw new Error('Área no encontrada')
    areaRepo.eliminar(id)
  }
}
