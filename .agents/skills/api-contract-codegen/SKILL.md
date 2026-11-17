---
name: api-contract-codegen
description: OpenAPI contract generation + TypeScript code generation to synchronize backend API types with frontend client. Use when asked to "sync types with API", "generate client code", "OpenAPI schema", "eliminate type duplication", "contract testing", or "type safety between services".
license: MIT
metadata:
  author: ai-eng-financial-dashboard
  version: "1.0"
  gap-reference: "gaps-analysis.md#2-api-contract--codegen"
---

# API Contract & Code Generation: OpenAPI + TypeScript Codegen

**Objective:** Eliminate type duplication between backend (Pydantic) and frontend (TypeScript). Establish single source of truth (OpenAPI schema) + automatic client code generation.

**Current Problem:**
- FinancialMovement defined in `backend/app/routes.py` (Pydantic) AND `frontend/src/lib/financial-types.ts` (TypeScript)
- Changes to backend require manual sync to frontend types
- Frontend consumes 1/9 API endpoints (others unused due to disconnection)
- No validation that client matches server contract

**Success Criteria:**
- ✅ OpenAPI schema auto-generated from FastAPI
- ✅ TypeScript types auto-generated from OpenAPI (one command)
- ✅ All 9 endpoints documented with examples
- ✅ Contract tests validate backend+frontend match
- ✅ CI/CD prevents breaking changes

---

## INPUT: Current State Assessment

### Backend API Definition

**File:** `backend/app/routes.py` (396 lines)

```python
# Current: Models defined with minimal documentation
class FinancialMovement(BaseModel):
    create_date: date
    amount: float
    operation_type: OperationType
    category: Category
    business_type: BusinessType

# 9 endpoints defined but NOT documented:
@router.get("/health")
@router.get("/api/metrics")
@router.get("/api/metrics/facets")
@router.get("/api/metrics/summary")
@router.get("/api/metrics/categories/top")
@router.get("/api/metrics/comparison")
@router.get("/api/metrics/alerts")
@router.get("/api/metrics/b2b")
@router.get("/api/metrics/b2c")
```

**Missing:**
- Field descriptions (amount: what unit? what range?)
- Example values for Swagger UI
- Parameter validation documented
- Error response documentation
- Response status codes explicit

### Frontend Type Definition

**File:** `frontend/src/lib/financial-types.ts`

```typescript
// Current: Manually maintained, prone to drift
export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
export type BusinessType = 'B2B' | 'B2C'

export interface FinancialMovement {
  operation_type: OperationType
  business_type: BusinessType
  create_date: string  // ⚠️ Note: Backend is date, Frontend is string
  amount: number
  category: Category
}
```

**Problem:** Type mismatch (create_date: date vs string) + manual maintenance

### Frontend API Usage

**File:** `frontend/src/App.tsx` (81 lines)

```typescript
// Current: Manual fetch, only consumes /api/metrics
async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

// 8/9 endpoints unused because:
// - No types generated (requires manual definition)
// - No client library (requires manual fetch calls)
// - Fear of type mismatch
```

---

## OUTPUT: Expected Contract & Generated Code

### Phase 1: OpenAPI Schema Generation

