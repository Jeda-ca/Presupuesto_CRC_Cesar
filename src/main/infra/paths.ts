import { join } from 'node:path'
import { app } from 'electron'

export const WORKSPACE_EXT = 'crcpresupuesto'

export function defaultWorkspacePath(): string {
  return join(app.getPath('userData'), `workspace.${WORKSPACE_EXT}`)
}
