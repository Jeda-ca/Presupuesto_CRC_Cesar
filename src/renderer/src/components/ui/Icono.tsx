import type { JSX } from 'react'

export type NombreIcono =
  | 'dashboard'
  | 'importar'
  | 'areas'
  | 'detalle'
  | 'informes'
  | 'config'
  | 'guardar'
  | 'abrir'
  | 'nuevo'
  | 'mas'
  | 'editar'
  | 'eliminar'
  | 'alerta'
  | 'cerrar'
  | 'chevron'
  | 'check'

const PATHS: Record<NombreIcono, JSX.Element> = {
  dashboard: <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />,
  importar: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />,
  areas: <path d="M4 5h16M4 12h16M4 19h10" />,
  detalle: <path d="M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01" />,
  informes: <path d="M7 3h7l5 5v13H7V3Zm7 0v5h5M9 13h6M9 17h6" />,
  config: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.1-1.3l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.3-1.3L14.7 2h-3.4l-.3 2.7A8 8 0 0 0 8.7 6L6.4 5l-2 3.4 2 1.5A8 8 0 0 0 6.3 12a8 8 0 0 0 .1 1.3l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2.3 1.3l.3 2.7h3.4l.3-2.7a8 8 0 0 0 2.3-1.3l2.3 1 2-3.4-2-1.5A8 8 0 0 0 20 12Z" />
  ),
  guardar: <path d="M5 3h11l3 3v15H5V3Zm3 0v6h7V3M8 21v-7h8v7" />,
  abrir: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  nuevo: <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10l-7-7Zm0 0v7h7" />,
  mas: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4" />,
  eliminar: <path d="M4 7h16M9 7V4h6v3m-7 0v13h8V7M10 11v6M14 11v6" />,
  alerta: <path d="M12 3 2 21h20L12 3Zm0 6v6m0 3v.01" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 13 4 4L19 7" />
}

export function Icono({
  nombre,
  className = 'w-5 h-5'
}: {
  nombre: NombreIcono
  className?: string
}): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[nombre]}
    </svg>
  )
}
