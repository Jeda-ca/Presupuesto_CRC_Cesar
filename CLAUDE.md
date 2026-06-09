# Contexto del Proyecto: Herramienta para el manejo del presupuesto de la Cruz Roja Cesar

## Contexto de lo que se va desarrollar
### OBJETIVO
Crear una herramienta que facilite hacer seguimiento del presupuesto de la Cruz Roja Colombiana seccional Cesar por medio de informes, gráficos, dashboards, etc… que comparen lo presupuestado con lo usado realmente en determinado rango de fechas.

### Contexto
La Cruz Roja Colombiana seccional Cesar ya tiene una herramienta contable (Siimed Cloud) que les permite llevar un registro contable (diario, mensual, anual, etc..) de lo que entra, sale, se presupuesta, se factura, etc… en la empresa. Siimed permite exportar dicho reporte detallado seleccionándolo por cuentas contables y exportando cada registro ingresado; todo pasa por ahí, ahí hacen el registro de cada gasto, cada compra, cada ingreso, cada venta, servicio, cada factura, etc… y seleccionando que cuentas contables se exportan cada uno. (Te anexaré un ejemplo de cómo siimed exporta esos datos usando de ejemplo las cuentas contables correspondientes a ingresos).

### Problema
Sin embargo, la dirección ejecutiva necesita una herramienta que les permita tomar dichas exportaciones hechas desde siimed, subirlas a la herramienta y que se permita generar informes, gráficos, diagramas, dashboards, etc… comparando o estudiando esos registros exportados vs lo esperado y presupuestado para ciertas áreas de la empresa, por ejemplo: vacunación, infraesctructa, pago de servicios, nomina, etc…

### Funcionalidades de la herramienta
- Se deben poder crear las diferentes cuentas y establecer un presupuesto anual y por ende mensual para cada una de ellas, también podríamos llamar a eso diferentes áreas de la empresa.
- Se debe poder subir el archivo en formato Excel que exporta siimed, entender los datos, procesarlos y añadirlos al sistema.
- Debe haber un panel modulo con dashboard que se alimentará de los datos que se le proporcionen a la herramienta, así mismo podrá establecerse el periodo con el cual se comparará con el presupuesto, brindará gráficos, información relevante y también permitir exportar informes y reportes comparando con el presupuesto que se puedan presentar en juntas y permitan tomar decisiones.
- Debe poder detallar cada concepto/cuenta hacía donde se dirigió el dinero o a donde debería ir, cuales están en riesgo, cuales ya excedieron presupuesto, cuales tienen un historial de poco uso, etc…

### Infraestructura de la herramienta
- Debe haber persistencia de los datos que maneje la herramienta, pero no la manejaremos con base de datos ya que deber una herramienta ligera, compacta y portable.
- Estaba pensando en construirla con html y empaquetarla en un .exe portable con electron, sin embargo, si hay mejores alternativas, más competentes para este proyecto, sería bueno evaluarlas y usarlas.

## Stack Tecnológico
Aún sin definir

## REGLAS DE ORO (INSTRUCTIVOS OBLIGATORIOS PARA LA IA)

1. **CERO SUPOSICIONES:** - Antes de escribir o sugerir código, recuerda tener en cuenta los archivos relevantes. 

2. **MODIFICACIONES SEGURAS Y ATÓMICAS:**
   - No hagas refactorizaciones masivas en múltiples directorios sin autorización explícita.
   - Genera código limpio, sin comentarios decorativos excesivos, sin emojis y pensado no en proyecto experimental sino lo suficientemente competente y seguro para un entorno de producción real.
   - Respeta la arquitectura del backend: Consultas puras en repositorios (con paginación y transacciones si se llegan a diseñar), lógica en servicios, validación con Zod en rutas.
   - No hagas cambios hasta tener un 90% de confianza en lo que hay que construir.

3. **OPTIMIZACIÓN DE RESPUESTAS (TOKEN SAVING):**
   - Sé conciso. No expliques paso a paso lo que vas a hacer a menos que el usuario pida una explicación, simplemente puedes dejar pequeñas notación de puntos claves.
   - Si se te pide modificar un archivo, aplica los cambios directamente usando tus herramientas o devuelve el bloque de código modificado exacto. Evita preámbulos innecesarios.
   - Si detectas que falta información, pide al usuario permiso para buscar en el directorio o pregunta directamente. No inventes nombres de variables.

4. **SIN SOLUCIONES PROVISIONALES:**
   - **Nunca implementes workarounds, parches rápidos ni soluciones "temporales".** Si la solución correcta es compleja, dilo y planifícala antes de codificar.
   - **Nunca sacrifiques seguridad por conveniencia de implementación.** Si la solución conveniente introduce una vulnerabilidad, no es una solución válida.
   - Cuando detectes deuda técnica o un problema de fondo al resolver algo puntual, señálalo explícitamente antes de proceder. No lo dejes enterrado.
   - Evalúa de ser necesario algunos vectores de ataque (XSS, CSRF, IDOR, inyección, exposición de datos). Referencia: OWASP Top 10.
   - `tsc --noEmit` con 0 errores es condición obligatoria antes de declarar cualquier tarea terminada.
ente. No inventes nombres de variables.

5. **ESTRUCTURA DEL PROYECTO**
    - **Organización de ficheros y directorios** La estrucutra que debe tener todo el proyecto debe una competente que respete los buenos habitos de diseño y se alinie con las estructuras usadas actualmente en el mercado.