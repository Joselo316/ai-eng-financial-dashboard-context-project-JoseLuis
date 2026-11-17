---
name: testing-strategy
description: Comprehensive testing strategy for backend (FastAPI/pytest) + frontend (React/Vitest) + e2e (Playwright). Use when asked to "improve test coverage", "add tests", "testing strategy", "ensure all endpoints tested", "e2e tests", "component tests", or "testing patterns".
license: MIT
metadata:
  author: ai-eng-financial-dashboard
  version: "1.0"
  gap-reference: "gaps-analysis.md#1-testing-strategy"
---

# Testing Strategy: Backend + Frontend + E2E

**Objective:** Establish comprehensive testing coverage across all layers (unit, integration, e2e) for financial dashboard. Current state: Backend 30%, Frontend 10%, E2E 0%.

**Success Criteria:** 
- ✅ Backend: ≥80% line coverage, all 9 endpoints tested
- ✅ Frontend: ≥70% coverage, all components + hooks tested
- ✅ E2E: Critical user flows (fetch → compute → render) tested
- ✅ CI/CD: Tests run on every PR, fail on coverage drop

---

## INPUT: Current State Assessment

### Backend Testing Gap
**File:** `backend/tests/test_routes.py` (204 lines)
**Coverage:** ~30% of logic
```
Endpoints coverage:
✓ GET /health
✓ GET /api/metrics (date filters tested)
✗ GET /api/metrics/facets
✗ GET /api/metrics/summary
✗ GET /api/metrics/categories/top
✗ GET /api/metrics/comparison
✗ GET /api/metrics/alerts
✗ GET /api/metrics/b2b
✗ GET /api/metrics/b2c

Missing:
- Error case validation (invalid dates, categories, ranges)
- Edge case parametrization (boundary dates, empty results)
- Input validation & 400/422 errors
```

### Frontend Testing Gap
**Files:** 
- `frontend/src/__tests__/` — DOES NOT EXIST
- `frontend/src/lib/financial-utils.test.ts` (114 lines) — only utility tests
- NO component tests (DashboardHeader, KPIRow, charts)
- NO App.tsx hook tests (fetch, error handling, loading states)

**Coverage:** ~10% of codebase

Missing:
- Component rendering & prop validation
- Async useEffect behavior (fetch timing, error states)
- Error UI display
- Chart data transformation

### E2E Testing Gap
**Files:** `frontend/e2e/` — DOES NOT EXIST

Missing:
- Full user flow: load page → fetch → compute → render dashboard
- Network error handling (timeout, 500 errors)
- Loading state persistence

---

## OUTPUT: Expected Test Files & Coverage

### Phase 1: Backend Testing Expansion

**New test files:**

1. `backend/tests/test_metrics_endpoints.py` (~150 lines)
   - Covers: `/api/metrics`, `/api/metrics/summary`, `/api/metrics/categories/top`
   - Patterns: Parametrized date ranges, category filters
   - Edge cases: Empty results, boundary dates

2. `backend/tests/test_segmentation_endpoints.py` (~80 lines)
   - Covers: `/api/metrics/b2b`, `/api/metrics/b2c`
   - Patterns: Business type filtering

3. `backend/tests/test_comparison_alerts.py` (~100 lines)
   - Covers: `/api/metrics/comparison`, `/api/metrics/alerts`, `/api/metrics/facets`
   - Patterns: Aggregation logic, alert thresholds

4. `backend/tests/test_validation_errors.py` (~100 lines)
   - Covers: Invalid inputs, error handling
   - Patterns: 400/422 error responses, boundary validation

**Expected result:**
```
backend/tests/
├─ conftest.py (fixtures)
├─ test_routes.py (original ~20 tests)
├─ test_metrics_endpoints.py (+15 tests)
├─ test_segmentation_endpoints.py (+10 tests)
├─ test_comparison_alerts.py (+12 tests)
└─ test_validation_errors.py (+15 tests)

TOTAL: 72+ tests, ≥80% coverage
```

### Phase 2: Frontend Component Tests

**New test files:**

1. `frontend/src/components/dashboard/__tests__/kpi-row.test.tsx` (~50 lines)
   - Tests: Rendering metrics, number formatting, aria labels
   - Patterns: render, screen.getByText, snapshot

