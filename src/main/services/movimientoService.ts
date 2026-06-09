import type { MovimientoVista } from '@shared/ipc/contract'
import type { MovimientosQuery } from '@shared/schemas/dto'
import { ejecutadoMovimiento, naturalezaDeCuenta } from '@shared/domain/puc'
import { movimientoRepo } from '../repositories/movimientoRepo'
import { cuentaRepo } from '../repositories/cuentaRepo'

export const movimientoService = {
  listar(query: MovimientosQuery): MovimientoVista[] {
    const { desde, hasta, cuenta, areaId } = query
    let movimientos = movimientoRepo.listarEntre(desde, hasta)

    if (cuenta) {
      movimientos = movimientos.filter((m) => m.cuenta === cuenta)
    } else if (areaId) {
      const codigos = new Set(cuentaRepo.listarPorArea(areaId).map((c) => c.codigo))
      movimientos = movimientos.filter((m) => codigos.has(m.cuenta))
    }

    return movimientos
      .map((m) => {
        const cuentaContable = cuentaRepo.buscarPorCodigo(m.cuenta)
        const naturaleza = cuentaContable?.naturaleza ?? naturalezaDeCuenta(m.cuenta)
        return {
          id: m.id,
          cuenta: m.cuenta,
          cuentaDescripcion: cuentaContable?.descripcion ?? '',
          nit: m.nit,
          tercero: m.tercero,
          comprobante: m.comprobante,
          fecha: m.fecha,
          detalle: m.detalle,
          centroCosto: m.centroCosto,
          debito: m.debito,
          credito: m.credito,
          ejecutado: ejecutadoMovimiento(naturaleza, m.debito, m.credito)
        }
      })
      .sort((a, b) => (a.fecha === b.fecha ? a.comprobante.localeCompare(b.comprobante) : b.fecha.localeCompare(a.fecha)))
  }
}
