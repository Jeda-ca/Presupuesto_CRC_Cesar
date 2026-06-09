# Presupuesto CRC Cesar

Herramienta de escritorio para el seguimiento del presupuesto de la Cruz Roja Colombiana Seccional Cesar. Toma las exportaciones contables de **Siimed Cloud** (reporte "Libro Auxiliar - General"), las procesa y compara lo **presupuestado** contra lo **ejecutado real** por área, con dashboards, drill-down e informes PDF.

## Stack

- **Electron** + **electron-vite** (empaquetado en `.exe` portable)
- **React 19** + **TypeScript** + **Tailwind CSS v4**
- **Zod** (validación en todas las rutas IPC)
- **SheetJS (xlsx)** (lectura de Excel/CSV de Siimed)
- **Recharts** (gráficos) · **Zustand** (estado)
- Persistencia: archivo JSON de espacio de trabajo (sin base de datos)

## Requisitos

- Node.js 20+ (probado en Node 24)
- Windows para generar el ejecutable portable

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # ejecutar en modo desarrollo
npm run typecheck    # verificar tipos (main + renderer), debe dar 0 errores
npm run test         # pruebas unitarias (parser, cálculo, informe)
npm run build        # compilar main/preload/renderer a out/
npm run build:win    # typecheck + build + empaquetar .exe portable en release/
```

El resultado es un **único `.exe` portable** en `release/Presupuesto CRC Cesar-<versión>-portable.exe` (~73 MB), transportable y autocontenido: al ejecutarlo se descomprime en una carpeta temporal y arranca.

> **Empaquetado en Windows — caché winCodeSign:** electron-builder extrae una caché (`winCodeSign`) que contiene enlaces simbólicos de macOS. Crear symlinks en Windows exige un privilegio especial, así que la primera vez puede fallar con _"El cliente no dispone de un privilegio requerido"_. Elija **una** de estas opciones:
>
> - **Opción A (recomendada, sin admin):** ejecute una vez `npx electron-builder --win` (fallará al extraer winCodeSign), luego `powershell -ExecutionPolicy Bypass -File scripts\preparar-wincodesign.ps1` y finalmente `npm run build:win`. El script extrae la caché omitiendo la carpeta `darwin` (innecesaria en Windows).
> - **Opción B:** active el **Modo de desarrollador** (Configuración → Privacidad y seguridad → Para programadores) o use una terminal **como administrador**, y ejecute `npm run build:win`.
>
> La compilación (`npm run build`) y las pruebas no requieren ninguno de estos permisos.

## Arquitectura

```
src/
  main/         Proceso principal (backend)
    infra/      Persistencia (store JSON atómico) y rutas de archivo
    repositories/  Acceso a datos puro sobre el store
    services/   Lógica de negocio (import, presupuesto, dashboard, reporte)
    ipc/        Rutas IPC con validación Zod (envoltura Result)
    lib/        Parser Siimed, montoCO, fechas, cálculo presupuesto, informe HTML
  preload/      Puente seguro contextBridge -> window.api
  renderer/     Interfaz React (páginas, componentes, store)
  shared/       Esquemas Zod + tipos de dominio + contrato IPC (fuente única)
```

Separación estricta: **repositorios (consultas puras) → servicios (lógica) → rutas IPC (validación Zod)**. Los tipos de dominio se derivan de los esquemas Zod con `z.infer` para evitar divergencias.

## Formato Siimed (parser)

El parser de `src/main/lib/siimedParser.ts`:

- Detecta el encabezado por ancla (`CUENTA`), no por posición fija.
- Interpreta números colombianos (`30.000,00`, negativos entre paréntesis) y fechas `2026/01/24`.
- Separa filas de apertura, movimiento y total; clasifica la naturaleza por PUC (4=ingreso, 5=gasto, 6/7=costo).
- Valida los totales por cuenta y el `Grand Total` como **checksum** de integridad; nunca carga datos corruptos en silencio.
- Deduplica por `comprobante + cuenta`, por lo que reimportar períodos solapados es idempotente.

## Seguridad

- `contextIsolation: true`, `nodeIntegration: false`, sin navegación externa, Content-Security-Policy por sesión.
- Toda entrada IPC se valida con Zod. Los nombres de área se escapan al generar el HTML del informe.
- **Nota de dependencia:** `xlsx@0.18.5` (registro npm) tiene vulnerabilidades conocidas. Los archivos provienen de una fuente de confianza (Siimed del usuario), pero se recomienda migrar a la distribución oficial de SheetJS en una iteración futura.

## Datos

El espacio de trabajo se guarda automáticamente en la carpeta de datos de usuario (`workspace.crcpresupuesto`). Use "Guardar copia" para exportar un respaldo y "Abrir" para cargar otro espacio.
