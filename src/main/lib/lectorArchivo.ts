import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import * as XLSX from 'xlsx'
import type { Celda } from './siimedParser'

/** Parser CSV tolerante: separador `;`, comillas opcionales y saltos CRLF/LF. */
export function parsearCSV(texto: string): string[][] {
  const filas: string[][] = []
  let campo = ''
  let fila: string[] = []
  let enComillas = false

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]
    if (enComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          enComillas = false
        }
      } else {
        campo += ch
      }
      continue
    }
    if (ch === '"') enComillas = true
    else if (ch === ';') {
      fila.push(campo)
      campo = ''
    } else if (ch === '\n') {
      fila.push(campo)
      filas.push(fila)
      fila = []
      campo = ''
    } else if (ch !== '\r') {
      campo += ch
    }
  }
  if (campo !== '' || fila.length > 0) {
    fila.push(campo)
    filas.push(fila)
  }
  return filas
}

const REEMPLAZO = 0xfffd

function decodificar(buf: Buffer): string {
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.toString('utf-8')
  }
  const utf8 = buf.toString('utf-8')
  for (let i = 0; i < utf8.length; i++) {
    if (utf8.charCodeAt(i) === REEMPLAZO) return buf.toString('latin1')
  }
  return utf8
}

/** Lee un archivo CSV o XLSX y devuelve la matriz de celdas para el parser. */
export function leerMatriz(ruta: string): Celda[][] {
  const ext = extname(ruta).toLowerCase()
  if (ext === '.csv' || ext === '.txt') {
    return parsearCSV(decodificar(readFileSync(ruta)))
  }
  const libro = XLSX.read(readFileSync(ruta), { type: 'buffer', cellDates: true })
  const hoja = libro.Sheets[libro.SheetNames[0]]
  if (!hoja) return []
  return XLSX.utils.sheet_to_json(hoja, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: true
  }) as Celda[][]
}
