# Custom Agent Skills: Testing Strategy & API Contract/Codegen

## Resumen Ejecutivo

Este repositorio contiene **dos skills personalizadas profesionales** (P0 - Críticos) creadas para cubrir gaps específicos que las skills comunitarias instaladas no cubren.

### Los Dos Skills Entregados

#### 1. **Testing Strategy** (.agents/skills/testing-strategy/SKILL.md)
Cobertura completa de tests: backend (pytest), frontend (Vitest), e2e (Playwright)

- **Ubicación:** `.agents/skills/testing-strategy/SKILL.md` (15.5 KB)
- **Objetivo:** Backend ≥80% coverage, Frontend ≥70%, E2E 4 flows
- **Input:** Backend 30%, Frontend 10%, E2E 0%
- **Output:** 72+ tests, CI/CD pipeline, GitHub Actions
- **Acceptance Criteria:** 60+ items con checklists

#### 2. **API Contract & Codegen** (.agents/skills/api-contract-codegen/SKILL.md)
Una fuente de verdad (OpenAPI) + generación automática de tipos TypeScript

- **Ubicación:** `.agents/skills/api-contract-codegen/SKILL.md` (22.6 KB)
- **Objetivo:** Eliminar duplicación de tipos, sincronización automática
- **Input:** Tipos duplicados (Py+TS), solo 1/9 endpoints consumido
- **Output:** openapi.json, generated/api/ (~500 líneas), contract tests
- **Acceptance Criteria:** 60+ items con validación CI/CD

## Documentación Completa

### Análisis de Gaps
📄 **[memory-bank/gaps-analysis.md](memory-bank/gaps-analysis.md)**
- 6 gaps identificados (2 críticos, 2 altos, 2 medios)
- Evidencia específica del repo
- Tabla de prioridades

### Blueprints de Skills
📄 **[memory-bank/skill-testing-strategy.md](memory-bank/skill-testing-strategy.md)**
- Blueprint detallado de skill #1

📄 **[memory-bank/skill-api-contract.md](memory-bank/skill-api-contract.md)**
- Blueprint detallado de skill #2

### Índice y Navegación
📄 **[memory-bank/INDEX.md](memory-bank/INDEX.md)**
- Índice centralizado del memory bank
- Workflow de contribución

## Estructura de Cada Skill

Cada SKILL.md incluye:

```yaml
Metadatos:
  - Nombre, descripción, versión, referencia a gap

INPUT (Estado Actual):
  - Problema específico del repo
  - Archivos afectados con líneas
  - Evidencia cuantificada

OUTPUT (Resultado Esperado):
  - Archivos nuevos a crear
  - Líneas de código esperadas
  - Estructura de carpetas
  - Ejemplos concretos

ACCEPTANCE CRITERIA:
  - 60+ items con checklists específicas
  - Múltiples categorías (backend, frontend, ci/cd, docs, quality)

IMPLEMENTATION PATTERNS:
  - 4-10 ejemplos completos de código
  - Copy-paste ready (pytest, Vitest, Playwright, Pydantic, OpenAPI)

CHECKLIST:
  - 5-7 fases claras
  - 25-40 pasos específicos
  - Validación entre fases

SUCCESS METRICS:
  - Tabla: métrica | actual | target | timeline
```

## Cómo Usar

### Opción A: Testing Strategy Primero (2-3 días)
1. Leer: `.agents/skills/testing-strategy/SKILL.md`
2. Revisar: Todos los ACCEPTANCE CRITERIA
3. Seguir: Checklist Phase 1-5
4. Validar: Todo ✅ antes de siguiente skill

### Opción B: API Contract Primero (1-2 días)
1. Leer: `.agents/skills/api-contract-codegen/SKILL.md`
2. Revisar: OUTPUT esperado
3. Seguir: Checklist Phase 1-7
4. Validar: TS compilation sin errores

### Opción C: Paralelo (Recomendado - 2-3 días)
- Agent 1: Implementa Testing Strategy
- Agent 2: Implementa API Contract & Codegen

## Evidencia en el Repo

### Testing Gap
```
backend/tests/test_routes.py    → 204 líneas, solo 5-6 tests
frontend/src/__tests__/         → NO EXISTE
frontend/e2e/                   → NO EXISTE
Endpoints covered:              → 2/9 (health, metrics)
```

### API Contract Gap
```
backend/app/routes.py           → 396 líneas, 9 endpoints
frontend/src/lib/financial-types.ts → Tipos duplicados manualmente
frontend/src/App.tsx            → Consume solo 1/9 endpoints
```

## Métricas de Impacto

| Métrica | Hoy | Después |
|---------|-----|---------|
| Test Coverage Backend | 30% | ≥80% |
| Test Coverage Frontend | 10% | ≥70% |
| E2E Tests | 0 | 4 flows |
| Endpoints Documentados | 0/9 | 9/9 |
| Type Duplication | 2x | 1x |
| Breaking Changes CI | ❌ | ✅ |

## Próximos Pasos

**Hoy:**
1. Revisar gaps-analysis.md
2. Elegir cuál skill implementar primero
3. Leer SKILL.md correspondiente

**Esta semana:**
4. Crear rama feature/testing-strategy (o api-contract)
5. Seguir checklist del SKILL.md
6. Validar ACCEPTANCE CRITERIA
7. PR + merge

**Próximas 2 semanas:**
8. Implementar segundo skill
9. Evaluar Skills P1 (Error Handling, Data Validation)
10. Documentar como norma del equipo

## Punto de Inicio

👉 **Comienza aquí:** [memory-bank/gaps-analysis.md](memory-bank/gaps-analysis.md)

Luego elige:
- **Skill #1:** [.agents/skills/testing-strategy/SKILL.md](.agents/skills/testing-strategy/SKILL.md)
- **Skill #2:** [.agents/skills/api-contract-codegen/SKILL.md](.agents/skills/api-contract-codegen/SKILL.md)

Navega todo: [memory-bank/INDEX.md](memory-bank/INDEX.md)

## Commits Relacionados

```bash
e701689 feat: add two custom agent skills for P0 gaps (testing + api-contract)
72c2cc4 docs: gaps analysis & skills recommendations (testing + api-contract)
```

## Validación

✅ Objetivo claro para cada skill  
✅ Input definido con evidencia del repo  
✅ Output esperado especificado (archivos, líneas, cobertura)  
✅ Criterio de aceptación (60+ items con checklists)  
✅ Implementation patterns (10+ ejemplos de código)  
✅ Checklist ejecutable (25-40 pasos)  

---

**Branch:** `feature/agent-skills`  
**Estado:** ✅ Listo para Implementación
