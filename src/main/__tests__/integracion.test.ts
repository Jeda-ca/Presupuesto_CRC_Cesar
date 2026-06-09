import { describe, it, expect, beforeAll, vi } from 'vitest'
import { fileURLToPath } from 'node:url'

vi.mock('electron', async () => {
  const os = await import('node:os')
  const fs = await import('node:fs')
  const path = await import('node:path')
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crc-integ-'))
  return { app: { getPath: () => dir } }
})

const fixture = fileURLToPath(
  new URL('../lib/__tests__/fixtures/libro-auxiliar.csv', import.meta.url)
)

const { store } = await import('../infra/store')
const { importService } = await import('../services/importService')
const { areaService } = await import('../services/areaService')
const { cuentaService } = await import('../services/cuentaService')
const { presupuestoService } = await import('../services/presupuestoService')
const { dashboardService } = await import('../services/dashboardService')
const { movimientoService } = await import('../services/movimientoService')

const Q1 = { desde: '2026-01-01', hasta: '2026-03-31' }
let areaId = ''

describe('Flujo completo backend (import -> área -> presupuesto -> dashboard -> detalle)', () => {
  beforeAll(async () => {
    await store.init()
  })

  it('previsualiza el archivo con checksum verificado', () => {
    const preview = importService.previsualizar(fixture)
    expect(preview.checksumCuadra).toBe(true)
    expect(preview.totalMovimientos).toBeGreaterThan(0)
    expect(preview.nuevos).toBe(preview.totalMovimientos)
    expect(preview.duplicados).toBe(0)
    expect(preview.cuentasNuevas.length).toBe(18)
  })

  it('confirma la importación y crea cuentas y movimientos', () => {
    const preview = importService.previsualizar(fixture)
    const r = importService.confirmar(preview.token)
    expect(r.cuentasCreadas).toBe(18)
    expect(r.insertados).toBe(preview.totalMovimientos)
    expect(cuentaService.listar()).toHaveLength(18)
  })

  it('reimportar el mismo archivo es idempotente (no duplica)', () => {
    const preview = importService.previsualizar(fixture)
    expect(preview.nuevos).toBe(0)
    expect(preview.duplicados).toBe(preview.totalMovimientos)
    const r = importService.confirmar(preview.token)
    expect(r.insertados).toBe(0)
    expect(r.actualizados).toBe(preview.totalMovimientos)
  })

  it('crea un área de Vacunación y le asigna sus cuentas', () => {
    const area = areaService.crear({
      nombre: 'Vacunación',
      descripcion: '',
      color: '#16a34a',
      naturaleza: 'ingreso'
    })
    areaId = area.id
    cuentaService.asignarArea({ codigo: '41351503', areaId: area.id })
    cuentaService.asignarArea({ codigo: '41700701', areaId: area.id })
    const cuentas = cuentaService.listar().filter((c) => c.areaId === area.id)
    expect(cuentas.map((c) => c.codigo).sort()).toEqual(['41351503', '41700701'])
  })

  it('guarda un presupuesto de área (mensual)', () => {
    const meses = Array.from({ length: 12 }, () => 100000) // 1.200.000 anual, 300.000 en Q1
    presupuestoService.guardar({
      ambito: 'area',
      referenciaId: areaId,
      anio: 2026,
      montoAnual: 1200000,
      meses
    })
    expect(presupuestoService.listarPorAnio(2026)).toHaveLength(1)
  })

  it('calcula el dashboard: ejecutado real vs presupuesto del período', () => {
    const resumen = dashboardService.resumen(Q1)
    const vac = resumen.areas.find((a) => a.areaId === areaId)
    expect(vac).toBeDefined()
    // 41351503 (3.419.000) + 41700701 (962.000) = 4.381.000 de ingresos en Q1
    expect(vac!.ejecutado).toBe(4381000)
    expect(vac!.presupuesto).toBe(300000)
    expect(vac!.disponible).toBe(-4081000)
    expect(vac!.estado).toBe('excedido')
  })

  it('detalle del área: cuentas, terceros y movimientos', () => {
    const det = dashboardService.detalleArea({ areaId, ...Q1 })
    expect(det.ejecutado).toBe(4381000)
    expect(det.cuentas).toHaveLength(2)
    expect(det.topTerceros.length).toBeGreaterThan(0)

    const movs = movimientoService.listar({ ...Q1, cuenta: '41700701' })
    expect(movs).toHaveLength(14)
    expect(movs.reduce((t, m) => t + m.ejecutado, 0)).toBe(962000)
  })

  it('el período fuera de rango no arroja ejecución', () => {
    const resumen = dashboardService.resumen({ desde: '2025-01-01', hasta: '2025-12-31' })
    const vac = resumen.areas.find((a) => a.areaId === areaId)
    expect(vac!.ejecutado).toBe(0)
  })

  it('persiste el workspace en disco', async () => {
    await store.flush()
    expect(store.getData().movimientos.length).toBeGreaterThan(0)
    expect(store.getEstado().ruta).toContain('.crcpresupuesto')
  })
})
