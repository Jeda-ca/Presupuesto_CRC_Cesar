import type { DashboardResumen, EstadoEjecucion } from '@shared/ipc/contract'

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const ESTADO: Record<EstadoEjecucion, { label: string; color: string }> = {
  normal: { label: 'En rango', color: '#16a34a' },
  en_riesgo: { label: 'En riesgo', color: '#d97706' },
  excedido: { label: 'Excedido', color: '#dc2626' },
  bajo_uso: { label: 'Subejecución', color: '#0284c7' },
  sin_presupuesto: { label: 'Sin presupuesto', color: '#94a3b8' }
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-')
  return a && m && d ? `${d}/${m}/${a}` : iso
}

function pct(fraccion: number): string {
  return `${(fraccion * 100).toFixed(1)}%`
}

export interface InformeMeta {
  titulo: string
  entidad: string
  generadoEn: string
  logoDataUri?: string
}

export function construirInformeHTML(resumen: DashboardResumen, meta: InformeMeta): string {
  const filas = resumen.areas
    .map((a) => {
      const e = ESTADO[a.estado]
      const ancho = Math.min(100, Math.max(2, a.porcentaje * 100))
      return `
        <tr>
          <td>
            <span class="dot" style="background:${escapar(a.color)}"></span>
            ${escapar(a.nombre)}
          </td>
          <td class="num">${moneda.format(a.presupuesto)}</td>
          <td class="num">${moneda.format(a.ejecutado)}</td>
          <td class="num ${a.disponible < 0 ? 'neg' : ''}">${moneda.format(a.disponible)}</td>
          <td>
            <div class="bar"><span style="width:${ancho}%;background:${e.color}"></span></div>
            <small>${pct(a.porcentaje)}</small>
          </td>
          <td><span class="badge" style="background:${e.color}">${e.label}</span></td>
        </tr>`
    })
    .join('')

  const alertas = resumen.areas.filter((a) => a.estado === 'excedido' || a.estado === 'en_riesgo')
  const seccionAlertas = alertas.length
    ? `<div class="alertas">
        <h2>Áreas que requieren atención</h2>
        <ul>
          ${alertas
            .map(
              (a) =>
                `<li><strong>${escapar(a.nombre)}</strong>: ${ESTADO[a.estado].label} · ejecutado ${moneda.format(a.ejecutado)} de ${moneda.format(a.presupuesto)} (${pct(a.porcentaje)})</li>`
            )
            .join('')}
        </ul>
      </div>`
    : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px 36px; font-size: 12px; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #d7261e; padding-bottom: 14px; margin-bottom: 18px; }
  .logo { width: 40px; height: 40px; background: #d7261e; color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; overflow: hidden; }
  .logo.con-img { background: #fff; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  header h1 { font-size: 18px; margin: 0; }
  header p { margin: 2px 0 0; color: #64748b; font-size: 11px; }
  .periodo { margin-left: auto; text-align: right; color: #475569; font-size: 11px; }
  .kpis { display: flex; gap: 12px; margin-bottom: 20px; }
  .kpi { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .kpi .label { color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: .04em; }
  .kpi .valor { font-size: 17px; font-weight: 700; margin-top: 4px; }
  h2 { font-size: 13px; margin: 22px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding: 6px 8px; }
  td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.neg { color: #dc2626; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .bar { width: 110px; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; }
  .bar span { display: block; height: 100%; }
  small { color: #64748b; margin-left: 6px; }
  .badge { color: #fff; padding: 2px 7px; border-radius: 9px; font-size: 9px; font-weight: 600; }
  .alertas { margin-top: 22px; border: 1px solid #fde68a; background: #fffbeb; border-radius: 10px; padding: 12px 16px; }
  .alertas h2 { margin-top: 0; color: #b45309; }
  .alertas li { margin: 4px 0; }
  footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #94a3b8; font-size: 9px; text-align: center; }
</style></head>
<body>
  <header>
    <div class="logo${meta.logoDataUri ? ' con-img' : ''}">${
      meta.logoDataUri ? `<img src="${meta.logoDataUri}" alt="Logo" />` : '+'
    }</div>
    <div>
      <h1>${escapar(meta.titulo)}</h1>
      <p>${escapar(meta.entidad)}</p>
    </div>
    <div class="periodo">
      <div>Período: ${fechaLarga(resumen.desde)} a ${fechaLarga(resumen.hasta)}</div>
      <div>Generado: ${escapar(meta.generadoEn)}</div>
    </div>
  </header>

  <div class="kpis">
    <div class="kpi"><div class="label">Presupuestado</div><div class="valor">${moneda.format(resumen.totalPresupuesto)}</div></div>
    <div class="kpi"><div class="label">Ejecutado</div><div class="valor">${moneda.format(resumen.totalEjecutado)}</div></div>
    <div class="kpi"><div class="label">% Ejecución</div><div class="valor">${pct(resumen.porcentaje)}</div></div>
    <div class="kpi"><div class="label">Disponible</div><div class="valor" style="color:${resumen.totalDisponible < 0 ? '#dc2626' : '#16a34a'}">${moneda.format(resumen.totalDisponible)}</div></div>
  </div>

  <h2>Comparativo por área</h2>
  <table>
    <thead><tr><th>Área</th><th>Presupuesto</th><th>Ejecutado</th><th>Disponible</th><th>Avance</th><th>Estado</th></tr></thead>
    <tbody>${filas || '<tr><td colspan="6">Sin áreas configuradas.</td></tr>'}</tbody>
  </table>

  ${seccionAlertas}

  <footer>Documento generado automáticamente por la Herramienta de Presupuesto · ${escapar(meta.entidad)}</footer>
</body></html>`
}