**Output:** `backend/openapi.json` (auto-generated)

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Financial Dashboard API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/metrics": {
      "get": {
        "parameters": [
          {
            "name": "start_date",
            "in": "query",
            "schema": { "type": "string", "format": "date" },
            "description": "Filter movements from this date (YYYY-MM-DD)",
            "example": "2026-01-01"
          },
          {
            "name": "end_date",
            "in": "query",
            "schema": { "type": "string", "format": "date" },
            "description": "Filter movements until this date (YYYY-MM-DD)",
            "example": "2026-12-31"
          },
          {
            "name": "category",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": ["suppliers", "sales", "operational", "administrative", "others"]
            },
            "description": "Filter by expense/income category"
          }
        ],
        "responses": {
          "200": {
            "description": "List of financial movements",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/FinancialMovement" }
                },
                "example": [
                  {
                    "create_date": "2026-01-15",
                    "amount": 5000.50,
                    "operation_type": "income",
                    "category": "sales",
                    "business_type": "B2B"
                  }
                ]
              }
            }
          },
          "400": {
            "description": "Invalid parameters"
          }
        }
      }
    },
    "/api/metrics/facets": { "..." },
    "/api/metrics/summary": { "..." },
    "/api/metrics/categories/top": { "..." },
    "/api/metrics/comparison": { "..." },
    "/api/metrics/alerts": { "..." },
    "/api/metrics/b2b": { "..." },
    "/api/metrics/b2c": { "..." }
  },
  "components": {
    "schemas": {
      "FinancialMovement": {
        "type": "object",
        "properties": {
          "create_date": {
            "type": "string",
            "format": "date",
            "description": "Date of transaction (YYYY-MM-DD)"
          },
          "amount": {
            "type": "number",
            "format": "float",
            "description": "Transaction amount in base currency"
          },
          "operation_type": {
            "type": "string",
            "enum": ["income", "outcome"],
            "description": "Type of movement (income or expense)"
          },
          "category": {
            "type": "string",
            "enum": ["suppliers", "sales", "operational", "administrative", "others"]
          },
          "business_type": {
            "type": "string",
            "enum": ["B2B", "B2C"],
            "description": "Business segment"
          }
        },
        "required": ["create_date", "amount", "operation_type", "category", "business_type"]
      },
      "MetricsSummaryItem": { "..." },
      "MetricsComparison": { "..." }
    }
  }
}
```

### Phase 2: TypeScript Client Code Generation

**Input:** `backend/openapi.json`  
**Tool:** `openapi-generator-cli`  
**Output:** `frontend/src/generated/api/` (~500 lines auto-generated)

```
frontend/src/generated/api/
├─ models/
│  ├─ FinancialMovement.ts          (interface + types)
│  ├─ MetricsFacets.ts
│  ├─ MetricsSummaryItem.ts
│  ├─ MetricsComparison.ts
│  ├─ MetricsAlert.ts
│  ├─ TopCategoryItem.ts
│  └─ index.ts                       (barrel export)
├─ apis/
│  ├─ MetricsApi.ts                 (typed API client)
│  └─ index.ts
├─ runtime.ts                        (configuration)
└─ index.ts                          (main export)
```

**Generated Example: `frontend/src/generated/api/models/FinancialMovement.ts`**

```typescript
// AUTO-GENERATED - DO NOT EDIT
// Generated from openapi.json by openapi-generator-cli

export interface FinancialMovement {
  /**
   * Date of transaction (YYYY-MM-DD)
   * @type {string}
   * @memberof FinancialMovement
   */
  create_date: string  // RFC3339 date format
  
  /**
   * Transaction amount in base currency
   * @type {number}
   * @memberof FinancialMovement
   */
  amount: number
  
  /**
   * Type of movement (income or expense)
   * @type {string}
   * @memberof FinancialMovement
   */
  operation_type: FinancialMovementOperationTypeEnum
  
  /**
   * @type {string}
   * @memberof FinancialMovement
   */
  category: FinancialMovementCategoryEnum
  
  /**
   * Business segment
   * @type {string}
   * @memberof FinancialMovement
   */
  business_type: FinancialMovementBusinessTypeEnum
}

export const FinancialMovementOperationTypeEnum = {
  Income: 'income' as const,
  Outcome: 'outcome' as const,
}

export type FinancialMovementOperationTypeEnum =
  typeof FinancialMovementOperationTypeEnum[keyof typeof FinancialMovementOperationTypeEnum]

// Similar for Category, BusinessType enums...
```

**Generated Example: `frontend/src/generated/api/apis/MetricsApi.ts`**

```typescript
// AUTO-GENERATED - DO NOT EDIT
import { FinancialMovement, MetricsFacets, MetricsSummaryItem } from '../models'
import { Configuration } from '../runtime'

export class MetricsApi {
  constructor(protected configuration: Configuration) {}

  /**
   * Get financial movements with optional filters
   * @param startDate Filter from this date (YYYY-MM-DD)
   * @param endDate Filter until this date (YYYY-MM-DD)
   * @param category Filter by category
   * @param operationType Filter by income/outcome
   * @param businessType Filter by B2B/B2C
   * @returns Promise<FinancialMovement[]>
   */
  async getMetrics(params: {
    start_date?: string
    end_date?: string
    category?: string
    operation_type?: string
    business_type?: string
  }): Promise<FinancialMovement[]> {
    const response = await this.request({
      method: 'GET',
      url: '/api/metrics',
      query: params,
    })
    return response
  }

  /**
   * Get available facets (categories, types, ranges)
   * @returns Promise<MetricsFacets>
   */
  async getMetricsFacets(): Promise<MetricsFacets> {
    // ...
  }

