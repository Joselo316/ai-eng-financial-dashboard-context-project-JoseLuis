# Skill Personalizada: API Contract & Codegen

> **Propósito:** Cubrir gap crítico de falta de sincronización de tipos y contrato entre backend/frontend
> **Proyecto:** financial-dashboard-context-project  
> **Prioridad:** P0 (Crítico)

---

## Oportunidad

**Estado Actual:**
- Backend (FastAPI): Define 9 endpoints en `app/routes.py` con Pydantic models
- Frontend (React): Define tipos TypeScript equivalentes en `lib/financial-types.ts`
- **Problema:** Tipos definidos 2 veces, sin sincronización automática

```
Backend: FinancialMovement (Pydantic)       Frontend: FinancialMovement (TypeScript)
├─ create_date: date                        ├─ create_date: string  ⚠️ type mismatch
├─ amount: float                            ├─ amount: number
├─ operation_type: str (literal)            ├─ operation_type: "income" | "outcome"
├─ category: str (literal)                  ├─ category: "suppliers" | ...
└─ business_type: str (literal)             └─ business_type: "B2B" | "B2C"
```

**Frontend consume 1/9 endpoints:**
- ✅ GET `/api/metrics` → K.P.I. row + charts
- ❌ `/api/metrics/facets` → no consumer UI
- ❌ `/api/metrics/summary` → no consumer UI
- ❌ `/api/metrics/categories/top` → no consumer UI
- ❌ `/api/metrics/comparison` → no consumer UI
- ❌ `/api/metrics/alerts` → no consumer UI
- ❌ `/api/metrics/b2b` → no consumer UI
- ❌ `/api/metrics/b2c` → no consumer UI

**Falta documentación de contrato:**
- Parámetros opcionales vs requeridos no claros
- Rango válido de valores no especificado
- Ejemplos de respuesta ausentes

---

## Qué Cubriría Esta Skill

### 1. OpenAPI Schema Generation & Validation

**Documentar automáticamente desde FastAPI:**
```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="Financial Dashboard API",
    version="1.0.0",
    description="API para métricas financieras",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Financial Dashboard API",
        version="1.0.0",
        routes=app.routes,
    )
    
    # Enhance schema with examples
    openapi_schema["paths"]["/api/metrics"]["get"]["responses"]["200"]["content"]["application/json"]["example"] = {
        "movements": [
            {
                "create_date": "2026-01-15",
                "amount": 5000.50,
                "operation_type": "income",
                "category": "sales",
                "business_type": "B2B"
            }
        ]
    }
    
    return openapi_schema

app.openapi = custom_openapi
```

**Validación del contrato:**
```bash
# npm install openapi-validator
npx openapi-validator backend/openapi.json
```

### 2. TypeScript Code Generation from OpenAPI

**Generar tipos TypeScript automáticamente:**
```bash
# npm install -D @openapi-generator/cli
npx openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g typescript-fetch \
  -o frontend/src/generated/api
```

**Resultado: tipos sincronizados automáticamente**
```typescript
// frontend/src/generated/api/models/FinancialMovement.ts (auto-generated)
export interface FinancialMovement {
  create_date: string  // date as ISO-8601
  amount: number
  operation_type: OperationType
  category: Category
  business_type: BusinessType
}

export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
export type BusinessType = 'B2B' | 'B2C'
```

**Cliente fetch generado automáticamente:**
```typescript
// frontend/src/generated/api/apis/MetricsApi.ts (auto-generated)
export class MetricsApi extends BaseAPI {
  async getMetrics(params: {
    start_date?: string
    end_date?: string
    category?: Category
    operation_type?: OperationType
    business_type?: BusinessType
  }): Promise<FinancialMovement[]> {
    // Validar tipos automáticamente
    return this.request({
      method: 'GET',
      url: '/api/metrics',
      query: params,
    })
  }

  async getMetricsFacets(): Promise<MetricsFacets> {
    // ...
  }

  async getMetricsSummary(params?: { start_date?: string; end_date?: string }): Promise<MetricsSummaryItem[]> {
    // ...
  }

  // etc... todos los 9 endpoints
}
```

### 3. Contract Testing (Consumer-Driven Contracts)

