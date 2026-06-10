# Guía de uso — Herramienta de Presupuesto

**Cruz Roja Colombiana Seccional Cesar**

Esta guía explica, paso a paso, cómo usar la herramienta para comparar el presupuesto con la ejecución real a partir de las exportaciones de Siimed. No requiere conocimientos técnicos.

---

## 1. ¿Qué hace esta herramienta?

Permite:

1. **Cargar** el reporte contable que exporta Siimed (Libro Auxiliar).
2. **Agrupar** las cuentas contables en **áreas** (por ejemplo: Vacunación, Nómina, Infraestructura).
3. **Definir un presupuesto** anual y mensual para cada área o cuenta.
4. **Comparar** en un panel lo presupuestado contra lo realmente ejecutado, con gráficos y alertas.
5. **Generar informes en PDF** para presentar en juntas directivas.

---

## 2. Abrir la herramienta

La aplicación es **portable**: es un único archivo `Presupuesto CRC Cesar-…-portable.exe`. No necesita instalación.

1. Copie el archivo a su computador o a una memoria USB.
2. Haga doble clic para abrirlo.
3. La primera vez, Windows puede mostrar un aviso azul de seguridad ("Windows protegió su PC"). Haga clic en **Más información → Ejecutar de todas formas**. Esto ocurre porque la aplicación aún no tiene firma digital; es segura.

> **Datos en la USB:** si ejecuta la aplicación desde una memoria USB, sus datos (áreas, presupuestos y movimientos) se guardan **junto al `.exe`**, en la misma USB. Así puede llevar el programa y la información a otro computador. Asegúrese de que la USB no esté protegida contra escritura.

---

## 3. Conceptos clave

| Término | Significado |
|---|---|
| **Cuenta contable** | Cada código que viene de Siimed (ej. `41351503 VENTA VACUNAS`). Se crean solas al importar. |
| **Área** | Agrupación de cuentas que usted define (ej. "Vacunación" reúne varias cuentas). Es donde se fija el presupuesto. |
| **Presupuesto** | Lo planeado para un año, repartido por mes. Puede definirse por área y, opcionalmente, por cuenta. |
| **Ejecutado** | Lo realmente registrado en Siimed en el período (lo que entró o se gastó). |
| **Naturaleza** | Si el área/cuenta es de **Ingreso**, **Gasto** o **Costo**. Determina cómo se calcula la ejecución. |

---

## 4. Flujo recomendado (orden de los pasos)

```
1) Exportar el reporte desde Siimed
2) Importar el archivo a la herramienta
3) Crear las áreas y asignarles sus cuentas
4) Definir el presupuesto de cada área
5) Revisar el Dashboard y el Detalle
6) Generar el informe PDF para la junta
```

La primera vez se hace todo; en adelante, normalmente solo repetirá los pasos 2 (importar el nuevo período) y 5–6.

---

## 5. Paso a paso

### 5.1 Exportar desde Siimed

En Siimed, genere el reporte **"Libro Auxiliar - General"** del período deseado (por ejemplo, Enero 1 a Marzo 31) y expórtelo a **Excel (`.xlsx`)** o **CSV**. Guárdelo en su computador.

### 5.2 Importar a la herramienta

1. En el menú lateral, entre a **Importar**.
2. Haga clic en **Seleccionar archivo** y elija el archivo exportado de Siimed.
3. Aparece una **vista previa** con:
   - El período detectado y la cantidad de movimientos.
   - **Nuevos** y **Duplicados**: si vuelve a cargar un período ya importado, los repetidos no se duplican.
   - **Cuentas nuevas** detectadas (se crearán automáticamente).
   - **Sedes a importar**: el archivo de Siimed trae las tres sedes juntas; la herramienta las identifica por el prefijo del centro de costo (0001 Valledupar, 0002 Aguachica, 0003 Becerril). Marque o desmarque las sedes que desea cargar; solo se importarán los movimientos de las seleccionadas.
   - Una etiqueta verde **"Checksum verificado"** que confirma que los totales del archivo cuadran. Si aparece en ámbar, revise el archivo antes de continuar.
4. Haga clic en **Confirmar importación**.
5. Las importaciones quedan en el **Historial** (con sus sedes), donde puede eliminarlas si se equivocó de archivo.

> **Sedes:** si hoy importa solo Valledupar y mañana quiere añadir Aguachica del mismo archivo, vuelva a cargarlo y seleccione solo Aguachica: lo ya importado no se duplica.

### 5.3 Crear áreas y asignar cuentas

1. Entre a **Áreas y presupuestos**.
2. Haga clic en **Nueva área**. Escriba el nombre (ej. "Vacunación"), elija la **naturaleza** (Ingreso/Gasto/Costo) y un color. Guarde.
3. Seleccione el área en la lista de la izquierda.
4. Abajo verá **"Agregar cuentas a esta área"** con las cuentas sin asignar. Haga clic en cada cuenta que pertenezca al área.
   - También puede entrar a **"Cuentas sin asignar"** (al final de la lista) y asignarlas desde un menú desplegable.
5. Para quitar una cuenta de un área, use el botón **×** junto a la cuenta.

### 5.4 Definir el presupuesto

