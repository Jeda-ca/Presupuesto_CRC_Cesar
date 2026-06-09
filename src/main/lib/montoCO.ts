/**
 * Convierte un valor de Siimed a número. Soporta el formato colombiano
 * (miles con punto, decimales con coma) y los negativos entre paréntesis.
 * Los valores numéricos (provenientes de celdas xlsx) se devuelven tal cual.
 */
export function parseMontoCO(valor: unknown): number {
  if (valor === null || valor === undefined) return 0
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0

  let texto = String(valor).trim()
  if (texto === '' || texto === '-') return 0

  const negativo = /^\(.*\)$/.test(texto)
  texto = texto.replace(/[()]/g, '').replace(/\s/g, '')
  texto = texto.replace(/\./g, '').replace(/,/g, '.')
  texto = texto.replace(/[^0-9.-]/g, '')

  if (texto === '' || texto === '-' || texto === '.') return 0
  const numero = Number.parseFloat(texto)
  if (Number.isNaN(numero)) return 0
  return negativo ? -Math.abs(numero) : numero
}
