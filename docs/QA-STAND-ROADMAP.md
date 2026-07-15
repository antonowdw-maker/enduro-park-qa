# Roadmap QA-стенда Enduro Park

**Дата обновления:** 15.07.2026  
**Статус:** волны **A–I** в `main` — EPM **завершён**. **J** (прокат) — отдельный репозиторий `willim-rental`, не в этом стенде.  
**Витрина проекта:** корневой [`README.md`](../README.md).  
**История итераций 1–10 / закрытый бэклог:** [`PROJECT-HISTORY.md`](PROJECT-HISTORY.md).  

**Процесс:** ветка от `main` → реализация → **двойное ревью** (fullstack TL + QA TL) → синхрон docs → коммит/пуш/merge **только по явному апруву**.  
**Коммиты — вариант B:** `type(scope): …` — `.cursor/rules/git-branch-commit.mdc`.

Источник аудита плана A…J: трассировка TC→E2E (чат 14.07.2026). Ниже — снимок **на старт** плана (частично устарел: A закрыла SEED-01/httpOnly).

---

## Снимок покрытия (на старт плана)

| Категория | Состояние |
|-----------|-----------|
| Ручные TC-* → Playwright | почти все активные **автоматизированы** |
| Частично | **TC-AUTH-01** — нет assert httpOnly cookie |
| Только лог / вне E2E | **TC-SEED-01** — детерминизм двух seed-прогонов |
| Намеренные баги | BUG-01…03 через `test.fail` |
| Снято | TC-AUTH-03 (guest) |

Матрица ТТД brand/model (без отдельных `###` в MANUAL) уже в `filters-brand-model*.spec.ts`.

Главный вывод: «добить ручные TC автотестами» — **маленький** кусок (A). Дальше ценность — устойчивость E2E, API/security ТТД, UX, затем крупный product (прокат).

---

## Порядок волн (рекомендуемый)

1. **A** → 2. **B** → 3. **C** (+ опц. **D**) → 4. **E** или **F** → 5. **G** / **H** / **I** → 6. **J** (эпик)

| Можно вместе | Не смешивать в одном PR |
|--------------|-------------------------|
| A + кусок H (доки багов) | **J** с мелкими волнами |
| B + кусок I (runbook E2E) | **G** (security) с **F** (a11y) |
| C + D («API глубина») если готов M+ | **E** (search) с **J** (rental) |

---

## Итерации

### A — остатки трассировки TC → авто  
**Статус:** ✅ сделано (`feature/qa-wave-a-tc-leftovers`)  
**Роли:** QA  
**Объём:** S  

- ✅ авто для **TC-SEED-01** (два seed / fingerprint)  
- ✅ **TC-AUTH-01:** `HttpOnly` + `SameSite=lax` (UI cookie + API Set-Cookie)  
- ✅ пометки `🤖` в MANUAL  

---

### B — flake-hunt + стабильность E2E  
**Статус:** ✅ сделано (`feature/qa-wave-b-flake-hunt`)  
**Роли:** QA, Dev  
**Объём:** M  

- ✅ wait на `GET /api/bikes` после фильтра / сортировки / пагинации (`runAndWaitForBikes`)  
- ✅ assert query params (+ soft expects точечно)  
- ✅ политика изоляции данных → `e2e/README`  

---

### C — API-контракт + ТТД на query  
**Статус:** ✅ сделано (`feature/qa-wave-c-api-query`)  
**Роли:** QA, СА  
**Объём:** M  

- ✅ негативы: `limit` / `offset` / `page`, невалидный `sortBy` / `order` / `status`  
- ✅ brand/model BVA 39/40/41 UI vs API maxLen 64; пробелы  
- ✅ LIKE `%` / `_` — задокументировано + тесты  
- ✅ формы ошибок API в SYSTEM-REQUIREMENTS §6.2  

---

### D — CRUD / Auth API глубина (не UI)  
**Статус:** ✅ сделано (`feature/qa-wave-d-crud-auth-api`)  
**Роли:** QA, Dev  
**Объём:** M  

- ✅ POST/PUT happy path + mechanic / admin / anonymous  
- ✅ unknown id, duplicate VIN на API, invalid body / mass-assignment  
- ✅ login → `/me` → logout → `/me`; cookie flags (+ Max-Age)  
- ✅ опц.: rate-limit — `auth-rate-limit-api.spec.ts` (RUN_RATE_LIMIT_E2E=1)  

---

### E — UI `search` + состояния списка  
**Статус:** ✅ сделано (`feature/qa-wave-e-search-ui`)  
**Роли:** BA, Dev, QA  
**Объём:** S–M  

