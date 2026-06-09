import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import type { CuentaContable, Movimiento, Importacion } from '@shared/domain/types'
import type {
  PreviewImportacion,
  ResultadoConfirmacion,
  CuentaNueva
} from '@shared/ipc/contract'
import { claseDeCuenta, naturalezaDeCuenta } from '@shared/domain/puc'
import { leerMatriz } from '../lib/lectorArchivo'
import { parsearLibroAuxiliar, type ResultadoParseo } from '../lib/siimedParser'
import { cuentaRepo } from '../repositories/cuentaRepo'
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

    const cuentasNuevas: CuentaNueva[] = parseo.cuentas
      .filter((c) => !cuentaRepo.buscarPorCodigo(c.codigo))
      .map((c) => ({
        codigo: c.codigo,
        descripcion: c.descripcion,
        naturaleza: naturalezaDeCuenta(c.codigo)
      }))

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

  confirmar(token: string): ResultadoConfirmacion {
    const pendiente = pendientes.get(token)
    if (!pendiente) throw new Error('La previsualización expiró. Vuelva a cargar el archivo.')
    const { parseo, archivo, hash } = pendiente

    const importacionId = nuevoId()
    let cuentasCreadas = 0
    for (const c of parseo.cuentas) {
      const existente = cuentaRepo.buscarPorCodigo(c.codigo)
      if (!existente) {
        const cuenta: CuentaContable = {
          codigo: c.codigo,
          descripcion: c.descripcion,
          clase: claseDeCuenta(c.codigo),
          naturaleza: naturalezaDeCuenta(c.codigo),
          areaId: null,
          activa: true
        }
        cuentaRepo.upsert(cuenta)
        cuentasCreadas++
      } else if (!existente.descripcion && c.descripcion) {
        cuentaRepo.upsert({ ...existente, descripcion: c.descripcion })
      }
    }

    const movimientos: Movimiento[] = parseo.movimientos.map((m) => ({
      id: idMovimiento(m.comprobante, m.cuenta),
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

    const importacion: Importacion = {
      id: importacionId,
      archivo,
      hash,
      fechaProcesado: parseo.fechaProcesado,
      periodoInicio: parseo.periodoInicio,
      periodoFin: parseo.periodoFin,
      totalRegistros: movimientos.length,
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
