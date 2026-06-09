import type { CuentaContable } from '@shared/domain/types'
import { store } from '../infra/store'

export const cuentaRepo = {
  listar(): CuentaContable[] {
    return [...store.getData().cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo))
  },

  buscarPorCodigo(codigo: string): CuentaContable | undefined {
    return store.getData().cuentas.find((c) => c.codigo === codigo)
  },

  listarPorArea(areaId: string): CuentaContable[] {
    return store.getData().cuentas.filter((c) => c.areaId === areaId)
  },

  upsert(cuenta: CuentaContable): CuentaContable {
    return store.mutate((data) => {
      const i = data.cuentas.findIndex((c) => c.codigo === cuenta.codigo)
      if (i === -1) data.cuentas.push(cuenta)
      else data.cuentas[i] = { ...data.cuentas[i], ...cuenta }
      return data.cuentas[i === -1 ? data.cuentas.length - 1 : i]
    })
  },

  asignarArea(codigo: string, areaId: string | null): CuentaContable {
    return store.mutate((data) => {
      const cuenta = data.cuentas.find((c) => c.codigo === codigo)
      if (!cuenta) throw new Error('Cuenta no encontrada')
      cuenta.areaId = areaId
      return cuenta
    })
  }
}
