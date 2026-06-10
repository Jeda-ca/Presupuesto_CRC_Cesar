import type { Presupuesto } from '@shared/domain/types'
import type { GuardarPresupuestoInput } from '@shared/schemas/dto'
import { presupuestoRepo } from '../repositories/presupuestoRepo'
import { areaRepo } from '../repositories/areaRepo'
import { cuentaRepo } from '../repositories/cuentaRepo'
import { nuevoId } from '../lib/id'

export const presupuestoService = {
  listarPorAnio(sedeId: string, anio: number): Presupuesto[] {
    return presupuestoRepo.listarPorAnio(sedeId, anio)
  },

  guardar(input: GuardarPresupuestoInput): Presupuesto {
    if (input.ambito === 'area') {
      const area = areaRepo.buscarPorId(input.referenciaId)
      if (!area) throw new Error('Área no encontrada')
      if (area.sedeId !== input.sedeId) throw new Error('El área pertenece a otra sede')
    }
    if (input.ambito === 'cuenta' && !cuentaRepo.buscarPorCodigo(input.sedeId, input.referenciaId)) {
      throw new Error('Cuenta no encontrada')
    }

    const existente = presupuestoRepo.buscar(
      input.sedeId,
      input.ambito,
      input.referenciaId,
      input.anio
    )
    const ahora = new Date().toISOString()

    if (existente) {
      return presupuestoRepo.actualizar({
        ...existente,
        montoAnual: input.montoAnual,
        meses: input.meses,
        updatedAt: ahora
      })
    }

    return presupuestoRepo.insertar({
      id: nuevoId(),
      sedeId: input.sedeId,
      ambito: input.ambito,
      referenciaId: input.referenciaId,
      anio: input.anio,
      montoAnual: input.montoAnual,
      meses: input.meses,
      createdAt: ahora,
      updatedAt: ahora
    })
  },

  eliminar(id: string): void {
    presupuestoRepo.eliminar(id)
  }
}
