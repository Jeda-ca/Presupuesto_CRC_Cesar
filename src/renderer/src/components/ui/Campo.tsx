import type { JSX, ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react'

export function Campo({
  etiqueta,
  children,
  ayuda
}: {
  etiqueta: string
  children: ReactNode
  ayuda?: string
}): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{etiqueta}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-slate-400">{ayuda}</span>}
    </label>
  )
}

const BASE_INPUT =
  'w-full h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-crc-500 focus:ring-2 focus:ring-crc-100'

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  const { className = '', ...rest } = props
  return <input className={`${BASE_INPUT} ${className}`} {...rest} />
}

export function Selector(props: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  const { className = '', ...rest } = props
  return <select className={`${BASE_INPUT} bg-white ${className}`} {...rest} />
}
