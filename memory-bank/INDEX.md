# Memory Bank Index

**Última actualización:** 2026-11-17 03:50 UTC  
**Rama activa:** feature/agent-skills

Este índice organiza toda la información de contexto del proyecto financial-dashboard.

---

## 📋 Documentos por Tema

### 🎯 Project Overview & Planning
- **[overview.md](overview.md)** — Snapshot del proyecto, stack tecnológico, estado actual
  - Qué es: Dashboard web de métricas financieras
  - Stack: React 19 + TypeScript 6 + FastAPI + Vite
  - Estado: Funcional con 17 backend tests + 5 frontend tests
  - Gaps conocidos: Datos sintéticos, API parcialmente consumida, CORS amplio

### 🛠️ Agent Skills Selection & Justification
- **[agent-skills-selection.md](agent-skills-selection.md)** — Decisiones & justificación de 4 skills instaladas
  - ✅ Installed: Accessibility, Vercel React, TypeScript (Advanced + Best Practices)
  - Justificación: Crítica (legal), crítica (performance), alta (mantenibilidad)
  - Cambios aplicados en frontend (2 commits)

### 🔍 Gaps Analysis & Recommendations
- **[gaps-analysis.md](gaps-analysis.md)** — 6 gaps que las skills comunitarias **NO cubren**
  - Tabla de prioridad: 2 críticos (P0), 2 altos (P1), 2 medios (P2)
  - Evidencia en repo: líneas de código, archivos específicos
  - **Recomendación:** Crear 2 skills personalizadas (Testing + API Contract)

### 🧪 Skill #1: Testing Strategy (P0 - Crítico)
- **[skill-testing-strategy.md](skill-testing-strategy.md)** — Blueprint para testing completo
  - **Cobertura actual:** Backend 30%, Frontend 10%, E2E 0%
  - **Patrón 1:** pytest con fixtures y parametrización (FastAPI)
  - **Patrón 2:** Vitest + React Testing Library (componentes, hooks)
  - **Patrón 3:** Playwright (E2E user flows)
  - **Setup:** Checklist + CI/CD pipeline
  - **Beneficio:** Cobertura completa + confianza en refactors

### 📡 Skill #2: API Contract & Codegen (P0 - Crítico)
- **[skill-api-contract.md](skill-api-contract.md)** — Blueprint para sincronización de tipos
  - **Problema:** Tipos duplicados (Python + TypeScript, sin sincronización)
  - **Oportunidad:** Frontend consume 1/9 endpoints
  - **Solución:** OpenAPI schema → TypeScript codegen automático
  - **Setup:** OpenAPI generation, generador CLI, contract tests
  - **CI/CD:** Regeneración automática + validación breaking changes
  - **Beneficio:** Una fuente de verdad + type-safety + documentación automática

---

## 🏗️ Architecture & Organization

### Application Structure
```
frontend/
  ├─ src/
  │  ├─ App.tsx                     — Hook async, fetch, estado
  │  ├─ main.tsx                    — Entry point
  │  ├─ components/dashboard/       — DashboardHeader, KPIRow, Charts
  │  └─ lib/
  │     ├─ financial-types.ts       — TypeScript interfaces
  │     └─ financial-utils.ts       — Computación de KPIs
  ├─ package.json                   — React 19, Vite 8, Tailwind 4
  └─ vite.config.ts                 — Proxy /api → backend:8000

backend/
  ├─ app/
  │  ├─ main.py                     — FastAPI app + CORS
  │  ├─ routes.py                   — 9 endpoints (metrics, facets, summary, etc.)
  │  └─ tests/                      — pytest, 17 tests passing
  ├─ Dockerfile                     — python:3.13-slim
  └─ requirements.txt               — FastAPI, Pydantic, Uvicorn

docker-compose.yml                  — frontend (5173) + backend (8000)
```

---

## 🎓 Key Concepts & Terminology

| Término | Definición | Ref. |
|---------|-----------|------|
| **KPI Metrics** | Key Performance Indicators: income, outcome, net profit, margin % | overview.md |
| **FinancialMovement** | Transacción: amount, operation_type (income/outcome), category, date, business_type | financial-types.ts |
| **Mock Data** | Movimientos sintéticos generados con `seed=42`, no persistencia real | overview.md, Gaps #5 |
| **Outcome** | Gastos/egresos (no es "income") — ver `operation_type` | App.tsx |
| **B2B/B2C** | Segmentación de negocio: Business-to-Business vs Business-to-Consumer | routes.py |
| **OpenAPI Schema** | Documentación de API en formato estándar, genera /docs automáticamente | skill-api-contract.md |
| **Type Codegen** | Generación automática de tipos TypeScript desde OpenAPI | skill-api-contract.md |