2. `frontend/src/components/dashboard/__tests__/income-outcome-chart.test.tsx` (~60 lines)
   - Tests: Chart rendering, data transformation
   - Patterns: snapshot testing, recharts mock

3. `frontend/src/components/dashboard/__tests__/profit-percent-chart.test.tsx` (~50 lines)

4. `frontend/src/components/dashboard/__tests__/dashboard-header.test.tsx` (~40 lines)
   - Tests: Period display, accessibility

5. `frontend/src/__tests__/app.test.tsx` (~150 lines)
   - Tests: 
     - Successful fetch → metrics → render flow
     - Error state display
     - Loading state
     - useEffect behavior
   - Patterns: mock fetch, waitFor, userEvent

**Expected result:**
```
frontend/src/__tests__/
├─ components/
│  └─ dashboard/
│     ├─ __tests__/
│     │  ├─ kpi-row.test.tsx (+50 lines)
│     │  ├─ income-outcome-chart.test.tsx (+60 lines)
│     │  ├─ profit-percent-chart.test.tsx (+50 lines)
│     │  └─ dashboard-header.test.tsx (+40 lines)
└─ app.test.tsx (+150 lines)

TOTAL: 350 lines of new tests, ≥70% coverage
```

### Phase 3: E2E Tests (Playwright)

**New test file:**

`frontend/e2e/dashboard.spec.ts` (~200 lines)
- Flow 1: Happy path (load → fetch → render all KPIs)
- Flow 2: Error handling (API 500 → error message display)
- Flow 3: Timeout handling (network delay → retry)
- Flow 4: Data validation (invalid data shape → graceful degradation)

**Expected result:**
```
frontend/e2e/
└─ dashboard.spec.ts (+200 lines, 4 test suites)

TOTAL: 4 critical flows tested end-to-end
```

### Phase 4: CI/CD Integration

**New files:**

1. `.github/workflows/test.yml` — Run all tests on PR
   - Backend: pytest with coverage report
   - Frontend: vitest with coverage report
   - E2E: playwright (requires docker-compose up)
   - Fail if coverage drops

2. `frontend/vitest.config.ts` — Vitest configuration (if not exists)
   - Setup testing library
   - Mock fetch
   - Coverage thresholds

3. Update `package.json` & `pyproject.toml`:
   - npm scripts: test, test:coverage, test:e2e
   - pytest config: coverage thresholds

---

## ACCEPTANCE CRITERIA

### ✅ Backend Testing (Completed when ALL pass)

- [ ] 72+ tests in `backend/tests/`
- [ ] All 9 endpoints covered by at least 2 tests each
- [ ] Edge cases tested:
  - [ ] Empty date range returns 200 with empty list
  - [ ] Invalid date format returns 400
  - [ ] Invalid category returns 400 (or filtered out)
  - [ ] start_date > end_date returns 400 (validated)
  - [ ] Null/missing optional params handled correctly
- [ ] `pytest backend/tests/` outputs ≥80% coverage
- [ ] All tests pass: `pytest -v`
- [ ] No new warnings from pytest

### ✅ Frontend Testing (Completed when ALL pass)

- [ ] 4+ component test suites created (kpi-row, charts, header)
- [ ] `App.tsx` hook testing covers:
  - [ ] Successful fetch + data flow
  - [ ] Fetch error → error message displayed
  - [ ] Loading state shown before data arrives
  - [ ] useEffect cleanup behavior
- [ ] Component tests use:
  - [ ] React Testing Library (not enzyme)
  - [ ] `render()` + `screen.*`
  - [ ] Snapshot tests for charts
- [ ] `npm run test` outputs ≥70% coverage
- [ ] All tests pass: `npm run test -- --run`
- [ ] No TypeScript errors in test files

### ✅ E2E Testing (Completed when ALL pass)

- [ ] `frontend/e2e/dashboard.spec.ts` exists with 4 test suites
- [ ] Each test:
  - [ ] Starts docker-compose (backend + frontend)
  - [ ] Navigates to localhost:5173
  - [ ] Waits for data to load
  - [ ] Asserts KPI cards visible
  - [ ] Asserts charts render
