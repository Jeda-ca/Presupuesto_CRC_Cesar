import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import type { CuentaContable, Movimiento, Importacion } from '@shared/domain/types'
import type {
  PreviewImportacion,
  ResultadoConfirmacion,
  CuentaNueva,
  SedeImportacion
} from '@shared/ipc/contract'
import { claseDeCuenta, naturalezaDeCuenta } from '@shared/domain/puc'
import { prefijoDeCentroCosto, nombreSede, SEDE_PRINCIPAL } from '@shared/domain/sedes'
import { leerMatriz } from '../lib/lectorArchivo'
import { parsearLibroAuxiliar, type ResultadoParseo } from '../lib/siimedParser'
import { cuentaRepo } from '../repositories/cuentaRepo'
import { sedeRepo } from '../repositories/sedeRepo'
import { movimientoRepo } from '../repositories/movimientoRepo'
import { importacionRepo } from '../repositories/importacionRepo'
import { nuevoId, hashEstable } from '../lib/id'

interface Pendiente {
  archivo: string
  hash: string
  parseo: ResultadoParseo
}

const pendientes = new Map<string, Pendiente>()

function idMovimiento(comprobante: string, cuenta: string): string {
  return hashEstable(comprobante, '::', cuenta)
}

function sedeDeCentroCosto(centroCosto: string): string {
  return prefijoDeCentroCosto(centroCosto) || SEDE_PRINCIPAL
}

