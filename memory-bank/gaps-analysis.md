# Gaps de Cobertura — Skills Comunitarias vs Proyecto

**Fecha:** 2026-11-17 03:50 UTC  
**Rama:** feature/agent-skills  
**Análisis de:** Gaps específicos que las 4 skills instaladas no cubren completamente

---

## Gaps Identificados (Críticos & Mejorables)

### 1. **Testing Strategy & Coverage** ⚠️ CRÍTICO
**Por qué las skills no lo cubren bien:**
- Accessibility, Vercel React Best Practices, TypeScript (Advanced + Best Practices) se enfocan en correctness, performance y code quality.
- Ninguna establece estrategia de testing transversal (backend + frontend, integración, e2e).

**Gap específico del proyecto:**
- **Backend:** 9 endpoints API (`/health`, `/api/metrics`, `/api/metrics/facets`, `/api/metrics/summary`, `/api/metrics/categories/top`, `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/b2b`, `/api/metrics/b2c`)
  - `test_routes.py` cubre solo ~30% de la lógica (5-6 tests en 204 líneas)
  - Endpoints de comparación, alertas, B2B/B2C segmentación **sin cobertura de tests**
  - Sin tests para validación de entrada (filtros malformados, fechas inválidas)
  - Sin tests para edge cases (rango de fechas vacío, categorías inválidas)

- **Frontend:** 81 líneas en `App.tsx`, 5 tests pasando
  - Tests solo cubren `financial-utils.ts` (computación de métricas)
  - **Sin tests para:**
    - Componentes del dashboard (DashboardHeader, KPIRow, gráficos)
    - Manejo de errores en fetch (timeout, 404, 500)
    - Estados de carga/error en UI
    - Comportamiento async en useEffect

- **Integration:** Sin e2e tests (Cypress, Playwright)
  - No valida flujo completo: fetch → computación → render

**Recomendación:** Crear skill personalizada de **Testing Strategy (Backend + Frontend + E2E)** que cubre:
- pytest patterns para FastAPI (fixtures, parametrización, edge cases)
- Vitest patterns para React hooks y componentes
- E2E patterns con Playwright o Cypress

---

### 2. **Error Handling & Resilience** ⚠️ ALTO
**Por qué las skills no lo cubren bien:**
- Vercel React Best Practices enfatiza optimización de rendimiento, no manejo de fallos
- TypeScript skills manejan tipado, no semántica de errores

**Gap específico del proyecto:**

- **Backend (`app/routes.py`):**
  - Generación de datos aleatorios global: `random.seed(42)` muta estado global
  - Sin validación explícita de rango de fechas (¿qué pasa si `start_date > end_date`?)
  - Sin documentación de códigos de error HTTP (¿400 vs 422?)
  - Sin logging estructurado (logs en desarrollo vs producción)

- **Frontend (`App.tsx`):**
  - Catch genérico: `catch { }` sin logging del error específico
  - Mensaje de error hardcoded en español, sin fallback
  - Sin retry logic para fallos de red transitorios
  - Sin timeout para requests (fetch puede "colgar" indefinidamente)
  - Sin validación de datos recibidos (¿qué si API devuelve formato incorrecto?)

**Recomendación:** Crear skill personalizada de **Error Handling & Resilience** que cubre:
- Validación de entrada en FastAPI (Pydantic, range checks)
- Logging estructurado (stdlib logging con niveles)
- Retry patterns con backoff exponencial
- Timeout y circuit breaker
- Error boundaries en React

---

### 3. **API Documentation & Contract** 🔴 CRÍTICO
**Por qué las skills no lo cubren bien:**
- Ninguna skill comunitaria específica cubre documentación API y contratos cliente-servidor
- Vercel React está enfocada en frontend, no en contrato entre servicios

**Gap específico del proyecto:**

- **API Contracts:**
  - 9 endpoints definidos, pero sin documentación clara de:
    - Parámetros opcionales vs requeridos
    - Rango válido de valores (ej: `start_date < end_date`)
    - Significado de campos (`business_type: "B2B" | "B2C"` - ¿qué es cada uno en contexto financiero?)
  - OpenAPI generado por FastAPI (`/docs`), pero sin ejemplos reales

- **Frontend-Backend Mismatch:**
  - Frontend consume solo `/api/metrics`, pero existen 8 endpoints más sin consumidor
  - Filtros aceptados por API no están disponibles en UI (categoría, fecha, tipo operación)
  - Semántica de `outcome` vs `income` asumida en frontend, no validada contra backend

- **Type Safety:**
  - `FinancialMovement`, `KPIMetrics`, etc., definidos en ambos lados (Python + TypeScript)
  - **Sin sincronización automática:** cambio en backend requiere cambio manual en frontend
  - Sin generador de tipos (OpenAPI → TypeScript)

**Recomendación:** Crear skill personalizada de **API Contract & Codegen** que cubre:
- OpenAPI schema validation
- TypeScript/Python codegen desde OpenAPI
- Contract testing (consumer-driven tests)
- Versionado de API

---

### 4. **Data Validation & Schema** 🟡 ALTO
**Por qué las skills no lo cubren bien:**
- TypeScript Advanced Types maneja tipos complejos, pero no validación en runtime
- Pydantic está parcialmente usado en backend, pero sin centralizador de reglas

**Gap específico del proyecto:**

- **Backend (`routes.py`):**
  - Modelos Pydantic definidos pero sin validadores custom
  - `FinancialMovement.amount: float` - ¿sin límites? ¿qué unidad de moneda?
  - `create_date: date` - sin validación de rango histórico vs futuro
  - `Category` y `OperationType` son string literals duplicados entre frontend y backend

