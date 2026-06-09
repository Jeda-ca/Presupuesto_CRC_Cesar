import { dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS, type WorkspaceEstado } from '@shared/ipc/contract'
import { store } from '../infra/store'
import { WORKSPACE_EXT } from '../infra/paths'
import { handle } from './helpers'

const FILTROS = [{ name: 'Presupuesto CRC', extensions: [WORKSPACE_EXT] }]

function ventanaActiva(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export function registrarWorkspaceRoutes(): void {
  handle(IPC_CHANNELS.workspace.estado, null, (): WorkspaceEstado => store.getEstado())

  handle(IPC_CHANNELS.workspace.nuevo, null, () => store.nuevo())

  handle(IPC_CHANNELS.workspace.abrir, null, async (): Promise<WorkspaceEstado | null> => {
    const ventana = ventanaActiva()
    const resultado = await dialog.showOpenDialog(ventana!, {
      title: 'Abrir espacio de trabajo',
      filters: FILTROS,
      properties: ['openFile']
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    return store.abrir(resultado.filePaths[0])
  })

  handle(IPC_CHANNELS.workspace.guardarComo, null, async (): Promise<WorkspaceEstado | null> => {
    const ventana = ventanaActiva()
    const resultado = await dialog.showSaveDialog(ventana!, {
      title: 'Guardar espacio de trabajo como',
      filters: FILTROS,
      defaultPath: `presupuesto.${WORKSPACE_EXT}`
    })
    if (resultado.canceled || !resultado.filePath) return null
    return store.guardarComo(resultado.filePath)
  })
}
