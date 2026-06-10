import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type Api } from '@shared/ipc/contract'

const C = IPC_CHANNELS

const api: Api = {
  app: {
    version: () => ipcRenderer.invoke(C.app.version)
  },
  workspace: {
    estado: () => ipcRenderer.invoke(C.workspace.estado),
    nuevo: () => ipcRenderer.invoke(C.workspace.nuevo),
    abrir: () => ipcRenderer.invoke(C.workspace.abrir),
    guardarComo: () => ipcRenderer.invoke(C.workspace.guardarComo)
  },
  config: {
    obtener: () => ipcRenderer.invoke(C.config.obtener),
    actualizar: (input) => ipcRenderer.invoke(C.config.actualizar, input)
  },
  areas: {
    listar: () => ipcRenderer.invoke(C.areas.listar),
    crear: (input) => ipcRenderer.invoke(C.areas.crear, input),
    actualizar: (input) => ipcRenderer.invoke(C.areas.actualizar, input),
    eliminar: (id) => ipcRenderer.invoke(C.areas.eliminar, id)
  },
  cuentas: {
    listar: () => ipcRenderer.invoke(C.cuentas.listar),
    asignarArea: (input) => ipcRenderer.invoke(C.cuentas.asignarArea, input)
  },
  presupuestos: {
    listarPorAnio: (anio) => ipcRenderer.invoke(C.presupuestos.listarPorAnio, anio),
    guardar: (input) => ipcRenderer.invoke(C.presupuestos.guardar, input),
    eliminar: (id) => ipcRenderer.invoke(C.presupuestos.eliminar, id)
  },
  importacion: {
    previsualizar: () => ipcRenderer.invoke(C.importacion.previsualizar),
    confirmar: (input) => ipcRenderer.invoke(C.importacion.confirmar, input),
    descartar: (token) => ipcRenderer.invoke(C.importacion.descartar, token),
    listar: () => ipcRenderer.invoke(C.importacion.listar),
    eliminar: (id) => ipcRenderer.invoke(C.importacion.eliminar, id)
  },
  dashboard: {
    resumen: (query) => ipcRenderer.invoke(C.dashboard.resumen, query),
    detalleArea: (query) => ipcRenderer.invoke(C.dashboard.detalleArea, query)
  },
  movimientos: {
    listar: (query) => ipcRenderer.invoke(C.movimientos.listar, query)
  },
  reporte: {
    generarPdf: (query) => ipcRenderer.invoke(C.reporte.generarPdf, query)
  }
}

contextBridge.exposeInMainWorld('api', api)