**Backend verifica que respuestas cumplen schema:**
```python
# backend/tests/test_contract.py
from openapi_spec_validator import validate_spec
from openapi_spec_validator.validation.validators import oas30_validator_factory
import json

def test_openapi_schema_is_valid():
    """Valida que el schema OpenAPI sea válido"""
    with open('backend/openapi.json') as f:
        schema = json.load(f)
    
    # Validar schema
    validator = oas30_validator_factory(schema)
    validator.validate(schema)
    # Si falla, el test detecta breaking changes

def test_metrics_response_matches_openapi():
    """Valida que respuesta actual cumpla schema OpenAPI"""
    response = client.get("/api/metrics")
    
    # Validar respuesta contra schema
    validate_response(response.json(), schema_path="api.metrics.response")
```

**Frontend verifica tipos esperados:**
```typescript
// frontend/src/__tests__/api-contract.test.ts
import { MetricsApi } from '../generated/api'
import * as runtime from '../generated/api/runtime'

describe('API Contract', () => {
  it('fetches metrics with correct type shape', async () => {
    const api = new MetricsApi(new runtime.Configuration({
      basePath: 'http://localhost:8000',
    }))
    
    const movements = await api.getMetrics({})
    
    // Type-check automático (TypeScript)
    movements.forEach((m: FinancialMovement) => {
      expect(m).toHaveProperty('create_date')
      expect(m).toHaveProperty('amount')
      expect(m).toHaveProperty('operation_type')
    })
  })
})
```

### 4. Parámetros Documentados & Ejemplos

**Usar Pydantic Field con ejemplos:**
```python
# backend/app/routes.py
from pydantic import BaseModel, Field
from datetime import date

class MetricsQuery(BaseModel):
    start_date: date | None = Field(
        None,
        description="Fecha de inicio (YYYY-MM-DD)",
        example="2026-01-01"
    )
    end_date: date | None = Field(
        None,
        description="Fecha de fin (YYYY-MM-DD)",
        example="2026-12-31"
    )
    category: Category | None = Field(
        None,
        description="Filtrar por categoría",
        example="sales"
    )
    operation_type: OperationType | None = Field(
        None,
        description="Filtrar por tipo (income/outcome)",
        example="income"
    )
    business_type: BusinessType | None = Field(
        None,
        description="Filtrar por segmento B2B/B2C",
        example="B2B"
    )

@router.get("/api/metrics", response_model=list[FinancialMovement])
async def get_metrics(query: MetricsQuery = Query(...)):
    """
    Obtiene movimientos financieros con filtros opcionales.
    
    **Ejemplos:**
    - GET /api/metrics?start_date=2026-01-01&end_date=2026-12-31
    - GET /api/metrics?category=sales&operation_type=income
    - GET /api/metrics?business_type=B2B
    """
    return filter_movements_by_params(movements, query)
```

**OpenAPI /docs mostrará ejemplos automáticamente**

### 5. Versionado de API

**Detectar breaking changes:**
```bash
# npm install openapi-diff
openapi-diff backend/openapi.v1.json backend/openapi.v2.json
```

**Resultado si hay breaking changes:**
```
Breaking Changes Found:
  - Endpoint removed: DELETE /api/metrics
  - Required parameter added: start_date (GET /api/metrics)
  - Response field removed: forecast (GET /api/metrics/summary)
```

**CI bloquea PR si hay breaking changes sin mayor versión:**
```yaml
# .github/workflows/breaking-changes.yml
- name: Check for Breaking Changes
  run: |
    openapi-diff backend/openapi.v$(cat VERSION).json backend/openapi.json
    # Exit 1 si hay breaking changes y no se bumpea version
```

---

## Integración en Frontend

**Usar cliente generado en lugar de fetch manual:**

```typescript
// frontend/src/App.tsx (ANTES)
async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

// frontend/src/App.tsx (DESPUÉS - con cliente generado)
import { MetricsApi, Configuration } from '@/generated/api'

const metricsApi = new MetricsApi(new Configuration({
  basePath: import.meta.env.VITE_API_BASE_URL ?? '',
}))

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  return metricsApi.getMetrics({})
  // Tipos automáticamente correctos
  // Error handling por type-safety
}
```

**Ahora todos los 9 endpoints pueden consumirse con tipo-safety:**

