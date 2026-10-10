# Especificaciones funcionales del dashboard

Este documento reúne las tres funcionalidades solicitadas para el dashboard. Los nombres de parámetros y campos entre código se mantienen según el contrato de la API; las etiquetas de producto se expresan en español.

## 1. Filtro de rango de fechas en el dashboard principal

### Objetivo

Permitir acotar los movimientos y métricas del dashboard principal a un rango de fechas, mostrando también los límites temporales disponibles en los datos.

### Interfaz y comportamiento

- Añadir dos controles de fecha: **Fecha de inicio** y **Fecha de fin**.
- Ambos son opcionales y usan el formato de calendario `YYYY-MM-DD`.
- Si uno o ambos controles están vacíos, no se envía el parámetro correspondiente. Si ambos están vacíos, se muestran todos los datos disponibles.
- Mostrar junto a los controles el rango disponible, obtenido de `min_date` y `max_date` de facets. El rango se presenta como información de referencia; los límites reales provienen de la API, no de fechas codificadas en la interfaz.
- Las fechas seleccionadas filtran el dashboard principal de forma inclusiva: el día de inicio y el día de fin forman parte del rango.
- Validar que, cuando ambas fechas estén informadas, la fecha de inicio no sea posterior a la fecha de fin. No enviar un rango invertido.
- Al modificar o limpiar una fecha, actualizar los datos y mantener visibles los controles y sus valores actuales. Los estados de carga y error deben distinguirse del resultado vacío.

### Contrato de datos

1. `GET /api/metrics/facets` devuelve `min_date` y `max_date` (`YYYY-MM-DD`), además de los conjuntos disponibles `operation_types`, `business_types` y `categories`. Este endpoint no admite parámetros de filtro.
2. `GET /api/metrics` devuelve movimientos y acepta `start_date` y `end_date` opcionales, inclusivos y con formato de fecha ISO `YYYY-MM-DD`.
3. La respuesta de `/api/metrics` contiene movimientos, no KPIs ya agregados. El dashboard conserva sus cálculos actuales a partir de los movimientos filtrados.

### Criterios de aceptación

- Con ambos campos vacíos, la consulta no incluye `start_date` ni `end_date` y se muestran todos los datos devueltos.
- Una fecha informada se envía bajo el nombre de parámetro correspondiente y con formato `YYYY-MM-DD`.
- Los límites mostrados junto a los controles corresponden a `facets.min_date` y `facets.max_date`.
- El rango es inclusivo y uno invertido se valida antes de consultar.
- Limpiar ambos campos restaura la vista sin restricción de fechas.

## 2. Tabla de alertas de gastos

### Objetivo

Mostrar, debajo de las gráficas del dashboard principal, los periodos en los que los gastos exceden el umbral proporcional seleccionado, junto a su contexto de periodos anteriores.

### Interfaz y comportamiento

- Presentar una tabla con las columnas: **Periodo**, **Gastos del periodo**, **Promedio histórico de gastos anteriores** e **Incremento porcentual**.
- Añadir un control de umbral que acepte razones proporcionales desde `0.01` hasta `1.0`, inclusive, con valor inicial `0.3` (30 %). La interfaz puede mostrar el valor como porcentaje, pero la consulta envía una razón: por ejemplo, `30 %` se envía como `0.3`.
- Aplicar a las alertas las fechas activas en el filtro del dashboard principal. Si las fechas están vacías, omitir ambos parámetros y considerar todos los datos.
- Si la consulta devuelve `[]`, mostrar un estado vacío explícito, por ejemplo: “No hay alertas de gastos para el rango y el umbral seleccionados”. No presentarlo como error.
- Formatear los importes como moneda y `increase_ratio` como porcentaje multiplicándolo por 100 una sola vez. El periodo debe conservar el formato que corresponda a la agrupación (`YYYY-MM` por defecto mensual).

### Contrato de datos y discrepancia conocida

- Endpoint: `GET /api/metrics/alerts`.
- Parámetros disponibles: `threshold` (default API `0.3`, mínimo API `0`), `group_by` (`day|week|month`, default `month`), `start_date`, `end_date` y `business_type` (`B2B|B2C`). El dashboard envía las fechas seleccionadas y el umbral; si no se define otro control de agrupación, usa el default mensual.
- Cada elemento de respuesta contiene `period`, `outcome_total`, `baseline_average` e `increase_ratio`. En la presentación, `outcome` significa gastos; `increase_ratio` es una razón proporcional.
- **Decisión para esta versión:** la columna muestra `baseline_average` con la etiqueta **Promedio histórico de gastos anteriores**. El backend calcula el promedio de todos los periodos anteriores del resumen filtrado; no es una media móvil de tres periodos. Se prioriza el contrato verificable de la API y no se presenta este valor con una semántica distinta.
- El umbral solicitado por producto (`0.01`–`1.0`) es más restrictivo que el mínimo API (`0`). La validación de interfaz debe aplicar el rango de producto sin afirmar que esos límites los impone la API.

### Criterios de aceptación

