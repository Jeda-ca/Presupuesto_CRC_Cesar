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
const { sedeService } = await import('../services/sedeService')
const { areaService } = await import('../services/areaService')
const { cuentaService } = await import('../services/cuentaService')
const { presupuestoService } = await import('../services/presupuestoService')
const { dashboardService } = await import('../services/dashboardService')
const { movimientoService } = await import('../services/movimientoService')

const Q1 = { desde: '2026-01-01', hasta: '2026-03-31' }
const VPAR = '0001'
const AGUA = '0002'
let areaId = ''

// Cifras del fixture por sede (verificables contra el CSV):
// 41351503 en 0001 = 1.474.000 / en 0002 = 1.945.000 (total 3.419.000)
// 41700701 en 0001 = 647.000 (11 movs) / en 0002 = 315.000 (total 962.000)
const VACUNACION_VPAR = 2121000

describe('Flujo completo backend por sedes', () => {
  beforeAll(async () => {
    await store.init()
  })

  it('arranca con las tres sedes conocidas', () => {
    const sedes = sedeService.listar()
    expect(sedes.map((s) => s.prefijo)).toEqual(['0001', '0002', '0003'])
    expect(sedes.find((s) => s.prefijo === VPAR)?.nombre).toBe('Valledupar')
  })

  it('previsualiza con checksum verificado y sedes detectadas', () => {
    const preview = importService.previsualizar(fixture)
    expect(preview.checksumCuadra).toBe(true)
    expect(preview.nuevos).toBe(preview.totalMovimientos)
    expect(preview.cuentasNuevas.length).toBe(18)
    const prefijos = preview.sedes.map((s) => s.prefijo)
    expect(prefijos).toContain(VPAR)
    expect(prefijos).toContain(AGUA)
    const total = preview.sedes.reduce((t, s) => t + s.movimientos, 0)
    expect(total).toBe(preview.totalMovimientos)
    importService.descartar(preview.token)
  })

  it('confirma la importación creando cuentas por sede', () => {
    const preview = importService.previsualizar(fixture)
    const r = importService.confirmar(preview.token)
    expect(r.insertados).toBe(preview.totalMovimientos)
    // 16 cuentas con movimientos en Valledupar + 4 en Aguachica
    expect(r.cuentasCreadas).toBe(20)
    expect(cuentaService.listar(VPAR)).toHaveLength(16)
    expect(cuentaService.listar(AGUA)).toHaveLength(4)
  })

  it('reimportar es idempotente', () => {
    const preview = importService.previsualizar(fixture)
    expect(preview.nuevos).toBe(0)
    expect(preview.duplicados).toBe(preview.totalMovimientos)
    const r = importService.confirmar(preview.token)
    expect(r.insertados).toBe(0)
    expect(r.actualizados).toBe(preview.totalMovimientos)
  })

  it('importar filtrando por sede solo procesa esa sede', () => {
    const preview = importService.previsualizar(fixture)
    const aguachica = preview.sedes.find((s) => s.prefijo === AGUA)!
    const r = importService.confirmar(preview.token, [AGUA])
    expect(r.insertados + r.actualizados).toBe(aguachica.movimientos)
  })

  it('rechaza confirmar cuando la sede seleccionada no tiene movimientos', () => {
    const preview = importService.previsualizar(fixture)
    expect(() => importService.confirmar(preview.token, ['9999'])).toThrow(/No hay movimientos/)
    importService.descartar(preview.token)
  })

  it('crea un área de Vacunación en Valledupar con sus cuentas', () => {
    const area = areaService.crear({
      sedeId: VPAR,
      nombre: 'Vacunación',
      descripcion: '',
      color: '#16a34a',
      naturaleza: 'ingreso'
    })
    areaId = area.id
    cuentaService.asignarArea({ sedeId: VPAR, codigo: '41351503', areaId: area.id })
    cuentaService.asignarArea({ sedeId: VPAR, codigo: '41700701', areaId: area.id })
    const asignadas = cuentaService.listar(VPAR).filter((c) => c.areaId === area.id)
    expect(asignadas.map((c) => c.codigo).sort()).toEqual(['41351503', '41700701'])
  })

  it('la misma cuenta en otra sede es independiente', () => {
    const enAguachica = cuentaService.listar(AGUA).find((c) => c.codigo === '41351503')
    expect(enAguachica).toBeDefined()
    expect(enAguachica!.areaId).toBeNull()
    expect(() =>
      cuentaService.asignarArea({ sedeId: AGUA, codigo: '41351503', areaId })
    ).toThrow(/otra sede/)
  })

  it('guarda un presupuesto del área en su sede', () => {
    const meses = Array.from({ length: 12 }, () => 100000)
    presupuestoService.guardar({
      sedeId: VPAR,
      ambito: 'area',
      referenciaId: areaId,
      anio: 2026,
      montoAnual: 1200000,
      meses
    })
    expect(presupuestoService.listarPorAnio(VPAR, 2026)).toHaveLength(1)
    expect(presupuestoService.listarPorAnio(AGUA, 2026)).toHaveLength(0)
  })

  it('el dashboard de Valledupar solo cuenta movimientos de esa sede', () => {
    const resumen = dashboardService.resumen({ ...Q1, sedeId: VPAR })
    const vac = resumen.areas.find((a) => a.areaId === areaId)!
    expect(vac.ejecutado).toBe(VACUNACION_VPAR)
    expect(vac.presupuesto).toBe(300000)
    expect(vac.estado).toBe('meta_superada')
    expect(resumen.cuentasSinAsignar).toBe(14)
    const sumaSerie = resumen.serieMensual.reduce((t, s) => t + s.ejecutado, 0)
    expect(sumaSerie).toBeCloseTo(vac.ejecutado, 1)
  })

  it('el dashboard de Aguachica está vacío de áreas pero registra su ejecución sin asignar', () => {
    const resumen = dashboardService.resumen({ ...Q1, sedeId: AGUA })
    expect(resumen.areas).toHaveLength(0)
    expect(resumen.cuentasSinAsignar).toBe(4)
    // 41351503 (1.945.000) + 41700602 (128.000) + 41700701 (315.000) + 42201606 (1.403.361)
    expect(resumen.ejecutadoSinArea).toBeCloseTo(3791361, 1)
  })

  it('filtra el dashboard por naturaleza dentro de la sede', () => {
    const soloGasto = dashboardService.resumen({ ...Q1, sedeId: VPAR, naturaleza: 'gasto' })
    expect(soloGasto.areas).toHaveLength(0)
    const soloIngreso = dashboardService.resumen({ ...Q1, sedeId: VPAR, naturaleza: 'ingreso' })
    expect(soloIngreso.totalEjecutado).toBe(VACUNACION_VPAR)
  })

  it('detalle del área y movimientos por cuenta dentro de la sede', () => {
    const det = dashboardService.detalleArea({ areaId, ...Q1 })
    expect(det.ejecutado).toBe(VACUNACION_VPAR)
    expect(det.cuentas).toHaveLength(2)

    const movs = movimientoService.listar({ ...Q1, sedeId: VPAR, cuenta: '41700701' })
    expect(movs).toHaveLength(11)
    expect(movs.reduce((t, m) => t + m.ejecutado, 0)).toBe(647000)
  })

  it('el período fuera de rango no arroja ejecución', () => {
    const resumen = dashboardService.resumen({
      desde: '2025-01-01',
      hasta: '2025-12-31',
      sedeId: VPAR
    })
    const vac = resumen.areas.find((a) => a.areaId === areaId)
    expect(vac!.ejecutado).toBe(0)
  })

  it('persiste el workspace en disco', async () => {
    await store.flush()
    expect(store.getData().movimientos.length).toBeGreaterThan(0)
    expect(store.getData().movimientos.every((m) => m.sedeId.length > 0)).toBe(true)
    expect(store.getEstado().ruta).toContain('.crcpresupuesto')
  })
})