  /**
   * Get summary aggregated by period
   * @param startDate Optional period start
   * @param endDate Optional period end
   * @returns Promise<MetricsSummaryItem[]>
   */
  async getMetricsSummary(params?: {
    start_date?: string
    end_date?: string
  }): Promise<MetricsSummaryItem[]> {
    // ...
  }

  // ... rest of 9 endpoints with types automatically synced
}
```

### Phase 3: Refactored Frontend Code

**Before:**
```typescript
// frontend/src/App.tsx
async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}
```

**After:**
```typescript
// frontend/src/App.tsx
import { MetricsApi, Configuration } from '@/generated/api'

const metricsApi = new MetricsApi(
  new Configuration({
    basePath: import.meta.env.VITE_API_BASE_URL ?? '',
  })
)

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  return metricsApi.getMetrics({})
  // Types guaranteed correct
  // Error handling by-design
}

// Now all 9 endpoints available with type-safety:
const facets = await metricsApi.getMetricsFacets()
const summary = await metricsApi.getMetricsSummary({
  start_date: '2026-01-01',
  end_date: '2026-12-31'
})
const topCategories = await metricsApi.getMetricsTopCategories()
// etc...
```

### Phase 4: Contract Validation Tests

**New test file:** `backend/tests/test_contract.py` (~80 lines)

```python
# backend/tests/test_contract.py
from openapi_spec_validator import validate_spec
import json

def test_openapi_schema_is_valid():
    """Validate OpenAPI schema meets 3.0.0 spec"""
    with open('backend/openapi.json') as f:
        schema = json.load(f)
    
    # Will raise ValidationError if invalid
    validate_spec(schema)

def test_all_endpoints_have_examples():
    """Every endpoint in schema must have example response"""
    with open('backend/openapi.json') as f:
        schema = json.load(f)
    
    for path, methods in schema['paths'].items():
        for method, details in methods.items():
            if method in ['get', 'post', 'put', 'delete']:
                for status, response in details.get('responses', {}).items():
                    example = response.get('content', {}).get('application/json', {}).get('example')
                    assert example is not None, f"{method.upper()} {path} {status} missing example"
```

**New test file:** `frontend/src/__tests__/api-contract.test.ts` (~80 lines)

```typescript
// frontend/src/__tests__/api-contract.test.ts
import { MetricsApi, FinancialMovement } from '@/generated/api'

