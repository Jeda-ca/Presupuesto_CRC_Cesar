import { describe, it, expect } from 'vitest'
import type { DashboardResumen } from '@shared/ipc/contract'
import { construirInformeHTML } from '../informeHtml'

function resumenBase(): DashboardResumen {
  return {
    desde: '2026-01-01',
    hasta: '2026-03-31',
    totalPresupuesto: 1000000,
    totalEjecutado: 600000,
    totalDisponible: 400000,
    porcentaje: 0.6,
    ejecutadoSinArea: 0,
    cuentasSinAsignar: 0,
    numMovimientos: 10,
    hayDatos: true,
    areas: [
      {
        areaId: 'a1',
        nombre: 'Vacunación',
        color: '#16a34a',
        naturaleza: 'ingreso',
        presupuesto: 1000000,
        ejecutado: 600000,
        disponible: 400000,
        porcentaje: 0.6,
        estado: 'normal',
        numCuentas: 2
      }
    ],
    serieMensual: [],
    conteoEstados: { normal: 1, en_riesgo: 0, excedido: 0, bajo_uso: 0, sin_presupuesto: 0 }
  }
}

describe('construirInformeHTML', () => {
  const meta = { titulo: 'Informe', entidad: 'Cruz Roja Cesar', generadoEn: '2026-06-09' }

  it('incluye título, período y nombre de área', () => {
    const html = construirInformeHTML(resumenBase(), meta)
    expect(html).toContain('Informe')
    expect(html).toContain('Vacunación')
    expect(html).toContain('01/01/2026')
    expect(html).toContain('31/03/2026')
  })

  it('escapa nombres de área para evitar inyección de HTML', () => {
    const resumen = resumenBase()
    resumen.areas[0].nombre = '<script>alert(1)</script>'
    const html = construirInformeHTML(resumen, meta)
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('incrusta el logo como data URI cuando se proporciona', () => {
    const dataUri = 'data:image/png;base64,AAAA'
    const html = construirInformeHTML(resumenBase(), { ...meta, logoDataUri: dataUri })
    expect(html).toContain(`<img src="${dataUri}"`)
    expect(html).toContain('logo con-img')
  })

  it('usa el distintivo por defecto cuando no hay logo', () => {
    const html = construirInformeHTML(resumenBase(), meta)
    expect(html).not.toContain('<img src="data:image')
  })
})
