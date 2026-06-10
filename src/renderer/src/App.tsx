import { useEffect, useState, type JSX } from 'react'
import { useAppStore } from './store/appStore'
import { AppLayout } from './components/AppLayout'
import { Toasts } from './components/Toasts'
import { SedeSelectorPage } from './pages/SedeSelectorPage'
import { DashboardPage } from './pages/DashboardPage'
import { ImportarPage } from './pages/ImportarPage'
import { AreasPage } from './pages/AreasPage'
import { DetallePage } from './pages/DetallePage'
import { InformesPage } from './pages/InformesPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'

function VistaActual(): JSX.Element {
  const vista = useAppStore((s) => s.vista)
  switch (vista) {
    case 'dashboard':
      return <DashboardPage />
    case 'importar':
      return <ImportarPage />
    case 'areas':
      return <AreasPage />
    case 'detalle':
      return <DetallePage />
    case 'informes':
      return <InformesPage />
    case 'configuracion':
      return <ConfiguracionPage />
    default:
      return <DashboardPage />
  }
}

export function App(): JSX.Element {
  const cargarInicial = useAppStore((s) => s.cargarInicial)
  const sedeActiva = useAppStore((s) => s.sedeActiva)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarInicial()
      .then(() => setListo(true))
      .catch((e: Error) => setError(e.message))
  }, [cargarInicial])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-red-600">
        Error al iniciar: {error}
      </div>
    )
  }

  if (!listo) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Cargando espacio de trabajo...
      </div>
    )
  }

  if (!sedeActiva) {
    return (
      <>
        <SedeSelectorPage />
        <Toasts />
      </>
    )
  }

  return (
    <>
      <AppLayout>
        <VistaActual />
      </AppLayout>
      <Toasts />
    </>
  )
}