Con un área seleccionada, en la tarjeta **"Presupuesto del área"**:

1. Escriba el **monto anual** y pulse **Distribuir por igual** para repartirlo entre los 12 meses, **o** escriba manualmente el valor de cada mes (útil si el presupuesto no es parejo).
2. El **Total anual presupuestado** se calcula solo a partir de los meses.
3. Haga clic en **Guardar presupuesto**.

> **Dos niveles:** además del presupuesto del área, puede fijar un presupuesto **por cuenta** con el botón **Presupuesto** en cada fila de cuenta. Si un área no tiene presupuesto propio, la herramienta suma los presupuestos de sus cuentas.

### 5.5 Dashboard (panel principal)

Entre a **Dashboard**. Arriba elija el **período**: escriba las fechas o use los botones rápidos **Año**, **T1, T2, T3, T4** (trimestres).

Arriba también puede filtrar por **naturaleza** (Todas / Ingresos / Gastos / Costos).

Verá:
- **Indicadores**: Presupuestado, Ejecutado, % de ejecución y Disponible. Si está viendo solo ingresos, los títulos cambian a Meta de ingresos, Recaudado, % de la meta y Por recaudar / Superávit.
- **Semáforo de estados** (la lectura depende de la naturaleza):
  - Para **gastos/costos** el presupuesto es un límite: **En rango** (verde) · **En riesgo** (ámbar) · **Excedido** (rojo) · **Subejecución** (azul) · **Sin presupuesto** (gris).
  - Para **ingresos** el presupuesto es una meta: **Meta superada** (verde, ¡positivo!) · **En progreso** (verde) · **Recaudo bajo** (ámbar, la alerta real) · **Sin presupuesto** (gris). Recaudar más de la meta nunca se muestra en rojo.
- **Gráfico de barras**: presupuesto vs. ejecutado por área.
- **Evolución mensual**: cómo avanza el gasto/ingreso mes a mes.
- **Tabla por área** con barra de avance. Haga clic en cualquier fila para ir al **Detalle** de esa área.

### 5.6 Detalle por área

Entre a **Detalle por área** (o haga clic en un área desde el Dashboard).

- Elija el **área** y el **período** arriba.
- Verá los indicadores del área, la **lista de cuentas** con su ejecución y estado, y los **principales terceros** (a quién se le pagó o quién pagó).
- Haga clic en una **cuenta** para ver, abajo, todos sus **movimientos** (fecha, comprobante, tercero, detalle, valor). Use **"Ver todas"** para volver a ver todos los movimientos del área.

### 5.7 Generar informe PDF

1. Entre a **Informes**.
2. Elija el **período**.
3. Revise la **vista previa** (indicadores y comparativo por área).
4. Haga clic en **Generar PDF** y elija dónde guardarlo.
5. El PDF incluye portada con el período, indicadores, comparativo por área y un apartado de **áreas que requieren atención** (excedidas o en riesgo), listo para presentar.

### 5.8 Configuración

En **Configuración** puede ajustar:
- **Año activo**: el año sobre el que se trabaja.
- **Umbral de riesgo (%)**: a partir de qué porcentaje de ejecución un área se marca **En riesgo** (por defecto 85%).
- **Umbral de bajo uso (%)**: por debajo de qué porcentaje se marca **Subejecución** (por defecto 30%).

---

## 6. Datos: guardado, copias y respaldo

- **Guardado automático:** todo cambio se guarda solo. Arriba a la derecha verá la hora del último guardado.
- **Guardar copia:** botón **Guardar copia** (arriba a la derecha) para exportar un respaldo de todos sus datos a un archivo `.crcpresupuesto`. Úselo periódicamente.
- **Abrir:** botón **Abrir** para cargar un archivo `.crcpresupuesto` guardado antes (por ejemplo, para retomar el trabajo en otro computador).

> **Recomendación:** al cerrar un trimestre, use **Guardar copia** y guarde el archivo en un lugar seguro (carpeta de respaldos o la nube).

---

## 7. Preguntas frecuentes

**¿Puedo importar varios períodos?**
Sí. Importe cada exportación de Siimed; los movimientos se acumulan. Si reimporta un período, no se duplican.

**Importé un archivo equivocado, ¿cómo lo deshago?**
En **Importar → Historial de importaciones**, elimine esa importación con el ícono de papelera. Se borran solo los movimientos de ese archivo.

**Una cuenta quedó en el área equivocada.**
En **Áreas y presupuestos**, quítela con el botón **×** y asígnela al área correcta.

**El % de ejecución pasa de 100%.**
Significa que lo ejecutado superó lo presupuestado: el área aparece como **Excedido** (rojo) y el "Disponible" será negativo.

**¿Qué pasa si una cuenta no está en ningún área?**
Su ejecución no entra en el comparativo por área. En el Dashboard aparece como "Sin área". Asígnela para incluirla.

**Aparece "Checksum con diferencias" al importar.**
Los totales calculados no coinciden con los del reporte de Siimed. Verifique que el archivo esté completo y sea el reporte correcto antes de confirmar.

---

## 8. Soporte

Ante cualquier comportamiento inesperado, use **Guardar copia** para respaldar sus datos y conserve el archivo de Siimed que estaba importando; eso facilita revisar el problema.