- [ ] Error scenarios tested:
  - [ ] API returns 500 → error message shown
  - [ ] Network timeout → graceful error handling
  - [ ] Invalid JSON → error boundary activated (if implemented)
- [ ] `npx playwright test` passes (requires docker-compose)

### ✅ CI/CD Integration (Completed when ALL pass)

- [ ] `.github/workflows/test.yml` runs on every PR
- [ ] Backend job:
  - [ ] Sets up Python 3.13
  - [ ] Installs requirements.txt
  - [ ] Runs `pytest --cov=app --cov-report=xml`
  - [ ] Uploads coverage to Codecov or similar
  - [ ] Fails if coverage < 80%
- [ ] Frontend job:
  - [ ] Sets up Node 20
  - [ ] Installs npm dependencies
  - [ ] Runs `npm run test -- --run --coverage`
  - [ ] Fails if coverage < 70%
- [ ] E2E job:
  - [ ] Starts docker-compose
  - [ ] Runs `npx playwright test`
  - [ ] Cleans up containers
- [ ] PR status checks show all tests passed before merge approval
- [ ] Coverage badges display in README (optional)

### ✅ Documentation (Completed when ALL pass)

- [ ] `README.md` updated with:
  - [ ] How to run tests locally (`npm test`, `pytest`, `npx playwright test`)
  - [ ] Expected coverage thresholds
  - [ ] How to run with coverage reports
  - [ ] CI/CD pipeline description
- [ ] Test files include docstrings explaining intent (not implementation)
- [ ] `.agents/rules/testing-and-validation.md` updated with new patterns

### ✅ Code Quality (Completed when ALL pass)

- [ ] No test files have `# noqa` or `# type: ignore` without justification
- [ ] Tests follow naming convention: `test_<feature>_<scenario>()` or `it('should <behavior>')`
- [ ] No duplicate test cases across files
- [ ] Mocks are centralized in `conftest.py` (backend) or test setup (frontend)
- [ ] No hardcoded waits (`sleep()`) — use proper waits (waitFor, waitForLoadState)

---

## IMPLEMENTATION PATTERNS

### Backend Pattern: Parametrized Date Testing

```python
# backend/tests/test_metrics_endpoints.py
import pytest
from datetime import date

@pytest.mark.parametrize("start_date,end_date,expected_count", [
    ("2026-01-01", "2026-01-31", 30),  # full month
    ("2026-06-15", "2026-06-15", 1),   # single day
    ("2026-12-31", "2027-01-01", 2),   # across year boundary
])
def test_date_filter_boundaries(client, start_date, end_date, expected_count):
    response = client.get("/api/metrics", params={
        "start_date": start_date,
        "end_date": end_date,
    })
    assert response.status_code == 200
    assert len(response.json()) == expected_count
```

### Backend Pattern: Error Validation

```python
# backend/tests/test_validation_errors.py
@pytest.mark.parametrize("invalid_param,status_code", [
    ({"start_date": "invalid"}, 422),
    ({"category": "invalid_category"}, 422),
    ({"start_date": "2026-13-01"}, 422),
])
def test_invalid_params_return_error(client, invalid_param, status_code):
    response = client.get("/api/metrics", params=invalid_param)
    assert response.status_code == status_code
    assert "detail" in response.json()
```

### Frontend Pattern: Component + Data

```typescript
// frontend/src/components/dashboard/__tests__/kpi-row.test.tsx
import { render, screen } from '@testing-library/react'
import { KPIRow } from '../kpi-row'

describe('KPIRow', () => {
  it('renders all metrics with correct formatting', () => {
    const metrics = {
      income: 50000.75,
      outcome: 30000.25,
      net: 20000.50,
      margin: 40.0,
    }
    
    render(<KPIRow metrics={metrics} />)
    
    expect(screen.getByText('$50,000.75')).toBeInTheDocument()
    expect(screen.getByText('$30,000.25')).toBeInTheDocument()
    expect(screen.getByText('$20,000.50')).toBeInTheDocument()
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('renders aria-labels for accessibility', () => {
    const metrics = { income: 1000, outcome: 500, net: 500, margin: 50 }
    render(<KPIRow metrics={metrics} />)
    
    expect(screen.getByLabelText('Total Income')).toBeInTheDocument()
    expect(screen.getByLabelText('Total Expenses')).toBeInTheDocument()
  })
})
```