---

## 📊 Current Status Summary

| Aspecto | Estado | Detalles |
|--------|--------|----------|
| **Core App** | ✅ Funcional | Dashboard con 4 KPIs + 2 gráficos |
| **Backend API** | ✅ 9 endpoints | 17 tests, mock data |
| **Frontend Tests** | ⚠️ Parcial | 5 tests, solo financial-utils.ts |
| **Accessibility** | ✅ WCAG 2.2 AA | Aplicada en rama (accessibility commit) |
| **Performance** | ✅ Optimizando | Vercel React Best Practices aplicada |
| **TypeScript** | ✅ Tipado | 4 skills de TS instaladas |
| **Testing** | ❌ Gap crítico | 0% E2E, 30% backend, 10% frontend |
| **API Contract** | ❌ Gap crítico | Tipos duplicados, sin sincronización |
| **Error Handling** | ⚠️ Parcial | catch{} genérico, sin retry |
| **Validation** | ⚠️ Parcial | Pydantic sin validators custom |

---

## 🚀 Recommended Next Steps

### Immediate (This Week)
1. **Review** gaps-analysis.md para entender cobertura
2. **Prioritize** Testing vs API Contract (cuál implementar primero?)
3. **Plan** alcance de skill personalizada

### Short Term (Next Sprint)
4. **Implement** Skill #1 (Testing) o Skill #2 (API Contract)
5. **Integrate** en CI/CD pipeline
6. **Document** proceso en .agents/rules/

### Medium Term
7. Skill #3 (Error Handling & Resilience)
8. Skill #4 (Data Validation & Schema)
9. Environment Configuration templates
10. Observability & Metrics setup

---

## 📌 Quick Reference

### Problemas Identificados (Con Línea Código)
```
1. Backend: random.seed(42) global                    → app/routes.py:220
2. Frontend: catch { } genérico                       → App.tsx:42-45
3. Tipos duplicados (Py + TS)                         → financial-types.ts vs app/routes.py
4. CORS amplio con credenciales                       → app/main.py
5. Bundle chunk > 500 KB                              → build output
6. API no documentada con ejemplos                    → app/routes.py endpoints
```

### Archivos Críticos
- **Frontend:** `frontend/src/App.tsx` (81 líneas, hook async)
- **Backend:** `backend/app/routes.py` (396 líneas, 9 endpoints)
- **Tests:** `backend/tests/test_routes.py` (204 líneas, 5-6 tests)
- **Types:** `frontend/src/lib/financial-types.ts` (tipo definitions)

---

## 📚 Sources & References

**Skills Usadas:**
- Accessibility (addyosmani/web-quality-skills) — WCAG 2.2 AA compliance
- Vercel React Best Practices (vercel-labs) — Performance optimization
- TypeScript Advanced Types (wshobson/agents) — Complex financial types
- TypeScript Best Practices (cursor/plugins) — TS coding standards

**External Docs:**
- FastAPI: https://fastapi.tiangolo.com/
- React 19: https://react.dev/
- OpenAPI: https://www.openapis.org/
- TypeScript: https://www.typescriptlang.org/

---

## 🔄 Document Workflow

Cuando trabajes en el proyecto:

1. **Antes de cambios:** Consulta `overview.md` + el gap específico (gaps-analysis.md)
2. **Durante la skill:** Sigue el blueprint (skill-testing-strategy.md o skill-api-contract.md)
3. **Después:** Actualiza este índice si hay nuevos documentos
4. **En commits:** Referencia gaps-analysis.md o skill-*.md si aplica

---

## 🤝 Contributing

Si creas una nueva skill personalizada:

1. Crea `memory-bank/skill-[nombre].md` con estructura:
   - Oportunidad (estado actual + problema)
   - Qué cubre (patrones concretos + ejemplos)
   - Setup & automatización (CI/CD)
   - Checklist de implementación
   - Beneficios esperados

2. Referencia en este índice bajo sección correspondiente

3. Linkea desde gaps-analysis.md si es respuesta a gap

---

**Mantén este índice actualizado como source of truth del memory bank.**
