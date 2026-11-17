# Agent Skills Selection & Justification

**Date:** 2026-11-17 03:33 UTC
**Branch:** feature/agent-skills

## Skills Installed

### 1. Accessibility (WCAG 2.2)
- **Source:** `addyosmani/web-quality-skills@accessibility` (71K installs)
- **Justification:** 
  - Financial dashboards must be accessible to all users, including those with disabilities
  - WCAG 2.2 AA compliance required for public-facing applications
  - Applied: lang attribute fix, aria-hidden on decorative icons, focus-visible styles
  - **Priority:** CRITICAL (legal/ethical requirement)

### 2. Vercel React Best Practices
- **Source:** `vercel-labs/agent-skills@vercel-react-best-practices` (904.3K installs)
- **Justification:**
  - Official Vercel engineering best practices for React optimization
  - Directly applicable to Vite + React 19 stack
  - Applied: Promise.all() for parallel data processing (async-parallel), bundle chunk separation for lucide-react
  - **Priority:** CRITICAL (deployment performance)
  - **Impact:** 2-10x improvement potential in data fetching, 15-70% faster dev boot

### 3. TypeScript Advanced Types
- **Source:** `wshobson/agents@typescript-advanced-types` (100.3K installs)
- **Justification:**
  - Project uses TypeScript 6 with complex financial data types (`FinancialMovement`, `KPIMetrics`, `MonthlyDataPoint`)
  - Financial calculations require type safety to prevent errors (currency, percentages, aggregations)
  - Enables better generic types, discriminated unions, and type inference for dashboard components
  - **Priority:** HIGH (code quality/maintainability)
  - **Applies to:**
    - `frontend/src/lib/financial-types.ts` (type definitions)
    - `frontend/src/lib/financial-utils.ts` (computations)
    - Components with complex props interfaces

### 4. TypeScript Best Practices
- **Source:** `cursor/plugins@typescript-best-practices` (11K installs)
- **Justification:**
  - Complements typescript-advanced-types with practical patterns
  - Ensures consistent TS coding standards across the team
  - Covers: strict mode enforcement, non-null assertions, type narrowing, and proper module organization
  - **Priority:** MEDIUM-HIGH (developer experience)
  - **Applies to:**
    - Build configuration (tsconfig.json settings)
    - Component type definitions and exports
    - Error handling patterns in React hooks

## Skills Not Selected (& Why)

### Performance Optimization
- **addyosmani/agent-skills@performance-optimization** (79.8K installs)
- **Why not:** Vercel React Best Practices already covers performance comprehensively; adding this would be redundant
- **Alternative:** Can be added later if specific performance audit is needed beyond Vercel patterns

### Vercel Optimize
- **vercel-labs/agent-skills@vercel-optimize** (132.6K installs)
- **Why not:** Covers deployment/infrastructure optimization; Frontend app doesn't deploy to Vercel infrastructure in current setup
- **Alternative:** Add if deploying to Vercel platform

## Implementation Priority

1. **Phase 1 (Complete):** Accessibility + Vercel React Best Practices
   - Merged: accessibility improvements + performance optimizations
   - Build validated: ✅ no new warnings

2. **Phase 2 (Ready for review):** TypeScript Advanced Types
   - Suggested: Review and strengthen type definitions in financial-types.ts
   - Consider: Discriminated unions for financial movements, branded types for currency

3. **Phase 3 (Recommended):** TypeScript Best Practices
   - Apply: Review tsconfig.json, enforce strict mode if not already set
   - Standardize: Component prop interfaces and error handling

## Repository Context

- **Stack:** React 19 + TypeScript 6 + Vite
- **Data Types:** Financial metrics require type safety (currency, percentages, time periods)
- **Quality Standards:** ESLint (8.58), TypeScript compilation (tsc -b)
- **Testing:** Vitest for unit tests, 5/5 currently passing

## Decision Record

**Chosen:** 4 skills total
- 2 critical (Accessibility, Vercel React)
- 2 high/medium (TypeScript skills)

**Rationale:** Covers three layers of quality:
1. User experience (Accessibility)
2. Performance/Deployment (Vercel)
3. Code quality/Maintainability (TypeScript)

All selections are based on:
- Popularity & community trust (high install counts)
- Direct applicability to current stack
- No redundancy between skills
- Security verified (Safe/Low Risk ratings from Gen, Socket, Snyk)