### Frontend Pattern: Async Hook Testing

```typescript
// frontend/src/__tests__/app.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

describe('App', () => {
  it('fetches data and renders metrics on mount', async () => {
    const mockData = [
      {
        create_date: '2026-01-15',
        amount: 1000,
        operation_type: 'income',
        category: 'sales',
        business_type: 'B2B',
      },
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    render(<App />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      expect(screen.getByText(/financial/i)).toBeInTheDocument()
    })
  })

  it('displays error message when fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
    })
  })
})
```

### E2E Pattern: Critical Flow

```typescript
// frontend/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('loads metrics and displays KPI cards', async ({ page }) => {
    await page.goto('http://localhost:5173')

    // Wait for fetch to complete
    await page.waitForLoadState('networkidle')

    // Assert KPI cards visible
    await expect(page.locator('[data-testid="kpi-income"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-outcome"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-net"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-margin"]')).toBeVisible()

    // Assert charts render
    await expect(page.locator('canvas').first()).toBeVisible()
  })

  test('shows error message when API fails', async ({ page, context }) => {
    // Mock API error
    await context.route('**/api/metrics', route => {
      route.abort('failed')
    })

    await page.goto('http://localhost:5173')

    // Should display error message
    await expect(page.locator('text=/no se pudo cargar/i')).toBeVisible()
  })
})
```

---

## CHECKLIST: Implementation Steps

- [ ] **Phase 1: Backend Expansion**
  - [ ] Create `backend/tests/test_metrics_endpoints.py`
  - [ ] Create `backend/tests/test_segmentation_endpoints.py`
  - [ ] Create `backend/tests/test_comparison_alerts.py`
  - [ ] Create `backend/tests/test_validation_errors.py`
  - [ ] Run `pytest backend/tests/ --cov=app` → verify ≥80% coverage
  - [ ] All tests pass: `pytest -v`

- [ ] **Phase 2: Frontend Components**
  - [ ] Create `frontend/src/components/dashboard/__tests__/` directory
  - [ ] Create component test files (kpi-row, charts, header)
  - [ ] Create `frontend/src/__tests__/app.test.tsx`
  - [ ] Run `npm run test -- --run --coverage` → verify ≥70% coverage
  - [ ] All tests pass: `npm run test -- --run`

- [ ] **Phase 3: E2E Tests**
  - [ ] Create `frontend/e2e/` directory
  - [ ] Create `frontend/e2e/dashboard.spec.ts`
  - [ ] Install Playwright: `npm install -D @playwright/test`
  - [ ] Update `.gitignore` to exclude playwright cache
  - [ ] Test runs: `npx playwright test` (with docker-compose up)

- [ ] **Phase 4: CI/CD**
  - [ ] Create `.github/workflows/test.yml`
  - [ ] Verify workflow runs on PR
  - [ ] Update `package.json` test scripts
  - [ ] Update README with testing instructions

- [ ] **Phase 5: Documentation**
  - [ ] Update `README.md` with testing section
  - [ ] Update `.agents/rules/testing-and-validation.md`
  - [ ] Add coverage badges (optional)

---

## SUCCESS METRICS

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Backend Coverage | 30% | ≥80% | Phase 1 |
| Frontend Coverage | 10% | ≥70% | Phase 2 |
| E2E Tests | 0 | 4 flows | Phase 3 |
| Test Count | ~6 | 72+ | Phase 1-2 |
| CI/CD Status | ❌ No CI | ✅ Full pipeline | Phase 4 |

---

## REFERENCES

- **Existing tests:** `backend/tests/test_routes.py`, `frontend/src/lib/financial-utils.test.ts`
- **Gaps document:** `memory-bank/gaps-analysis.md#1-testing-strategy`
- **API endpoints:** `backend/app/routes.py` (396 lines, 9 endpoints)
- **Frontend app:** `frontend/src/App.tsx` (81 lines, async hook)
