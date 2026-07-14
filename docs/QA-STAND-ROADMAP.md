# Roadmap QA-стенда Enduro Park (после закрытия бэклога «на подумать»)

**Дата:** 14.07.2026  
**Статус:** план принят, код ещё не начинали (итерации A…J).  
**Процесс:** каждая волна — отдельная ветка от актуального `main` → реализация → QA (часто headed + `SLOW_MO`) → коммит/пуш/merge **только по явному апруву**.

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
**Статус:** ⏳ не начата  
**Роли:** QA  
**Объём:** S  

- авто для **TC-SEED-01** (два seed / сравнение summary или хэша набора)  
- **TC-AUTH-01:** assert `HttpOnly` на Set-Cookie при login (API / headers)  
- дописать в MANUAL пометки `🤖`, где ещё частично  

---

### B — flake-hunt + стабильность E2E  
**Статус:** ⏳ не начата  
**Роли:** QA, Dev  
**Объём:** M  

- wait на `GET /api/bikes` после фильтра / сортировки / пагинации  
- assert query params + строки после обновления данных  
- политика изоляции данных (явный re-seed / cleanup) → `e2e/README`  
- опц.: grouped expect для независимых проверок  

---

### C — API-контракт + ТТД на query  
**Статус:** ⏳ не начата  
**Роли:** QA, СА  
**Объём:** M  

- негативы: `limit` / `offset` / `page`, невалидный `sortBy` / `order` / `status`  
- brand/model BVA 39/40/41 UI vs API maxLen 64; пробелы  
- LIKE `%` / `_` — задокументировать факт + тесты  
- описать формы ошибок API в доках  

---

### D — CRUD / Auth API глубина (не UI)  
**Статус:** ⏳ не начата  
**Роли:** QA, Dev  
**Объём:** M  

- POST/PUT happy path + mechanic / admin / anonymous  
- unknown id, duplicate VIN на API, invalid body / mass-assignment  
- login → `/me` → logout → `/me`; cookie flags  
- опц.: rate-limit при включённом флаге  

*Можно объединять с C в одну волну «API глубина».*

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

- [ ] A — TC leftovers  
- [ ] B — flake-hunt  
- [ ] C — API query ТТД  
- [ ] D — CRUD/Auth API  
- [ ] E — search UI + list errors  
- [ ] F — a11y / mobile  
- [ ] G — security  
- [ ] H — known-bugs contract  
- [ ] I — coverage matrix + CI gates  
- [ ] J — rental epic  

После завершения волны: отметить `[x]`, статус «✅», ссылка на merge-commit / PR в этой таблице или в `IMPLEMENTATION-NOTES.md`.