export const importService = {
  previsualizar(ruta: string): PreviewImportacion {
    const buffer = readFileSync(ruta)
    const hash = createHash('sha1').update(buffer).digest('hex')
    const parseo = parsearLibroAuxiliar(leerMatriz(ruta))

    const existentes = movimientoRepo.idsExistentes()
    let nuevos = 0
    let duplicados = 0
    for (const mov of parseo.movimientos) {
      if (existentes.has(idMovimiento(mov.comprobante, mov.cuenta))) duplicados++
      else nuevos++
    }

    const sedesPorCuenta = new Map<string, Set<string>>()
    const movsPorSede = new Map<string, number>()
    for (const mov of parseo.movimientos) {
      const prefijo = sedeDeCentroCosto(mov.centroCosto)
      movsPorSede.set(prefijo, (movsPorSede.get(prefijo) ?? 0) + 1)
      const set = sedesPorCuenta.get(mov.cuenta) ?? new Set<string>()
      set.add(prefijo)
      sedesPorCuenta.set(mov.cuenta, set)
    }

    const cuentasNuevas: CuentaNueva[] = parseo.cuentas
      .filter((c) =>
        [...(sedesPorCuenta.get(c.codigo) ?? [])].some(
          (sedeId) => !cuentaRepo.buscarPorCodigo(sedeId, c.codigo)
        )
      )
      .map((c) => ({
        codigo: c.codigo,
        descripcion: c.descripcion,
        naturaleza: naturalezaDeCuenta(c.codigo)
      }))
    const sedes: SedeImportacion[] = [...movsPorSede.entries()]
      .map(([prefijo, movimientos]) => ({ prefijo, nombre: nombreSede(prefijo), movimientos }))
      .sort((a, b) => a.prefijo.localeCompare(b.prefijo))

    const token = nuevoId()
    pendientes.set(token, { archivo: basename(ruta), hash, parseo })

    return {
      token,
      archivo: basename(ruta),
      periodoInicio: parseo.periodoInicio,
      periodoFin: parseo.periodoFin,
      fechaProcesado: parseo.fechaProcesado,
      totalMovimientos: parseo.movimientos.length,
      nuevos,
      duplicados,
      cuentasNuevas,
      sedes,
      checksumCuadra: parseo.checksumGlobal.cuadra,
      debitosParse: parseo.checksumGlobal.debitosParse,
      creditosParse: parseo.checksumGlobal.creditosParse,
      debitosReporte: parseo.checksumGlobal.debitosReporte,
      creditosReporte: parseo.checksumGlobal.creditosReporte,
      descuadres: parseo.checksumPorCuenta
        .filter((c) => !c.cuadra)
        .map((c) => ({
          codigo: c.codigo,
          debitosParse: c.debitosParse,
          creditosParse: c.creditosParse,
          debitosReporte: c.debitosReporte,
          creditosReporte: c.creditosReporte
        })),
      errores: parseo.errores,
      archivoYaImportado: importacionRepo.buscarPorHash(hash) !== undefined
    }
  },

  confirmar(token: string, sedes?: string[] | null): ResultadoConfirmacion {
    const pendiente = pendientes.get(token)
    if (!pendiente) throw new Error('La previsualización expiró. Vuelva a cargar el archivo.')
    const { parseo, archivo, hash } = pendiente

    const filtroSedes = sedes && sedes.length > 0 ? new Set(sedes) : null
    const movimientosAImportar = filtroSedes
      ? parseo.movimientos.filter((m) => filtroSedes.has(sedeDeCentroCosto(m.centroCosto)))
      : parseo.movimientos
    if (movimientosAImportar.length === 0) {
      throw new Error('No hay movimientos para las sedes seleccionadas.')
    }

    const importacionId = nuevoId()

    const cuentasPorSede = new Map<string, Set<string>>()
    for (const m of movimientosAImportar) {
      const sedeId = sedeDeCentroCosto(m.centroCosto)
      const set = cuentasPorSede.get(sedeId) ?? new Set<string>()
      set.add(m.cuenta)
      cuentasPorSede.set(sedeId, set)
    }

    const descripcionPorCodigo = new Map(parseo.cuentas.map((c) => [c.codigo, c.descripcion]))
    let cuentasCreadas = 0
    for (const [sedeId, codigos] of cuentasPorSede) {
      if (!sedeRepo.buscar(sedeId)) {
        sedeRepo.upsert({ prefijo: sedeId, nombre: nombreSede(sedeId) })
      }
      for (const codigo of codigos) {
        const descripcion = descripcionPorCodigo.get(codigo) ?? ''
        const existente = cuentaRepo.buscarPorCodigo(sedeId, codigo)
        if (!existente) {
          const cuenta: CuentaContable = {
            sedeId,
            codigo,
            descripcion,
            clase: claseDeCuenta(codigo),
            naturaleza: naturalezaDeCuenta(codigo),
            areaId: null,
            activa: true
          }
          cuentaRepo.upsert(cuenta)
          cuentasCreadas++
        } else if (!existente.descripcion && descripcion) {
          cuentaRepo.upsert({ ...existente, descripcion })
        }
      }
    }

    const movimientos: Movimiento[] = movimientosAImportar.map((m) => ({
      id: idMovimiento(m.comprobante, m.cuenta),
      sedeId: sedeDeCentroCosto(m.centroCosto),
      cuenta: m.cuenta,
      nit: m.nit,
      tercero: m.tercero,
      comprobante: m.comprobante,
      fecha: m.fecha,
      detalle: m.detalle,
      centroCosto: m.centroCosto,
      debito: m.debito,
      credito: m.credito,
      importacionId
    }))

    const { insertados, actualizados } = movimientoRepo.upsertLote(movimientos)

    const sedesImportadas = [...cuentasPorSede.keys()].sort()

    const importacion: Importacion = {
      id: importacionId,
      archivo,
      hash,
      fechaProcesado: parseo.fechaProcesado,
      periodoInicio: parseo.periodoInicio,
      periodoFin: parseo.periodoFin,
      totalRegistros: movimientos.length,
      sedes: sedesImportadas,
      fechaCarga: new Date().toISOString()
    }
    importacionRepo.insertar(importacion)

    pendientes.delete(token)
    return { insertados, actualizados, cuentasCreadas }
  },

  descartar(token: string): void {
    pendientes.delete(token)
  },

  listar(): Importacion[] {
    return importacionRepo.listar()
  },

  eliminar(id: string): { movimientosEliminados: number } {
    const movimientosEliminados = movimientoRepo.eliminarPorImportacion(id)
    importacionRepo.eliminar(id)
    return { movimientosEliminados }
  }
}