describe('API Contract', () => {
  it('verifies generated types match response shape', async () => {
    // This test ensures that if backend response changes shape,
    // TypeScript compilation fails (catching breaking changes)
    
    const mockMovement: FinancialMovement = {
      create_date: '2026-01-15',
      amount: 1000,
      operation_type: 'income',
      category: 'sales',
      business_type: 'B2B',
    }
    
    // Type-safety: if schema changes, TS error prevents merge
    expect(mockMovement.create_date).toBeDefined()
    expect(mockMovement.amount).toBeGreaterThan(0)
  })
})
```

---

## ACCEPTANCE CRITERIA

### ✅ OpenAPI Generation (Completed when ALL pass)

- [ ] `backend/app/routes.py` Pydantic models enhanced with `Field(description=..., example=...)`
- [ ] All 9 endpoints have descriptions
- [ ] `backend/openapi.json` generated from FastAPI (command: auto-generate)
- [ ] `openapi-spec-validator backend/openapi.json` passes (no warnings)
- [ ] Running `python -m fastapi.openapi.utils` produces valid schema
- [ ] `/docs` endpoint serves valid OpenAPI schema (can inspect in Swagger UI)
- [ ] All response types have example values in schema

### ✅ TypeScript Code Generation (Completed when ALL pass)

- [ ] `frontend/src/generated/api/` directory created
- [ ] Models generated:
  - [ ] FinancialMovement.ts with all properties
  - [ ] MetricsFacets, MetricsSummaryItem, MetricsComparison, MetricsAlert, TopCategoryItem
  - [ ] Type enums (OperationType, Category, BusinessType)
  - [ ] index.ts barrel exports
- [ ] API client generated:
  - [ ] MetricsApi class with all 9 methods
  - [ ] Each method typed: params → Promise<Response>
  - [ ] runtime.ts with Configuration
- [ ] Generated code compiles: `tsc --noEmit`
- [ ] No manual types in `frontend/src/lib/financial-types.ts` needed (can be deprecated)

### ✅ Regeneration Automation (Completed when ALL pass)

- [ ] Script created to regenerate types (e.g., `npm run generate-api`)
  - [ ] Fetches `backend/openapi.json`
  - [ ] Runs `openapi-generator-cli generate`
  - [ ] Removes old generated files
  - [ ] Creates new generated files in `frontend/src/generated/api/`
- [ ] Regeneration instructions in README
- [ ] `.gitignore` updated to allow committing generated code (best practice for reproducibility)

### ✅ CI/CD Validation (Completed when ALL pass)

- [ ] `.github/workflows/api-contract.yml` validates contract on each PR:
  - [ ] Regenerates OpenAPI schema from backend code
  - [ ] Validates schema: `openapi-validator`
  - [ ] Regenerates TypeScript types
  - [ ] Compiles TypeScript: `tsc --noEmit`
  - [ ] Fails if generated files don't match committed (breaking change detected)
  - [ ] Fails if OpenAPI schema is invalid
- [ ] PR cannot merge without passing contract validation
- [ ] CI output clearly shows what changed (breaking vs non-breaking)

### ✅ Contract Tests (Completed when ALL pass)

- [ ] `backend/tests/test_contract.py` validates schema
  - [ ] Schema is valid OpenAPI 3.0.0
  - [ ] All endpoints documented
  - [ ] All responses have examples
  - [ ] All required fields documented
- [ ] `frontend/src/__tests__/api-contract.test.ts` validates types
  - [ ] Generated types compile
  - [ ] No `any` types (strict mode enforced)
  - [ ] API client methods have correct signatures
- [ ] Contract tests pass: `pytest backend/tests/test_contract.py && npm run test -- api-contract.test.ts`

### ✅ Frontend Refactoring (Completed when ALL pass)

- [ ] `frontend/src/App.tsx` updated to use `MetricsApi`
  - [ ] No more manual `fetch()` calls
  - [ ] Uses `metricsApi.getMetrics()`
  - [ ] Types imported from `@/generated/api`
- [ ] Manual type definitions in `frontend/src/lib/financial-types.ts` removed (or marked deprecated)
- [ ] Other frontend components can now use generated types directly
- [ ] Type-safety enforced: `tsc --strict` passes
- [ ] No TypeScript errors: `npm run type-check`

### ✅ Documentation (Completed when ALL pass)

- [ ] `README.md` updated with:
  - [ ] How to generate API types: `npm run generate-api`
  - [ ] When to regenerate (after backend changes)
  - [ ] How to verify types are in sync
  - [ ] Link to OpenAPI schema documentation
- [ ] API contract versioning strategy documented
- [ ] `.agents/rules/api-and-financial-data.md` updated with contract patterns

### ✅ Backward Compatibility (Completed when ALL pass)

- [ ] Generated types used throughout frontend
- [ ] All existing app functionality preserved
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (backend + frontend contract tests)
- [ ] E2E tests pass (if implemented from testing-strategy skill)
- [ ] No runtime behavior changed (refactoring only)

---

## IMPLEMENTATION PATTERNS

### Pattern 1: Enhance Pydantic Models

```python
# backend/app/routes.py
from pydantic import BaseModel, Field

class FinancialMovement(BaseModel):
    create_date: date = Field(
        description="Date of transaction (YYYY-MM-DD)",
        example="2026-01-15"
    )
    amount: float = Field(
        description="Transaction amount in base currency",
        gt=0,  # Validation: greater than 0
        example=5000.50
    )
    operation_type: OperationType = Field(
        description="Type of movement (income or expense)",
        example="income"
    )
    category: Category = Field(
        description="Category of transaction",
        example="sales"
    )
    business_type: BusinessType = Field(
        description="Business segment (B2B or B2C)",
        example="B2B"
    )
```

### Pattern 2: OpenAPI Generation

```python
# backend/main.py (new function)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Financial Dashboard API",
        version="1.0.0",
        description="API for financial metrics dashboard",
        routes=app.routes,
    )
    
    # Optional: Customize schema (add security, examples, etc.)
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Generate schema to JSON file for CI/CD
if __name__ == "__main__":
    import json
    schema = app.openapi()
    with open("openapi.json", "w") as f:
        json.dump(schema, f, indent=2)
```

### Pattern 3: TypeScript Generation Script

```bash
#!/bin/bash
# generate-api.sh

set -e

