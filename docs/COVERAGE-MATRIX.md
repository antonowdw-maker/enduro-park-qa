# Матрица покрытия (волна I)

Живая трассировка **F-\*** (требования) → **TC-\*** (ручные ТК) → **spec** (Playwright).  
Источник поведения: [`SYSTEM-REQUIREMENTS-v2.1.md`](SYSTEM-REQUIREMENTS-v2.1.md).  
Детали ТК: [`MANUAL-TEST-CASES-v1.2.md`](MANUAL-TEST-CASES-v1.2.md).  
Учебные баги: [`KNOWN-BUGS.md`](KNOWN-BUGS.md).

**Статусы:** `A` = automated · `M` = manual only · `EF` = expected-failure (teaching) · `N/A` = снято

Обновлять матрицу при каждой волне / merge с новыми TC или F-\*.

---

## Auth / session / CSRF

| F-* | TC-* | Spec | Level | Status | Note |
|-----|------|------|-------|--------|------|
| F-AUTH-01 | TC-AUTH-01 | `auth.spec.ts` | UI | A | + httpOnly cookie |
| F-AUTH-02 | TC-AUTH-01, TC-AUTH-02 | `auth.spec.ts`, `roles.spec.ts` | UI | A | |
| F-AUTH-03 | TC-AUTH-04 | `auth.spec.ts` | UI | A | |
| F-AUTH-04 | TC-ROLE-* | `roles.spec.ts`, `roles-api.spec.ts`, `bikes-crud-api.spec.ts` | UI+API | A | |
| F-AUTH-05 | TC-AUTH-06 | `auth-extra.spec.ts`, `security-csrf-ui.spec.ts` | UI | A | + CSRF header |
| F-AUTH-06 | TC-AUTH-07 | `roles.spec.ts`, `auth.spec.ts` | UI | A | |
| F-AUTH-07 | TC-AUTH-07 | `auth.spec.ts` | UI | A | |
| F-AUTH-08 | TC-AUTH-09 | `auth-extra.spec.ts` | UI | A | |
| F-AUTH-09 | TC-SEC-CSRF-* | `security-csrf-zod-api.spec.ts`, `security-csrf-ui.spec.ts` | UI+API | A | |
| F-AUTH-10 | TC-SEC-ZOD-01 | `security-csrf-zod-api.spec.ts` | API | A | |
| — | TC-AUTH-05 | — | UI | M | несуществующий user — gap |
| — | TC-AUTH-API-LIFECYCLE-01 | `auth-api.spec.ts` | API | A | JWT replay = факт стенда |
| — | TC-AUTH-RATE-LIMIT-01 | `auth-rate-limit-api.spec.ts` | API | A | isolated / opt-in |

---

## Bikes CRUD / validation

| F-* | TC-* | Spec | Level | Status | Note |
|-----|------|------|-------|--------|------|
| F-BIKE-CREATE-01…04 | TC-BIKE-CREATE, NEG-*, CREATE-VIN | `crud.spec.ts`, `validation.spec.ts` | UI | A | |
| F-BIKE-EDIT-01…03 | TC-BIKE-EDIT*, EDIT-VIN | `crud.spec.ts` | UI | A | |
| F-BIKE-DELETE-01…02 | TC-BIKE-DELETE | `crud.spec.ts` | UI | A | |
| API CRUD | TC-API-BIKE-* | `bikes-crud-api.spec.ts` | API | A | |
| — | TC-BIKE-NEG-06…09 | `known-bugs.spec.ts`, `validation.spec.ts`, `known-bugs-api.spec.ts` | UI+API | A/EF | BUG-03 |
| — | TC-BIKE-NEG-10 | `known-bugs.spec.ts`, `known-bugs-api.spec.ts` | UI+API | A/EF | BUG-02 |
| — | TC-BIKE-NEG-11…14, LAST-* | `validation.spec.ts` | UI | A | lastService |

---

## Filters / search / list / sort / seed

| F-* | TC-* | Spec | Level | Status | Note |
|-----|------|------|-------|--------|------|
| F-FILTER-01…10 | TC-FILTER-* | `filters.spec.ts` | UI | A | |
| F-FILTER-11…15 | TC-FILTER-BRAND/MODEL-* | `filters-brand-model.spec.ts`, `*-api.spec.ts` | UI+API | A | |
| F-FILTER-16 | TC-SEARCH-* | `search.spec.ts`, `bikes-query-api.spec.ts` | UI+API | A | |
| F-LIST-01…02 | TC-SEARCH-NEG-01, TC-LIST-ERROR-01 | `search.spec.ts` | UI | A | |
| Sort / pagination | TC-SORT-*, TC-PAGINATION-* | `sort-pagination.spec.ts` | UI | A | |
| API query | TC-API-LIMIT/OFFSET/… | `bikes-query-api.spec.ts` | API | A | normalize → 200 |
| Seed | TC-SEED-01…07 | `seed.spec.ts` | UI+CLI | A | |
| BUG-01 labels | — | `known-bugs.spec.ts` | UI | EF | |

---

## A11y / mobile

| F-* | TC-* | Spec | Level | Status | Note |
|-----|------|------|-------|--------|------|
| F-A11Y-01…02 | TC-A11Y-01…05 | `a11y-mobile.spec.ts` | UI | A | |
| F-MOBILE-01…03 | TC-MOBILE-01…05 | `a11y-mobile.spec.ts` | UI | A | |

---

## Security perimeter (волна G+)

| Topic | TC-* | Spec | Status |
|-------|------|------|--------|
| health/ready/headers/413 | TC-SEC-HEALTH/READY/HEADERS/BODY | `security-perimeter-api.spec.ts` | A |
| XSS notes | TC-SEC-XSS-01 | `security-xss.spec.ts` | A |
| CSRF/Zod | TC-SEC-CSRF/ZOD-* | `security-csrf-zod-api.spec.ts`, `security-csrf-ui.spec.ts` | A |

---

## Gaps (осознанные)

| ID | Почему открыто | Когда закрыть |
|----|----------------|---------------|
| TC-AUTH-05 | низкий приоритет vs AUTH-04 | волна I+ / по желанию |
| `KNOWN_BUGS_MODE=strict` CI job | suite красный, пока баги живы | opt-in, не в PR-гейте |
| npm audit в CI | шум транзитивных CVE | опционально позже |

---

## CI quality (волна I)

| Job | Что | Где |
|-----|-----|-----|
| `quality` | backend/frontend/e2e `typecheck`; frontend `lint` | `.github/workflows/e2e.yml` |
| `playwright` | Chromium E2E (после `quality`) | то же |
| nightly | 3 браузера, без дубля quality | `e2e-nightly.yml` |

Артефакты: см. [`e2e/README.md`](../e2e/README.md) § Artifacts.
