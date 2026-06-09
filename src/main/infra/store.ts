import { writeFile, readFile, rename, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, basename } from 'node:path'
import type { StoreData } from '@shared/domain/types'
import type { WorkspaceEstado } from '@shared/ipc/contract'
import { storeDataSchema, STORE_VERSION } from '@shared/schemas/models'
import { defaultWorkspacePath } from './paths'

const AUTOSAVE_DELAY_MS = 800

function storeVacio(): StoreData {
  return {
    version: STORE_VERSION,
    areas: [],
    cuentas: [],
    presupuestos: [],
    movimientos: [],
    importaciones: [],
    configuracion: {
      umbralRiesgo: 0.85,
      umbralBajoUso: 0.3,
      anioActivo: new Date().getFullYear()
    }
  }
}

class Store {
  private data: StoreData = storeVacio()
  private ruta: string = defaultWorkspacePath()
  private modificadoEn: string | null = null
  private dirty = false
  private autosaveTimer: NodeJS.Timeout | null = null
  private guardando: Promise<void> | null = null

  async init(): Promise<void> {
    this.ruta = defaultWorkspacePath()
    if (existsSync(this.ruta)) {
      await this.cargarDesde(this.ruta)
    } else {
      this.data = storeVacio()
      await this.persistir(this.ruta)
    }
  }

  getData(): StoreData {
    return this.data
  }

  getEstado(): WorkspaceEstado {
    return {
      ruta: this.ruta,
      nombre: basename(this.ruta),
      modificadoEn: this.modificadoEn
    }
  }

  /**
   * Aplica una mutación sobre el estado y devuelve el valor calculado.
   * Marca el store como sucio y programa el autoguardado.
   */
  mutate<T>(fn: (data: StoreData) => T): T {
    const resultado = fn(this.data)
    this.dirty = true
    this.modificadoEn = new Date().toISOString()
    this.programarAutosave()
    return resultado
  }

  private programarAutosave(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer)
    this.autosaveTimer = setTimeout(() => {
      void this.flush()
    }, AUTOSAVE_DELAY_MS)
  }

  async flush(): Promise<void> {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer)
      this.autosaveTimer = null
    }
    if (!this.dirty) return
    await this.persistir(this.ruta)
    this.dirty = false
  }

  async nuevo(): Promise<WorkspaceEstado> {
    await this.flush()
    this.data = storeVacio()
    this.dirty = true
    await this.flush()
    return this.getEstado()
  }

  async abrir(ruta: string): Promise<WorkspaceEstado> {
    await this.flush()
    await this.cargarDesde(ruta)
    this.ruta = ruta
    return this.getEstado()
  }

  async guardarComo(ruta: string): Promise<WorkspaceEstado> {
    this.ruta = ruta
    this.dirty = true
    await this.flush()
    return this.getEstado()
  }

  private async cargarDesde(ruta: string): Promise<void> {
    const crudo = await readFile(ruta, 'utf-8')
    const json = JSON.parse(crudo)
    const data = storeDataSchema.parse(this.migrar(json))
    this.data = data
    this.ruta = ruta
    this.modificadoEn = new Date().toISOString()
    this.dirty = false
  }

  private migrar(json: unknown): unknown {
    return json
  }

  private async persistir(ruta: string): Promise<void> {
    if (this.guardando) await this.guardando
    this.guardando = this.escrituraAtomica(ruta).finally(() => {
      this.guardando = null
    })
    await this.guardando
  }

  private async escrituraAtomica(ruta: string): Promise<void> {
    const dir = dirname(ruta)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const tmp = `${ruta}.${process.pid}.tmp`
    const contenido = JSON.stringify(this.data, null, 2)
    await writeFile(tmp, contenido, 'utf-8')
    await rename(tmp, ruta)
  }
}

export const store = new Store()