echo "📦 Generating OpenAPI schema from backend..."
cd backend
python -c "
from app.main import app
import json
schema = app.openapi()
with open('../openapi.json', 'w') as f:
    json.dump(schema, f, indent=2)
"
cd ..

echo "✨ Generating TypeScript types from schema..."
npx openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o frontend/src/generated/api \
  --skip-validate-spec

echo "✅ Types generated: frontend/src/generated/api/"
echo "💡 Commit generated files: git add frontend/src/generated/api/"
```

### Pattern 4: Use Generated Client

```typescript
// frontend/src/api-client.ts
import { MetricsApi, Configuration } from '@/generated/api'

export const metricsApi = new MetricsApi(
  new Configuration({
    basePath: import.meta.env.VITE_API_BASE_URL ?? '',
  })
)

// Export for use in components
export type * from '@/generated/api'
```

```typescript
// frontend/src/App.tsx (refactored)
import { metricsApi } from '@/api-client'

async function fetchFinancialData() {
  return metricsApi.getMetrics({})
}

// Usage in component:
const movements = await metricsApi.getMetrics({
  start_date: '2026-01-01',
  business_type: 'B2B'
})
```

---

## CHECKLIST: Implementation Steps

- [ ] **Phase 1: Enhance Backend Models**
  - [ ] Add `Field(description=..., example=...)` to all Pydantic models
  - [ ] Validate Pydantic definitions: `pydantic validate-schema app/routes.py`

- [ ] **Phase 2: Generate OpenAPI Schema**
  - [ ] Create script to generate `backend/openapi.json`
  - [ ] Run generator: `python -m app.main > openapi.json`
  - [ ] Validate schema: `openapi-validator openapi.json`
  - [ ] Test `/docs` endpoint serves valid schema

- [ ] **Phase 3: Setup Code Generation**
  - [ ] Install `openapi-generator-cli`: `npm install -D @openapi-generator/cli`
  - [ ] Create `generate-api.sh` script
  - [ ] Run generator: `bash generate-api.sh`
  - [ ] Verify generated code: `frontend/src/generated/api/models/*`

- [ ] **Phase 4: Refactor Frontend**
  - [ ] Import `MetricsApi` in `App.tsx`
  - [ ] Replace `fetch()` calls with API client
  - [ ] Update component imports from `@/generated/api`
  - [ ] Run `npm run type-check` → verify no errors
  - [ ] Run `npm run build` → verify no errors

- [ ] **Phase 5: Add Contract Tests**
  - [ ] Create `backend/tests/test_contract.py`
  - [ ] Create `frontend/src/__tests__/api-contract.test.ts`
  - [ ] Run tests: `pytest backend/tests/test_contract.py`
  - [ ] Run tests: `npm run test -- api-contract.test.ts`

- [ ] **Phase 6: CI/CD Integration**
  - [ ] Create `.github/workflows/api-contract.yml`
  - [ ] Workflow regenerates types on each PR
  - [ ] Workflow fails if types changed (requires regeneration)
  - [ ] Add status check to PR merge requirements

- [ ] **Phase 7: Documentation**
  - [ ] Update `README.md` with API generation instructions
  - [ ] Update `.agents/rules/api-and-financial-data.md`
  - [ ] Document contract versioning strategy

---

## SUCCESS METRICS

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| OpenAPI Schema | ❌ None | ✅ Valid | Phase 2 |
| Generated Types | ❌ Manual | ✅ Auto | Phase 3 |
| Type Duplication | 2x (Py+TS) | 1x (OpenAPI) | Phase 4 |
| Endpoints Documented | 0/9 | 9/9 with examples | Phase 2 |
| Contract Tests | ❌ None | ✅ Full | Phase 5 |
| Breaking Changes Detected | ❌ No | ✅ CI blocks | Phase 6 |

---

## REFERENCES

- **Backend API:** `backend/app/routes.py` (396 lines, 9 endpoints)
- **Frontend Types:** `frontend/src/lib/financial-types.ts`
- **Frontend Usage:** `frontend/src/App.tsx` (81 lines)
- **Gaps document:** `memory-bank/gaps-analysis.md#2-api-contract--codegen`
- **OpenAPI Spec:** https://www.openapis.org/
- **FastAPI OpenAPI:** https://fastapi.tiangolo.com/how-to/extending-openapi/
- **OpenAPI Generator:** https://openapi-generator.tech/