- **Frontend (`financial-utils.ts`):**
  - Funciones `computeKPIs()`, `computeMonthlyData()` asumen estructura de datos correcta
  - Sin validación antes de procesamiento
  - Sin manejo de NaN, Infinity, valores negativos inesperados

- **Semántica Financiera:**
  - "Margen de beneficio" = `net / income` ¿o `net / (income + outcome)`?
  - Interpretación asumida en código, sin documentación
  - Sin validación de invariantes (ej: `net = income - outcome`)

**Recomendación:** Crear skill personalizada de **Financial Data Validation** que cubre:
- Pydantic validators para rangos, moneda, fechas
- Runtime validation en frontend (zod, io-ts, o similar)
- Semántica financiera documentada y testeable

---

### 5. **Environment Configuration & Secrets** 🟡 MEDIO
**Por qué las skills no lo cubren bien:**
- Vercel React Best Practices no aborda configuración por entorno
- TypeScript skills enfocadas en código, no en config

**Gap específico del proyecto:**

- **Frontend:**
  - `.env.example` existe pero `.env` no es versionado (correcto)
  - `VITE_API_BASE_URL` configurable pero sin validación
  - Build Vite expone variables con prefijo `VITE_` - documentado pero sin validación

- **Backend:**
  - `Dockerfile` expone puerto 8000 sin configuración de entorno
  - Generación de mock data con `seed=42` hardcodeado
  - CORS amplio con comodines + credenciales (gap conocido del memory-bank)
  - Sin `.env` para variables como DB_URL, LOG_LEVEL, etc.

- **Docker Compose:**
  - Servicios sin health checks
  - Sin variable de entorno para diferenciar dev vs prod

**Recomendación:** Crear skill personalizada de **Environment & Configuration** que cubre:
- .env validation contra schema
- Secretos gestionados (nunca en git)
- Health checks en Docker
- Config por entorno (dev, staging, prod)

---

### 6. **Performance Monitoring & Observability** 🟡 MEDIO
**Por qué las skills no lo cubren bien:**
- Vercel React Best Practices cubre optimizaciones estáticas (code splitting, bundling)
- No cubre monitoreo en runtime ni métricas de negocio

**Gap específico del proyecto:**

- **Frontend:**
  - Build reporta chunk > 500 KB (warning conocido)
  - Sin monitoreo de Core Web Vitals (LCP, FID, CLS)
  - Sin tracing de requests (latencia de fetch)

- **Backend:**
  - Sin logging de latencia por endpoint
  - Sin métricas de cache o queries
  - `generate_mock_movements(seed=42)` invocada en cada request (sin cache)

- **Integración:**
  - Sin observabilidad de end-to-end (request inicia en frontend, pasa por proxy, llega a backend)

**Recomendación:** Crear skill personalizada de **Observability & Metrics** que cubre:
- Web Vitals tracking en React
- Prometheus/OpenTelemetry en FastAPI
- Logging estructurado (correlación entre frontend y backend)
- Dashboard de métricas (opcional: Grafana)

---

## Resumen: Gaps por Prioridad

| Gap | Severidad | Cobertura Skill | Tipo | Acción |
|-----|-----------|-----------------|------|--------|
| Testing Strategy | 🔴 CRÍTICO | 0% | Transversal | Crear skill personalizada |
| API Contract & Codegen | 🔴 CRÍTICO | 0% | Integración | Crear skill personalizada |
| Error Handling | 🟠 ALTO | ~20% (TS Tips) | Backend + Frontend | Crear skill personalizada |
| Data Validation | 🟠 ALTO | ~30% (TS Types) | Backend + Frontend | Crear skill personalizada |
| Environment Config | 🟡 MEDIO | 0% | DevOps | Crear skill personalizada |
| Observability | 🟡 MEDIO | 0% | Monitoreo | Crear skill personalizada |
| Accessibility ✅ | 0% | 100% | Frontend | ✅ CUBIERTO |
| Performance ✅ | 0% | 100% | Frontend | ✅ CUBIERTO |
| TypeScript Quality ✅ | 0% | 100% | Código | ✅ CUBIERTO |

---

## Próximos Pasos

1. **Evaluar ROI:** De los 6 gaps, priorizar según criticidad de proyecto:
   - **P0:** Testing Strategy + API Contract (permiten dev ágil y despliegue seguro)
   - **P1:** Error Handling + Data Validation (robustez en producción)
   - **P2:** Environment Config + Observability (escala y mantenibilidad)

2. **Opciones:**
   - **Crear 1-2 skills personalizadas** que cubran top 3-4 gaps
   - **Usar skills existentes** (ej: search "testing", "api", "fastapi") si existen
   - **Documentación + templates** para gaps que no ameritan skill (ej: config)

3. **Validación:**
   - Después de skill personalizada, re-validar cobertura
   - Integrar en CI/CD (tests, lint, type-check ejecutan en cada PR)

---

## Referencias

- **Skills Instaladas:** memory-bank/agent-skills-selection.md
- **Gaps Iniciales:** memory-bank/overview.md (sección "Gaps y riesgos observados")
- **Code Base:**
  - Backend: backend/app/routes.py (9 endpoints, 396 líneas)
  - Frontend: frontend/src/App.tsx (81 líneas, 1 hook async)
  - Tests: backend/tests/test_routes.py (204 líneas, 5-6 tests), frontend/src/lib/financial-utils.test.ts (114 líneas)