- ✅ поле поиска (API `search`): debounce 300 ms, clear, empty  
- ✅ видимая ошибка загрузки списка + retry (`list-error` / `list-retry`)  
- ✅ E2E / API на search (классы эквивалентности)  

---

### F — a11y + мобильная таблица + компактный фильтр  
**Статус:** ✅ влита в `main` (`a9cae96`, 15.07.2026)  
**Роли:** BA, Dev, QA  
**Объём:** M  

- ✅ focus trap модалок (`useModalA11y`), Escape / Enter, accessible names edit/delete  
- ✅ `aria-sort` на sortable `<th>`; узкий viewport → карточки + `mobile-sort`; wrap статусов  
- ✅ компактный фильтр: search+статусы всегда; марка/модель/диапазоны за «Ещё»; адаптивная шапка  
- ✅ тесты: `e2e/tests/a11y-mobile.spec.ts` (TC-A11Y-* + TC-MOBILE-01…05); filters PO `expandAdvancedFilters`  

---

### G — security hardening стенда  
**Статус:** ✅ влита в `main` (15.07.2026)  
**Роли:** СА, Dev, QA, PM  
**Объём:** M–L  

- ~~CSRF для cookie-мутаций~~ → **сделано (slice2 + UI TC-SEC-CSRF-UI-*)**  
- ~~security headers, body size limit, health / ready~~ → **сделано (slice1)**  
- ~~rate-limit defaults~~ → **сделано (default on + DISABLE…)**  
- ~~XSS regression на notes~~ → **сделано (TC-SEC-XSS-01)**  
- ~~Zod / DTO на границе API~~ → **сделано (slice2)**  

---

### H — known-bugs как учебный контракт  
**Статус:** ✅ влита в `main` (15.07.2026)  
**Роли:** QA, PM, BA  
**Объём:** S–M  

- ~~каталог BUG-01…03: цель обучения, owner, `test.fail`, режим teaching / strict~~ → [`KNOWN-BUGS.md`](KNOWN-BUGS.md) + `KNOWN_BUGS_MODE`  
- ~~API-границы BUG-03 (1988 / 1989 / current+1 / +2)~~ → `known-bugs-api.spec.ts` (+ BUG-02)  
- ~~не путать демо-баги с «production-ready»~~ → явный disclaimer в каталоге / §7  

---

### I — матрица покрытия + CI quality gates  
**Статус:** ✅ влита в `main` (15.07.2026)  
**Роли:** QA, PM, Dev  
**Объём:** S–M  

- ~~живая матрица F-* ↔ TC-* ↔ spec~~ → [`COVERAGE-MATRIX.md`](COVERAGE-MATRIX.md)  
- ~~в CI: typecheck / lint рядом с E2E~~ → job `quality` в `e2e.yml` (playwright `needs: quality`)  
- ~~единообразие артефактов trace / report~~ → `e2e/README` § Artifacts + имена `playwright-report-chromium` / nightly-`{browser}`  

---

### J — домен «прокат / аренда»  
**Статус:** ⏸ **не в этом стенде** — отдельный продукт/репозиторий `willim-rental`.  
Enduro Park Manager (A–I) завершён. Прокат «Виллим на чилле» туда не входит.

---

## Идеи с ролей (кратко, для приоритизации)

| Роль | Фокус в плане |
|------|----------------|
| **BA** | E (search), F (mobile UX), политика удаления; прокат → `willim-rental` |
| **СА** | C/D (контракты), G (security/headers/health) |
| **QA** | A, B, C, D, TTD, flake, матрица I, known-bugs H |
| **Dev** | B waits, E/F UI, G hardening |
| **PM** | порядок волн A–I, teaching-mode багов; прокат вне EPM |

Сознательно **не** в приоритете без отдельного запроса: i18n, dark mode.

---

## Чеклист прогресса

- [x] A — TC leftovers  
- [x] B — flake-hunt  
- [x] C — API query ТТД  
- [x] D — CRUD/Auth API  
- [x] E — search UI + list errors  
- [x] F — a11y / mobile  
- [x] G — security → `main`  
- [x] H — known-bugs contract → `main` (15.07.2026)  
- [x] I — coverage matrix + CI gates → `main` (15.07.2026)  
- [~] J — rental epic → **⏸** не в EPM; репо `willim-rental`

После завершения волны: отметить `[x]` здесь **и в корневом README** (секция «Дальше» / статус); статус «✅» в теле волны; запись ревью в `IMPLEMENTATION-NOTES.md`. Историю чеклистов не копировать в README — см. `PROJECT-HISTORY.md`.
