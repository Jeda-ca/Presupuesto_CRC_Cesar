/**
 * Las sedes de la seccional se distinguen por el prefijo del centro de costo
 * en el export de Siimed (ej. "0001-705" pertenece a Valledupar).
 */
export const SEDES_CONOCIDAS: Record<string, string> = {
  '0001': 'Valledupar',
  '0002': 'Aguachica',
  '0003': 'Becerril'
}

export const SEDE_PRINCIPAL = '0001'

export const SEDES_INICIALES: { prefijo: string; nombre: string }[] = Object.entries(
  SEDES_CONOCIDAS
).map(([prefijo, nombre]) => ({ prefijo, nombre }))

export function prefijoDeCentroCosto(centroCosto: string): string {
  return centroCosto.trim().split('-')[0]?.trim() ?? ''
}

export function nombreSede(prefijo: string): string {
  if (!prefijo) return 'Sin centro de costo'
  return SEDES_CONOCIDAS[prefijo] ?? `Sede ${prefijo}`
}
