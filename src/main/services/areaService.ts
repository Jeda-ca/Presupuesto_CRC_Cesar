import type { Area } from '@shared/domain/types'
import type { CrearAreaInput, ActualizarAreaInput } from '@shared/schemas/dto'
import { areaRepo } from '../repositories/areaRepo'
import { sedeRepo } from '../repositories/sedeRepo'
import { nuevoId } from '../lib/id'

export const areaService = {
  listar(sedeId: string): Area[] {
    return areaRepo.listar(sedeId)
  },

  crear(input: CrearAreaInput): Area {
    if (!sedeRepo.buscar(input.sedeId)) {
      throw new Error('Sede no encontrada')
    }
    if (areaRepo.existeNombre(input.sedeId, input.nombre)) {
      throw new Error(`Ya existe un área con el nombre "${input.nombre}" en esta sede`)
    }
    const ahora = new Date().toISOString()
    const area: Area = {
      id: nuevoId(),
      sedeId: input.sedeId,
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
    if (areaRepo.existeNombre(actual.sedeId, input.nombre, input.id)) {
      throw new Error(`Ya existe un área con el nombre "${input.nombre}" en esta sede`)
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
