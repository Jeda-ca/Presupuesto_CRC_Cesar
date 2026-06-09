import { randomUUID, createHash } from 'node:crypto'

export function nuevoId(): string {
  return randomUUID()
}

export function hashEstable(...partes: string[]): string {
  return createHash('sha1').update(partes.join('')).digest('hex')
}