```typescript
// Usar otros endpoints fácilmente
const facets = await metricsApi.getMetricsFacets()
const summary = await metricsApi.getMetricsSummary({
  start_date: '2026-01-01',
  end_date: '2026-12-31'
})
const topCategories = await metricsApi.getMetricsTopCategories()
const comparison = await metricsApi.getMetricsComparison()
const alerts = await metricsApi.getMetricsAlerts()
```

---

## Setup & Automatización

### Setup Inicial

```bash
# 1. Backend: generar OpenAPI JSON
cd backend
pip install openapi-spec-validator
python -c "from app.main import app; import json; \
  print(json.dumps(app.openapi(), indent=2))" > openapi.json

# 2. Frontend: instalar generador y CLI openapi-diff
cd ../frontend
npm install -D @openapi-generator/cli openapi-diff

# 3. Generar tipos TypeScript
npx openapi-generator-cli generate \
  -i ../backend/openapi.json \
  -g typescript-fetch \
  -o src/generated/api

# 4. Commitear generated/api/
git add src/generated/api/
git commit -m "chore: auto-generated API types from OpenAPI schema"
```

### CI/CD Automation

```yaml
# .github/workflows/api-contract.yml
name: API Contract

on:
  pull_request:
    paths:
      - 'backend/app/**'
      - 'frontend/src/**'

jobs:
  validate-contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Generar OpenAPI
      - uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && python -c "..." > openapi.json
      
      # Validar schema
      - run: npx openapi-validator backend/openapi.json
      
      # Regenerar tipos TypeScript
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: |
          npx openapi-generator-cli generate \
            -i ../backend/openapi.json \
            -g typescript-fetch \
            -o src/generated/api-new
          diff -r src/generated/api src/generated/api-new || {
            echo "⚠️ Generated API types changed"
            cp -r src/generated/api-new src/generated/api
            exit 1
          }
      
      # Si cambió, requiere actualización
      - name: Fail if types changed
        if: failure()
        run: |
          echo "API types were regenerated. Please commit changes:"
          echo "  git add frontend/src/generated/api/"
          echo "  git commit -m 'chore: update generated API types'"
          exit 1
```

---

## Checklist de Implementación

- [ ] Extender Pydantic models con `Field(description=..., example=...)`
- [ ] Generar `backend/openapi.json` y validarlo
- [ ] Instalar generador OpenAPI en frontend
- [ ] Generar `frontend/src/generated/api/` desde OpenAPI
- [ ] Reemplazar `fetchFinancialData()` con cliente generado
- [ ] Crear contract tests (backend + frontend)
- [ ] Configurar GitHub Actions para regenerar/validar
- [ ] Documentar proceso en README
- [ ] Adicionar `.gitignore` para generated/ con instrucción de regeneración

---

## Archivos Afectados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `backend/app/routes.py` | Adicionar Field con ejemplos | 396 → ~420 |
| `backend/openapi.json` | ✨ Generado automáticamente | ✨ Nuevo |
| `frontend/src/generated/api/` | ✨ Tipos TS auto-generados | ✨ Nuevo (~500 líneas) |
| `frontend/src/App.tsx` | Usar cliente generado | 81 → ~60 |
| `frontend/src/__tests__/api-contract.test.ts` | Tests de contrato | ✨ Nuevo |
| `backend/tests/test_contract.py` | Contract validation | ✨ Nuevo |
| `.github/workflows/api-contract.yml` | CI/CD validación | ✨ Nuevo |
| `.gitignore` | Exclusión de generated/ | 📝 Actualizar |
| `README.md` | Instrucciones regeneración | 📝 Actualizar |

---

## Beneficios

✅ Tipos sincronizados automáticamente (una fuente de verdad: OpenAPI)  
✅ Cambios breaking detectados automáticamente  
✅ Todos los 9 endpoints documentados con ejemplos  
✅ Type-safe en frontend sin duplicación  
✅ Documentación siempre actualizada (/docs)  
✅ Facilita consumo de nuevos endpoints  

---

## Referencias

- FastAPI OpenAPI: https://fastapi.tiangolo.com/how-to/extending-openapi/
- OpenAPI Generator: https://openapi-generator.tech/
- TypeScript Fetch Generator: https://openapi-generator.tech/docs/generators/typescript-fetch
- Contract Testing: https://pact.foundation/
