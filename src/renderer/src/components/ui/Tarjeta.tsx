import type { JSX, ReactNode } from 'react'

export function Tarjeta({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function TarjetaTitulo({
  children,
  accion
}: {
  children: ReactNode
  accion?: ReactNode
}): JSX.Element {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <h3 className="text-sm font-semibold text-slate-700">{children}</h3>
      {accion}
    </div>
  )
}
