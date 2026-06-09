import { join } from 'node:path'
import { app } from 'electron'

export const WORKSPACE_EXT = 'crcpresupuesto'

/**
 * Ruta del espacio de trabajo por defecto. En modo portable (electron-builder
 * define PORTABLE_EXECUTABLE_DIR) los datos se guardan junto al .exe para que
 * viajen con él (USB u otro equipo). En instalación normal o desarrollo, se
 * usan los datos de usuario del sistema.
 */
export function defaultWorkspacePath(): string {
  const dirPortable = process.env.PORTABLE_EXECUTABLE_DIR
  if (dirPortable) {
    return join(dirPortable, `presupuesto.${WORKSPACE_EXT}`)
  }
  return join(app.getPath('userData'), `workspace.${WORKSPACE_EXT}`)
}
