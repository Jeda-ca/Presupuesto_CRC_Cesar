import type { Result } from '@shared/ipc/contract'

export const api = window.api

/**
 * Desempaqueta un Result: devuelve los datos o lanza con el mensaje de error
 * para que las vistas lo manejen con try/catch o react-query.
 */
export async function unwrap<T>(promesa: Promise<Result<T>>): Promise<T> {
  const resultado = await promesa
  if (!resultado.ok) throw new Error(resultado.error)
  return resultado.data
}
