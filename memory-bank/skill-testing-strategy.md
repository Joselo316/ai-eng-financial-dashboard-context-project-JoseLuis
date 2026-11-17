# Skill Personalizada: Testing Strategy (FastAPI + Vitest + Playwright)

> **Propósito:** Cubrir gap crítico de cobertura de tests en backend (FastAPI) + frontend (React/Vitest) + e2e (Playwright)
> **Proyecto:** financial-dashboard-context-project  
> **Prioridad:** P0 (Crítico)

---

## Oportunidad

**Estado Actual:**
- Backend: 9 endpoints, solo 5-6 tests (~30% cobertura lógica)
- Frontend: 81 líneas App.tsx + 5 componentes, solo 1 suite de tests (financial-utils.ts)
- Sin: E2E tests, edge cases, manejo de errores, validación malformada

**Endpoints sin cobertura:**
```
✓ GET /health                        (covered)
✓ GET /api/metrics                   (covered: date filters)
? GET /api/metrics/facets            (NOT covered)
? GET /api/metrics/summary           (NOT covered)
? GET /api/metrics/categories/top    (NOT covered)
? GET /api/metrics/comparison        (NOT covered)
? GET /api/metrics/alerts            (NOT covered)
? GET /api/metrics/b2b               (NOT covered)
? GET /api/metrics/b2c               (NOT covered)
```

---

## Qué Cubriría Esta Skill

### 1. Backend Testing Patterns (pytest + FastAPI)

**Pattern: Fixture-based setup**
```python
# conftest.py enhancement
@pytest.fixture
def client():
    """TestClient con mock data predefinido"""
    return TestClient(app)

@pytest.fixture
def sample_movements():
    """Movimientos con fechas controladas"""
    return generate_mock_movements(seed=42)

def test_facets_endpoint_aggregates_all_values(client, sample_movements):
    response = client.get("/api/metrics/facets")
    assert response.status_code == 200
    payload = response.json()
    
    assert "operation_types" in payload
    assert set(payload["operation_types"]) == {"income", "outcome"}
    # etc...
```

**Pattern: Edge case parametrization**
```python
@pytest.mark.parametrize("start_date,end_date", [
    ("2026-01-01", "2026-12-31"),  # full year
    ("2026-06-15", "2026-06-15"),  # single day
    ("2026-12-31", "2027-01-01"),  # across year boundary
])
def test_date_filter_boundaries(client, start_date, end_date):
    response = client.get("/api/metrics", params={
        "start_date": start_date,
        "end_date": end_date
    })
    assert response.status_code == 200
    # validate payload
```

**Pattern: Error case validation**
```python
@pytest.mark.parametrize("invalid_input", [
    {"start_date": "2026-13-01"},  # invalid month
    {"start_date": "not-a-date"},  # invalid format
    {"category": "invalid_category"},  # invalid enum
    {"start_date": "2026-12-01", "end_date": "2026-01-01"},  # inverted range
])
def test_invalid_query_params_return_400(client, invalid_input):
    response = client.get("/api/metrics", params=invalid_input)
    assert response.status_code == 400
    # error details
```

### 2. Frontend Testing Patterns (Vitest + React Testing Library)

**Pattern: Component rendering with data**
```typescript
// KPIRow.test.tsx
import { render, screen } from '@testing-library/react'
import { KPIRow } from './kpi-row'

describe('KPIRow', () => {
  it('renders income and outcome metrics', () => {
    const metrics = {
      income: 50000,
      outcome: 30000,
      net: 20000,
      margin: 40,
    }
    render(<KPIRow metrics={metrics} />)
    
    expect(screen.getByText('$50,000')).toBeInTheDocument()
    expect(screen.getByText('$30,000')).toBeInTheDocument()
  })
})
```

**Pattern: Async hook testing (useEffect + fetch)**
```typescript
// App.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('fetches financial data and renders metrics', async () => {
    const mockMovements = [
      { create_date: '2026-01', amount: 1000, operation_type: 'income', ... },
    ]
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMovements),
    })
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      expect(screen.getByText(/financial/i)).toBeInTheDocument()
    })
  })

  it('displays error when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
    })
  })
})
```

