import { registrarWorkspaceRoutes } from './workspaceRoutes'
import { registrarCatalogoRoutes } from './catalogoRoutes'
import { registrarImportRoutes } from './importRoutes'
import { registrarDashboardRoutes } from './dashboardRoutes'
import { registrarReporteRoutes } from './reporteRoutes'

export function registrarIpc(): void {
  registrarWorkspaceRoutes()
  registrarCatalogoRoutes()
  registrarImportRoutes()
  registrarDashboardRoutes()
  registrarReporteRoutes()
}
