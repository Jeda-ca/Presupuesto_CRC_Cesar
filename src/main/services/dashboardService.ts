import type { CuentaContable, Presupuesto } from '@shared/domain/types'
import type {
  DashboardResumen,
  AreaEjecucion,
  EstadoEjecucion,
  SerieMes,
  AreaDetalle,
  CuentaEjecucion,
  TerceroEjecucion
} from '@shared/ipc/contract'
import type { ResumenQuery, DetalleAreaQuery } from '@shared/schemas/dto'
import { ejecutadoMovimiento, naturalezaDeCuenta } from '@shared/domain/puc'
import { configRepo } from '../repositories/configRepo'
import { areaRepo } from '../repositories/areaRepo'
import { cuentaRepo } from '../repositories/cuentaRepo'
import { presupuestoRepo } from '../repositories/presupuestoRepo'
import { movimientoRepo } from '../repositories/movimientoRepo'
import {
  presupuestoEnPeriodo,
  mesesEnPeriodo,
  indiceMes,
  calcularEstado
} from '../lib/calculoPresupuesto'

export const dashboardService = {
  resumen(query: ResumenQuery): DashboardResumen {
    const { desde, hasta, sedeId } = query
    const filtro = query.naturaleza ?? null
    const anio = Number.parseInt(desde.slice(0, 4), 10) || new Date().getFullYear()
    const cfg = configRepo.obtener()

    const cuentas = cuentaRepo.listar(sedeId)
    const naturalezaPorCuenta = new Map<string, CuentaContable['naturaleza']>()
    for (const c of cuentas) naturalezaPorCuenta.set(c.codigo, c.naturaleza)

    const movimientos = movimientoRepo.listarEntre(desde, hasta, sedeId)
    const ejecPorCuenta = new Map<string, number>()
    for (const mov of movimientos) {
      const naturaleza = naturalezaPorCuenta.get(mov.cuenta) ?? naturalezaDeCuenta(mov.cuenta)
      const valor = ejecutadoMovimiento(naturaleza, mov.debito, mov.credito)
      ejecPorCuenta.set(mov.cuenta, (ejecPorCuenta.get(mov.cuenta) ?? 0) + valor)
    }

    const presupuestos = presupuestoRepo.listarPorAnio(sedeId, anio)
    const presArea = new Map<string, Presupuesto>()
    const presCuenta = new Map<string, Presupuesto>()
    for (const p of presupuestos) {
      if (p.ambito === 'area') presArea.set(p.referenciaId, p)
      else presCuenta.set(p.referenciaId, p)
    }

    const conteoEstados: Record<EstadoEjecucion, number> = {
      normal: 0,
      en_riesgo: 0,
      excedido: 0,
      meta_superada: 0,
      bajo_uso: 0,
      sin_presupuesto: 0
    }

    const areasFiltradas = areaRepo
      .listar(sedeId)
      .filter((area) => !filtro || area.naturaleza === filtro)

    // Conjunto de cuentas que pertenecen a las áreas mostradas (para la serie mensual)
    const codigosEnAreas = new Set<string>()
    const presupuestoPorMes = new Array<number>(12).fill(0)

    const areas: AreaEjecucion[] = areasFiltradas.map((area) => {
      const cuentasArea = cuentaRepo.listarPorArea(area.id)
      for (const c of cuentasArea) codigosEnAreas.add(c.codigo)
      const ejecutado = cuentasArea.reduce((t, c) => t + (ejecPorCuenta.get(c.codigo) ?? 0), 0)

      const presupuestoArea = presArea.get(area.id)
      if (presupuestoArea) {
        for (let m = 0; m < 12; m++) presupuestoPorMes[m] += presupuestoArea.meses[m] ?? 0
      } else {
        for (const c of cuentasArea) {
          const pc = presCuenta.get(c.codigo)
          if (pc) for (let m = 0; m < 12; m++) presupuestoPorMes[m] += pc.meses[m] ?? 0
        }
      }

      const presupuesto = presupuestoArea
        ? presupuestoEnPeriodo(presupuestoArea.meses, anio, desde, hasta)
        : cuentasArea.reduce((t, c) => {
            const pc = presCuenta.get(c.codigo)
            return t + (pc ? presupuestoEnPeriodo(pc.meses, anio, desde, hasta) : 0)
          }, 0)

      const porcentaje = presupuesto > 0 ? ejecutado / presupuesto : 0
      const estado = calcularEstado(
        presupuesto,
        ejecutado,
        cfg.umbralRiesgo,
        cfg.umbralBajoUso,
        area.naturaleza
      )
      conteoEstados[estado]++

      return {
        areaId: area.id,
        nombre: area.nombre,
        color: area.color,
        naturaleza: area.naturaleza,
        presupuesto,
        ejecutado,
        disponible: presupuesto - ejecutado,
        porcentaje,
        estado,
        numCuentas: cuentasArea.length
      }
    })

    areas.sort((a, b) => b.ejecutado - a.ejecutado)

    // Serie mensual: solo movimientos de las áreas mostradas (consistente con los KPI)
    const ejecPorMes = new Array<number>(12).fill(0)
    let movimientosEnAreas = 0
    for (const mov of movimientos) {
      if (!codigosEnAreas.has(mov.cuenta)) continue
      movimientosEnAreas++
      const naturaleza = naturalezaPorCuenta.get(mov.cuenta) ?? naturalezaDeCuenta(mov.cuenta)
      const m = indiceMes(mov.fecha)
      if (m >= 0) ejecPorMes[m] += ejecutadoMovimiento(naturaleza, mov.debito, mov.credito)
    }

    // Cuentas sin área (opcionalmente filtradas por naturaleza)
    let ejecutadoSinArea = 0
    let cuentasSinAsignar = 0
    for (const c of cuentas) {
      if (c.areaId !== null) continue
      if (filtro && c.naturaleza !== filtro) continue
      cuentasSinAsignar++
      ejecutadoSinArea += ejecPorCuenta.get(c.codigo) ?? 0
    }

    const serieMensual: SerieMes[] = mesesEnPeriodo(anio, desde, hasta).map((m) => ({
      mes: m,
      presupuesto: presupuestoPorMes[m],
      ejecutado: ejecPorMes[m]
    }))

    const totalPresupuesto = areas.reduce((t, a) => t + a.presupuesto, 0)
    const totalEjecutado = areas.reduce((t, a) => t + a.ejecutado, 0)

    return {
      desde,
      hasta,
      totalPresupuesto,
      totalEjecutado,
      totalDisponible: totalPresupuesto - totalEjecutado,
      porcentaje: totalPresupuesto > 0 ? totalEjecutado / totalPresupuesto : 0,
      ejecutadoSinArea,
      cuentasSinAsignar,
      numMovimientos: movimientosEnAreas,
      hayDatos: movimientos.length > 0,
      areas,
      serieMensual,
      conteoEstados
    }
  },

  detalleArea(query: DetalleAreaQuery): AreaDetalle {
    const { areaId, desde, hasta } = query
    const area = areaRepo.buscarPorId(areaId)
    if (!area) throw new Error('Área no encontrada')

    const anio = Number.parseInt(desde.slice(0, 4), 10) || new Date().getFullYear()
    const cfg = configRepo.obtener()
    const cuentas = cuentaRepo.listarPorArea(areaId)
    const codigos = new Set(cuentas.map((c) => c.codigo))

    const presupuestos = presupuestoRepo.listarPorAnio(area.sedeId, anio)
    const presArea = presupuestos.find((p) => p.ambito === 'area' && p.referenciaId === areaId)
    const presCuenta = new Map<string, Presupuesto>()
    for (const p of presupuestos) if (p.ambito === 'cuenta') presCuenta.set(p.referenciaId, p)

    const movimientos = movimientoRepo
      .listarEntre(desde, hasta, area.sedeId)
      .filter((m) => codigos.has(m.cuenta))

    const ejecPorCuenta = new Map<string, number>()
    const movsPorCuenta = new Map<string, number>()
    const ejecPorMes = new Array<number>(12).fill(0)
    const terceros = new Map<string, TerceroEjecucion>()

    for (const mov of movimientos) {
      const cuenta = cuentas.find((c) => c.codigo === mov.cuenta)
      const naturaleza = cuenta?.naturaleza ?? naturalezaDeCuenta(mov.cuenta)
      const valor = ejecutadoMovimiento(naturaleza, mov.debito, mov.credito)
      ejecPorCuenta.set(mov.cuenta, (ejecPorCuenta.get(mov.cuenta) ?? 0) + valor)
      movsPorCuenta.set(mov.cuenta, (movsPorCuenta.get(mov.cuenta) ?? 0) + 1)
      const m = indiceMes(mov.fecha)
      if (m >= 0) ejecPorMes[m] += valor

      const claveTercero = mov.nit || mov.tercero
      const t = terceros.get(claveTercero) ?? {
        nit: mov.nit,
        tercero: mov.tercero,
        total: 0,
        numMovimientos: 0
      }
      t.total += valor
      t.numMovimientos++
      terceros.set(claveTercero, t)
    }

    const cuentasEjecucion: CuentaEjecucion[] = cuentas
      .map((c) => {
        const ejecutado = ejecPorCuenta.get(c.codigo) ?? 0
        const pc = presCuenta.get(c.codigo)
        const presupuesto = pc ? presupuestoEnPeriodo(pc.meses, anio, desde, hasta) : 0
        return {
          codigo: c.codigo,
          descripcion: c.descripcion,
          naturaleza: c.naturaleza,
          presupuesto,
          ejecutado,
          disponible: presupuesto - ejecutado,
          porcentaje: presupuesto > 0 ? ejecutado / presupuesto : 0,
          estado: calcularEstado(
            presupuesto,
            ejecutado,
            cfg.umbralRiesgo,
            cfg.umbralBajoUso,
            c.naturaleza
          ),
          numMovimientos: movsPorCuenta.get(c.codigo) ?? 0
        }
      })
      .sort((a, b) => b.ejecutado - a.ejecutado)

    const ejecutado = cuentasEjecucion.reduce((t, c) => t + c.ejecutado, 0)
    const presupuesto = presArea
      ? presupuestoEnPeriodo(presArea.meses, anio, desde, hasta)
      : cuentasEjecucion.reduce((t, c) => t + c.presupuesto, 0)

    const presupuestoPorMes = new Array<number>(12).fill(0)
    if (presArea) {
      for (let m = 0; m < 12; m++) presupuestoPorMes[m] += presArea.meses[m] ?? 0
    } else {
      for (const c of cuentas) {
        const pc = presCuenta.get(c.codigo)
        if (pc) for (let m = 0; m < 12; m++) presupuestoPorMes[m] += pc.meses[m] ?? 0
      }
    }

    const serieMensual: SerieMes[] = mesesEnPeriodo(anio, desde, hasta).map((m) => ({
      mes: m,
      presupuesto: presupuestoPorMes[m],
      ejecutado: ejecPorMes[m]
    }))

    const topTerceros = [...terceros.values()].sort((a, b) => b.total - a.total).slice(0, 10)

    return {
      areaId: area.id,
      nombre: area.nombre,
      color: area.color,
      naturaleza: area.naturaleza,
      desde,
      hasta,
      presupuesto,
      ejecutado,
      disponible: presupuesto - ejecutado,
      porcentaje: presupuesto > 0 ? ejecutado / presupuesto : 0,
      estado: calcularEstado(
        presupuesto,
        ejecutado,
        cfg.umbralRiesgo,
        cfg.umbralBajoUso,
        area.naturaleza
      ),
      numMovimientos: movimientos.length,
      cuentas: cuentasEjecucion,
      topTerceros,
      serieMensual
    }
  }
}
