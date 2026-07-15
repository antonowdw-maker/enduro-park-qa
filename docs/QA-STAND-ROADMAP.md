# Roadmap QA-стенда Enduro Park (после закрытия бэклога «на подумать»)

**Дата:** 14.07.2026  
**Статус:** волны A–D + TL-hotfix в `main`; E…J — план.  
**Процесс:** ветка от `main` → реализация → **двойное ревью** (fullstack TL + QA TL) → синхрон docs (README!) → коммит/пуш/merge **только по явному апруву**.  
**Коммиты — вариант B:** `type(scope): …` (например `test(e2e):`, `feat(frontend):`) — `.cursor/rules/git-branch-commit.mdc`.

Источник аудита: трассировка TC→E2E, ТТД/flake, роли BA/СА/QA/Dev/PM (чат 14.07.2026).

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
**Статус:** ⏳ не начата  
**Роли:** BA, Dev, QA  
**Объём:** S–M  

- поле поиска (API `search` уже есть): debounce, clear, empty  
- видимая ошибка загрузки списка (сейчас silent empty) + retry  
- E2E / API на search (классы эквивалентности)  

---

### F — a11y + мобильная таблица  
**Статус:** ⏳ не начата  
**Роли:** BA, Dev, QA  
**Объём:** M  

- focus trap модалок, Escape / Enter, accessible names edit/delete  
- `aria-sort`, узкий viewport / альтернатива горизонтальному `min-w-[1100px]`  
- тесты keyboard + viewport  

---

### G — security hardening стенда  
**Статус:** ⏳ не начата  
**Роли:** СА, Dev, QA, PM  
**Объём:** M–L  

- CSRF для cookie-мутаций  
- security headers, body size limit, health / ready  
- rate-limit defaults (не только «выкл в демо»)  
- XSS regression на notes (create → reload)  
- Zod / DTO на границе API  

---

### H — known-bugs как учебный контракт  
**Статус:** ⏳ не начата  
**Роли:** QA, PM, BA  
**Объём:** S–M  

- каталог BUG-01…03: цель обучения, owner, `test.fail`, режим teaching / strict  
- API-границы BUG-03 (1988 / 1989 / current+1 / +2)  
- не путать демо-баги с «production-ready»  

---

### I — матрица покрытия + CI quality gates  
**Статус:** ⏳ не начата  
**Роли:** QA, PM, Dev  
**Объём:** S–M  

- живая матрица F-* ↔ TC-* ↔ spec  
- в CI: typecheck / lint (+ опц. audit) рядом с E2E  
- единообразие артефактов trace / report  

---

### J — домен «прокат / аренда» (крупный product-эпик)  
**Статус:** ⏳ не начата  
**Роли:** BA, СА, Dev, QA, PM  
**Объём:** L  

- сущности аренда / клиент, статусы, запрет double-book / repair / sold  
- audit trail мутаций  
- политика delete vs archive  
- полный набор требований + ТК + E2E  

**Не смешивать** с волнами A–I в одном PR / одной ветке.

---

## Идеи с ролей (кратко, для приоритизации)

| Роль | Фокус в плане |
|------|----------------|
| **BA** | E (search), F (mobile UX), J (прокат), политика удаления |
| **СА** | C/D (контракты), G (security/headers/health), модель аренды в J |
| **QA** | A, B, C, D, TTD, flake, матрица I, known-bugs H |
| **Dev** | B waits, E/F UI, G hardening, J реализация |
| **PM** | порядок волн, scope J, teaching-mode багов, не раздувать PR |

Сознательно **не** в приоритете без отдельного запроса: i18n, dark mode.

---

## Чеклист прогресса

- [x] A — TC leftovers  
- [x] B — flake-hunt  
- [x] C — API query ТТД  
- [x] D — CRUD/Auth API  
- [ ] E — search UI + list errors  
- [ ] F — a11y / mobile  
- [ ] G — security  
- [ ] H — known-bugs contract  
- [ ] I — coverage matrix + CI gates  
- [ ] J — rental epic  

После завершения волны: отметить `[x]` здесь **и в корневом README**; статус «✅»; запись ревью в `IMPLEMENTATION-NOTES.md`.
