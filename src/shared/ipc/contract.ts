import type {
  Area,
  CuentaContable,
  Presupuesto,
  Configuracion,
  Importacion,
  Naturaleza
} from '../domain/types'
import type {
  CrearAreaInput,
  ActualizarAreaInput,
  AsignarCuentaAreaInput,
  GuardarPresupuestoInput,
  ActualizarConfiguracionInput,
  PeriodoQuery,
  ResumenQuery,
  DetalleAreaQuery,
  MovimientosQuery
} from '../schemas/dto'

/**
 * Envoltura uniforme de respuestas IPC. Los handlers nunca lanzan a través del
 * puente; devuelven un Result que el renderer desempaqueta de forma explícita.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export interface WorkspaceEstado {
  ruta: string | null
  nombre: string
  modificadoEn: string | null
}

export interface CuentaNueva {
  codigo: string
  descripcion: string
  naturaleza: Naturaleza
}

export interface ChecksumDescuadre {
  codigo: string
  debitosParse: number
  creditosParse: number
  debitosReporte: number
  creditosReporte: number
}

export interface PreviewImportacion {
  token: string
  archivo: string
  periodoInicio: string | null
  periodoFin: string | null
  fechaProcesado: string | null
  totalMovimientos: number
  nuevos: number
  duplicados: number
  cuentasNuevas: CuentaNueva[]
  checksumCuadra: boolean
  debitosParse: number
  creditosParse: number
  debitosReporte: number | null
  creditosReporte: number | null
  descuadres: ChecksumDescuadre[]
  errores: { fila: number; motivo: string }[]
  archivoYaImportado: boolean
}

export interface ResultadoConfirmacion {
  insertados: number
  actualizados: number
  cuentasCreadas: number
}

export type EstadoEjecucion =
  | 'normal'
  | 'en_riesgo'
  | 'excedido'
  | 'bajo_uso'
  | 'sin_presupuesto'

export interface AreaEjecucion {
  areaId: string
  nombre: string
  color: string
  naturaleza: Naturaleza
  presupuesto: number
  ejecutado: number
  disponible: number
  porcentaje: number
  estado: EstadoEjecucion
  numCuentas: number
}

export interface SerieMes {
  mes: number
  presupuesto: number
  ejecutado: number
}

export interface DashboardResumen {
  desde: string
  hasta: string
  totalPresupuesto: number
  totalEjecutado: number
  totalDisponible: number
  porcentaje: number
  ejecutadoSinArea: number
  cuentasSinAsignar: number
  numMovimientos: number
  hayDatos: boolean
  areas: AreaEjecucion[]
  serieMensual: SerieMes[]
  conteoEstados: Record<EstadoEjecucion, number>
}

export interface CuentaEjecucion {
  codigo: string
  descripcion: string
  naturaleza: Naturaleza
  presupuesto: number
  ejecutado: number
  disponible: number
  porcentaje: number
  estado: EstadoEjecucion
  numMovimientos: number
}

export interface TerceroEjecucion {
  nit: string
  tercero: string
  total: number
  numMovimientos: number
}

export interface AreaDetalle {
  areaId: string
  nombre: string
  color: string
  naturaleza: Naturaleza
  desde: string
  hasta: string
  presupuesto: number
  ejecutado: number
  disponible: number
  porcentaje: number
  estado: EstadoEjecucion
  numMovimientos: number
  cuentas: CuentaEjecucion[]
  topTerceros: TerceroEjecucion[]
  serieMensual: SerieMes[]
}

export interface MovimientoVista {
  id: string
  cuenta: string
  cuentaDescripcion: string
  nit: string
  tercero: string
  comprobante: string
  fecha: string
  detalle: string
  centroCosto: string
  debito: number
  credito: number
  ejecutado: number
}

export const IPC_CHANNELS = {
  app: {
    version: 'app:version'
  },
  workspace: {
    estado: 'workspace:estado',
    nuevo: 'workspace:nuevo',
    abrir: 'workspace:abrir',
    guardarComo: 'workspace:guardarComo'
  },
  config: {
    obtener: 'config:obtener',
    actualizar: 'config:actualizar'
  },
  areas: {
    listar: 'areas:listar',
    crear: 'areas:crear',
    actualizar: 'areas:actualizar',
    eliminar: 'areas:eliminar'
  },
  cuentas: {
    listar: 'cuentas:listar',
    asignarArea: 'cuentas:asignarArea'
  },
  presupuestos: {
    listarPorAnio: 'presupuestos:listarPorAnio',
    guardar: 'presupuestos:guardar',
    eliminar: 'presupuestos:eliminar'
  },
  importacion: {
    previsualizar: 'importacion:previsualizar',
    confirmar: 'importacion:confirmar',
    descartar: 'importacion:descartar',
    listar: 'importacion:listar',
    eliminar: 'importacion:eliminar'
  },
  dashboard: {
    resumen: 'dashboard:resumen',
    detalleArea: 'dashboard:detalleArea'
  },
  movimientos: {
    listar: 'movimientos:listar'
  },
  reporte: {
    generarPdf: 'reporte:generarPdf'
  }
} as const

/**
 * Superficie tipada expuesta al renderer vía contextBridge (window.api).
 * Cada método corresponde a un canal y devuelve siempre un Result.
 */
export interface Api {
  app: {
    version(): Promise<Result<string>>
  }
  workspace: {
    estado(): Promise<Result<WorkspaceEstado>>
    nuevo(): Promise<Result<WorkspaceEstado>>
    abrir(): Promise<Result<WorkspaceEstado | null>>
    guardarComo(): Promise<Result<WorkspaceEstado | null>>
  }
  config: {
    obtener(): Promise<Result<Configuracion>>
    actualizar(input: ActualizarConfiguracionInput): Promise<Result<Configuracion>>
  }
  areas: {
    listar(): Promise<Result<Area[]>>
    crear(input: CrearAreaInput): Promise<Result<Area>>
    actualizar(input: ActualizarAreaInput): Promise<Result<Area>>
    eliminar(id: string): Promise<Result<void>>
  }
  cuentas: {
    listar(): Promise<Result<CuentaContable[]>>
    asignarArea(input: AsignarCuentaAreaInput): Promise<Result<CuentaContable>>
  }
  presupuestos: {
    listarPorAnio(anio: number): Promise<Result<Presupuesto[]>>
    guardar(input: GuardarPresupuestoInput): Promise<Result<Presupuesto>>
    eliminar(id: string): Promise<Result<void>>
  }
  importacion: {
    previsualizar(): Promise<Result<PreviewImportacion | null>>
    confirmar(token: string): Promise<Result<ResultadoConfirmacion>>
    descartar(token: string): Promise<Result<void>>
    listar(): Promise<Result<Importacion[]>>
    eliminar(id: string): Promise<Result<{ movimientosEliminados: number }>>
  }
  dashboard: {
    resumen(query: ResumenQuery): Promise<Result<DashboardResumen>>
    detalleArea(query: DetalleAreaQuery): Promise<Result<AreaDetalle>>
  }
  movimientos: {
    listar(query: MovimientosQuery): Promise<Result<MovimientoVista[]>>
  }
  reporte: {
    generarPdf(query: PeriodoQuery): Promise<Result<{ ruta: string } | null>>
  }
}
