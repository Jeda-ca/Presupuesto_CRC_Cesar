import { ipcMain } from 'electron'
import { ZodError, type ZodTypeAny, type z } from 'zod'
import type { Result } from '@shared/ipc/contract'

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function fail(error: string): Result<never> {
  return { ok: false, error }
}

function mensajeError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map((i) => `${i.path.join('.') || 'valor'}: ${i.message}`).join('; ')
  }
  if (err instanceof Error) return err.message
  return 'Error desconocido'
}

/**
 * Registra un handler IPC validando la entrada con Zod y envolviendo la salida
 * en un Result. Los errores nunca se propagan crudos a través del puente.
 */
export function handle<S extends ZodTypeAny, O>(
  channel: string,
  schema: S,
  fn: (input: z.infer<S>) => O | Promise<O>
): void
export function handle<O>(channel: string, schema: null, fn: () => O | Promise<O>): void
export function handle(
  channel: string,
  schema: ZodTypeAny | null,
  fn: (input: unknown) => unknown
): void {
  ipcMain.handle(channel, async (_evento, raw) => {
    try {
      const input = schema ? schema.parse(raw) : undefined
      const data = await fn(input)
      return ok(data)
    } catch (err) {
      return fail(mensajeError(err))
    }
  })
}