**Pattern: Chart snapshot testing**
```typescript
// IncomeOutcomeChart.test.tsx
import { render } from '@testing-library/react'
import { IncomeOutcomeChart } from './income-outcome-chart'

it('renders chart with correct data points', () => {
  const data = [
    { month: 'Jan', income: 10000, outcome: 5000 },
    { month: 'Feb', income: 12000, outcome: 6000 },
  ]
  const { container } = render(<IncomeOutcomeChart data={data} />)
  
  expect(container).toMatchSnapshot()
})
```

### 3. E2E Testing Patterns (Playwright)

**Pattern: User flow end-to-end**
```typescript
// dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('user loads dashboard and sees metrics', async ({ page }) => {
  // Start mock server
  await page.context().route('http://localhost:8000/api/metrics', route => {
    route.abort()  // Simulate network error
  })
  
  // Navigate to app
  await page.goto('http://localhost:5173')
  
  // Wait for load state
  await page.waitForLoadState('networkidle')
  
  // Assert dashboard loaded
  await expect(page.locator('[data-testid="kpi-income"]')).toBeVisible()
  await expect(page.locator('text=Financial')).toBeVisible()
  
  // Assert charts render
  const chart = page.locator('canvas')
  await expect(chart).toBeVisible()
})

test('handles API error gracefully', async ({ page }) => {
  // Mock API 500 error
  await page.context().route('http://localhost:8000/api/metrics', route => {
    route.abort()
  })
  
  await page.goto('http://localhost:5173')
  
  // Should show error message
  await expect(page.locator('text=No se pudo cargar')).toBeVisible()
})
```

---

## Integración en CI/CD

```yaml
# .github/workflows/test.yml (ejemplo)
name: Test

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - run: cd backend && pip install -r requirements.txt pytest
      - run: cd backend && pytest --cov=app --cov-report=xml
      
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: docker compose up -d
      - run: cd frontend && npx playwright install
      - run: cd frontend && npx playwright test
```

---

## Checklist de Implementación

- [ ] Expandir `backend/tests/test_routes.py` con 15-20 tests adicionales (facets, summary, comparison, alerts, B2B/B2C)
- [ ] Crear `backend/tests/test_validation.py` para edge cases y errores
- [ ] Crear `frontend/src/components/dashboard/__tests__/` con tests de componentes
- [ ] Crear `frontend/src/__tests__/app.test.tsx` para hook async y manejo de errores
- [ ] Crear `frontend/e2e/dashboard.spec.ts` (Playwright)
- [ ] Configurar GitHub Actions para ejecutar tests en cada PR
- [ ] Documenter cobertura mínima esperada (ej: 80% backend, 70% frontend)
- [ ] Adicionar badges de cobertura a README

---

## Archivos Afectados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `backend/tests/test_routes.py` | +15-20 tests nuevos | 204 → ~300 |
| `backend/tests/conftest.py` | Fixtures adicionales | ✨ Nuevo |
| `frontend/src/components/dashboard/__tests__/kpi-row.test.tsx` | Tests componentes | ✨ Nuevo |
| `frontend/src/components/dashboard/__tests__/chart.test.tsx` | Tests gráficos | ✨ Nuevo |
| `frontend/src/__tests__/app.test.tsx` | Tests App, hooks | ✨ Nuevo |
| `frontend/e2e/dashboard.spec.ts` | E2E tests | ✨ Nuevo |
| `.github/workflows/test.yml` | CI/CD pipeline | ✨ Nuevo |
| `README.md` | Instrucciones test + badges | 📝 Actualizar |

---

## Beneficios

✅ Cobertura de tests completa (backend + frontend + e2e)  
✅ Confianza en refactors y cambios de API  
✅ Documentation por tests (ejemplos vivos)  
✅ CI/CD pipeline que valida calidad  
✅ Regresión detectada automáticamente  

---

## Referencia

- Stack: pytest (backend), Vitest + RTL (frontend), Playwright (e2e)
- Testing: TDD patterns, parametrization, mocking, edge cases
- CI: GitHub Actions con cobertura
