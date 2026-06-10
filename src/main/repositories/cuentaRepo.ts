import type { CuentaContable } from '@shared/domain/types'
import { store } from '../infra/store'

export const cuentaRepo = {
  listar(sedeId: string): CuentaContable[] {
    return store
      .getData()
      .cuentas.filter((c) => c.sedeId === sedeId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
  },

  buscarPorCodigo(sedeId: string, codigo: string): CuentaContable | undefined {
    return store.getData().cuentas.find((c) => c.sedeId === sedeId && c.codigo === codigo)
  },

  listarPorArea(areaId: string): CuentaContable[] {
    return store.getData().cuentas.filter((c) => c.areaId === areaId)
  },

  upsert(cuenta: CuentaContable): CuentaContable {
    return store.mutate((data) => {
      const i = data.cuentas.findIndex(
        (c) => c.sedeId === cuenta.sedeId && c.codigo === cuenta.codigo
      )
      if (i === -1) {
        data.cuentas.push(cuenta)
        return cuenta
      }
      data.cuentas[i] = { ...data.cuentas[i], ...cuenta }
      return data.cuentas[i]
    })
  },

  asignarArea(sedeId: string, codigo: string, areaId: string | null): CuentaContable {
    return store.mutate((data) => {
      const cuenta = data.cuentas.find((c) => c.sedeId === sedeId && c.codigo === codigo)
      if (!cuenta) throw new Error('Cuenta no encontrada')
      cuenta.areaId = areaId
      return cuenta
    })
  }
}