- El valor inicial es `0.3`; solo se aceptan valores del intervalo inclusivo `0.01`–`1.0` en la interfaz.
- La consulta usa `threshold` como razón proporcional y propaga las fechas seleccionadas cuando existan.
- Los gastos de la fila proceden de `outcome_total`; la columna de incremento representa `increase_ratio × 100`.
- La columna de promedio muestra `baseline_average` y se identifica como promedio histórico acumulado de periodos anteriores, no como ventana móvil de tres.
- Se muestra un estado vacío explícito cuando no hay alertas y estados diferenciados para carga y error.

## 3. Página comparativa B2B vs B2C

### Objetivo

Ofrecer una página para comparar los ingresos de los segmentos B2B y B2C en un rango de fechas común, tanto por principales categorías como en un gráfico de totales.

### Interfaz y comportamiento

- Añadir una página o vista identificable como **Comparativa B2B vs B2C**.
- Incluir un filtro de fechas compartido para ambos segmentos. Las fechas usan `YYYY-MM-DD`, son inclusivas y pueden quedar vacías para abarcar todos los datos disponibles.
- Presentar en paralelo una tabla B2B y una tabla B2C. Cada tabla lista hasta cinco categorías principales de **ingresos**, con: nombre de categoría, total de ingresos de esa categoría y porcentaje del total de ingresos del segmento para el rango seleccionado.
- Presentar un gráfico comparativo de los ingresos totales B2B y B2C para el mismo rango. El valor del gráfico debe representar ingresos (`income`), no neto ni ingresos más gastos.
- Usar las categorías disponibles de `GET /api/metrics/facets` como referencia para etiquetas/filtros; facets devuelve categorías globales y no una lista separada por segmento.
- Mantener los filtros, periodos y unidades consistentes entre tablas y gráfico. Diferenciar los estados sin datos de carga y error.

### Contrato de datos y cálculo

1. Obtener categorías principales con `GET /api/metrics/categories/top`, usando `operation_type=income`, `limit=5`, las fechas seleccionadas y `business_type=B2B` o `business_type=B2C`. Se requieren dos solicitudes, una por segmento.
2. Cada respuesta es una lista ordenada por `total_amount` descendente; un elemento contiene `category`, `operation_type` y `total_amount`. Puede devolver menos de cinco elementos.
3. El endpoint no devuelve el total de ingresos del segmento ni un porcentaje por categoría. Para cumplir la presentación, el denominador se define como la suma de los importes de todos los movimientos `income` del segmento en el rango seleccionado; el porcentaje de una categoría es `total_amount / total_ingresos_del_segmento × 100`.
4. El endpoint top devuelve solo hasta cinco categorías, por lo que no se debe usar la suma de esas cinco filas como denominador. Obtener los movimientos completos de cada segmento mediante `GET /api/metrics?operation_type=income&business_type=<B2B|B2C>` y añadir las fechas seleccionadas cuando existan. Usar esos movimientos para el total de ingresos del gráfico y el denominador de los porcentajes. Si el total del segmento es cero, indicar que el porcentaje no está disponible (no dividir por cero).
5. La suma puede calcularse en la capa de lógica financiera del frontend; no atribuir esos totales o porcentajes a los campos de la respuesta de top categories.
6. Consultar `GET /api/metrics/facets` para las categorías y los límites globales `min_date`/`max_date`. Facets no acepta `business_type`, fechas ni otros filtros; por tanto, sus categorías no representan disponibilidad específica de cada segmento.

### Decisiones cerradas para esta especificación

- Las fechas vacías significan todos los datos disponibles. Cuando hay una sola fecha, se envía únicamente ese límite y el backend aplica el otro extremo abierto.
- Las dos tablas usan la lista top-five agregada, mientras que el gráfico y el denominador de porcentajes usan movimientos completos filtrados por `operation_type=income` y segmento.
- La tabla de alertas presenta el `baseline_average` contractual como **Promedio histórico de gastos anteriores**. Se descarta para esta versión el wording de media móvil de tres periodos porque no coincide con el cálculo vigente de la API.
- El umbral de alertas es un control de porcentaje entero del 1 % al 100 % (paso de 1 %), convertido a razón decimal antes de enviarlo; default 30 % (`0.3`). Así se evita que la UI sugiera precisión inferior a la que especifica el brief.

### Criterios de aceptación

- Las tablas solicitan `operation_type=income`, `limit=5` y el `business_type` correcto para cada lado.
- Las dos tablas y el gráfico comparten el mismo rango de fechas.
- Las filas se ordenan por `total_amount` descendente y muestran categoría, importe y porcentaje del total de ingresos de su segmento.
- El porcentaje usa el total de todos los ingresos del segmento, no el subtotal de las cinco categorías principales.
- El gráfico compara ingresos totales B2B y B2C; no usa los agregados de top-five como si fueran el total.
- Un segmento sin movimientos tiene un estado vacío explícito y no produce porcentajes inválidos.

## Referencias del contrato

- Tipos de respuesta: [`api-types.ts`](./api-types.ts).
- Tipos de parámetros: [`param-types.ts`](./param-types.ts).
- Especificaciones detalladas previas: [`../specs/top-categories.md`](../specs/top-categories.md), [`../specs/outcome-alerts.md`](../specs/outcome-alerts.md) y [`../specs/period-comparison.md`](../specs/period-comparison.md).
