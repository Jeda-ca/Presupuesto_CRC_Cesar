import type { ButtonHTMLAttributes, JSX } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type Tam = 'sm' | 'md'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-crc-600 text-white hover:bg-crc-700 disabled:bg-crc-200',
  secundario: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'text-slate-600 hover:bg-slate-100'
}

const TAMS: Record<Tam, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2'
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tam?: Tam
}

export function Boton({
  variante = 'primario',
  tam = 'md',
  className = '',
  ...props
}: Props): JSX.Element {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${VARIANTES[variante]} ${TAMS[tam]} ${className}`}
      {...props}
    />
  )
}
