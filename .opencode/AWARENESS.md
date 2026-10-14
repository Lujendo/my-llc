# MY-LLC Dashboard — Codebase Awareness

_Snapshot: 2026-10-14 · Owner: coordinator · Refresh when architecture materially changes._

## 1. What this is

**MY-LLC Dashboard** — B2C SaaS for **foreign-resident LLC owners (non-resident aliens)** to manage
US LLC tax compliance: deadline timeline, compliance checklists, treaty analysis, and document
generation (W-7 ITIN application, state operating agreements, treaty memos).
Multi-entity, multi-jurisdiction (US federal + state + home country).

## 2. Stack

- **Runtime:** Cloudflare Workers (edge). Entry: `src/worker/index.ts`.
- **Frontend:** React 19 + Vite 7 + Tailwind v4. SPA with state-based views; `/terms` and `/privacy` are real paths.
- **Backend:** Hono 4 on Workers.
- **DB:** Cloudflare D1 (SQLite), binding `DB`.
- **Auth:** JWT (HS, 15 min) via `hono/jwt`; passwords PBKDF2-SHA256 (100k iters, WebCrypto).
- **PDF/docs:** `pdf-lib` (client-side). **IDs:** `uuid`. **Icons:** `lucide-react`.
- **Design system:** 19 semantic color tokens (light/dark) in `tailwind.config.ts` + `src/react-app/index.css`; `cn()` in `lib/utils.ts`; hand-rolled primitives in `components/UI/` (button, card, dialog, tabs, input, label, checkbox, textarea, badge, alert, spinner). Legacy `*Legacy.tsx` variants retained.
- **Charts/calendar:** zero-dependency — custom Gantt + calendar views, no chart/date libs.
- No ORM — direct parameterized D1 queries.

## 3. Repo map

**Root docs** (planning / legal / status): AGENT-TEAM-EXECUTION-PLAN, MASTER-EXECUTION-SUMMARY,
DASHBOARD_SPECIFICATION, LEGAL_COMPLIANCE_GATE, PRODUCTION_LEGAL_COMPLIANCE_ROADMAP,
STAGING-TEST-PLAN, STAGING-READY, DEPLOYMENT, PRODUCTION-DEPLOY, BACKEND_README, WEEK_1_DELIVERY.

**Root smoke scripts** (plain node): smoke-test.{js,mjs,ts}, w7-smoke, oa-smoke, journey-smoke,
states-smoke, legal-smoke, rate-limit-burst, browser-test, smoke-check-node.

**`audit-archive/`** — legal-review submission packages. **`content/`** — legal + form content
(TERMS, PRIVACY, W-7 spec, OA templates, tax disclaimers).

**`src/worker/`**
- `index.ts` — Hono app: middleware (cors `*`, secureHeaders, bodyLimit 100KB), rate limits, health, route mounts, 404 → SPA assets.
- `routes/` auth.ts, entities.ts, tasks.ts, documents.ts, holdings.ts, calendarEvents.ts, me.ts
- `services/` authService, entityService, taskService, holdingService, calendarEventService, accountService
- `middleware/` auth.ts (authGuard / getUserContext), rateLimit.ts, errorHandler.ts
- `db/` schema.sql, queries.ts (`Database` class), seed.sql, migrations/0001–0004
- `utils/` hash, jwt, id, validate, errors, serialize · `types/` index.ts

**`src/react-app/`**
- `App.tsx` — view router + auth gate
- `components/` Dashboard, Checklist, Timeline, TreatyAnalyzer, DocumentGenerator, EntityManager, Settings, LegalPage, LegalCopy, CookieConsent, Footer, Navigation, AuthForms, `HoldingHub` + `HoldingListView` / `HoldingTimeline` / `HoldingCalendar`, `AppShell` (sidebar — **not wired into `App.tsx`**), `UI/*`
- `hooks/` useAuth, useEntities, useTasks, useHoldings
- `lib/` api, legal, oa, treaty, states, w7, acceptance, smoke-check, holdings, date, calendar · `types/`

## 4. API (base `/api`)

- `GET /api/health`
- **auth:** `POST /register`, `POST /login`, `POST /logout`; `GET /me`
- **entities:** `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- **tasks:** `GET /?entity_id=`, `GET /:id`, `PATCH /:id`, `GET /upcoming?entity_id=&days=`
- **documents:** `POST /acceptance` (records ToS/privacy/w7/oa/treaty_memo acceptance)
- **holdings:** `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` (subtree delete); `POST /:id/parent` (cycle-rejected), `GET|POST /:id/members`, `DELETE /:id/members/:entityId`, `GET /:id/consolidated`
- **calendar-events:** `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- **me:** `DELETE /` (account erasure, all 10 tables), `GET /export` (JSON dump of all user data)

## 5. Data model (D1)

Tables: `users`, `entities`, `tasks`, `documents`, `notifications`, `rate_limits`, `document_acceptances`, `holdings`, `holding_relationships`, `holding_members`, `calendar_events`.
- Task `section` CHECK: `Formation | ITIN | Federal | Germany | Banking | Ongoing`.
- Document `type` CHECK: `W-7 | OperatingAgreement | TreatyMemo`.
- Enums enforced via SQL CHECK constraints.
- **Holdings (migration 0004):** `holdings` = legal-entity wrapper (jurisdiction, base currency, effective dates); parent links live in `holding_relationships` (temporal history — current parent = row with `effective_to IS NULL`); `holding_members` = entity membership over time. A **constellation root** = a holding with no active relationship as child. `tasks` gained `start_time` / `end_time` / `is_all_day`; `calendar_events` carries `source` CHECK (`system | user`).

## 6. Auth & security posture

- Bearer JWT (15 min), **no refresh flow**; logout is stateless.
- PBKDF2-SHA256 100k iters (Workers WebCrypto ceiling); legacy SHA256 hashes auto-upgrade on next login.
- Rate limiting via D1 fixed-window table (`rate_limits`).
- `secureHeaders` + CSP on `/api/*`; `bodyLimit` 100 KB.
- **⚠️ CORS `origin: "*"`** — only acceptable while auth is Bearer-token (no cookies). Lock to `CORS_ORIGIN` before adding cookie sessions.
- Row ownership enforced in services (users only touch their own entities/tasks).

## 7. Environments / deploy

- **local:** `my-llc-db` (`database_id: "local"`) via `wrangler dev`.
- **staging:** worker `my-llc-staging` — live at https://my-llc-staging.info-eac.workers.dev
- **production:** worker `my-llc` — live at https://my-llc.info-eac.workers.dev. **CI-managed by Cloudflare Workers Builds** (GitHub `Lujendo/my-llc`, branch `main`, root `/`); every push to `main` runs `npm run build` + `npm run deploy`. Manual fallback: `wrangler deploy --env production -c wrangler.json`. Prod D1 = `my-llc-production` (id `2d82b8d3-9d22-4c03-a9a2-a6defbb94d0e`, region EEUR), shared by the workers. Worker secret `JWT_SECRET` set on `my-llc`.
- **⚠️ Deploy gotcha:** a bare `wrangler deploy` does **not** use the root `wrangler.json` — it follows `.wrangler/deploy/config.json` → `dist/my_llc/wrangler.json` (Vite-generated), which bakes in the default env's D1 (`my-llc-db`, `database_id: "local"`, a placeholder). Remote deploy then fails with `binding DB of type d1 must have a valid database_id specified [code: 10021]`. Always pass `--env production -c wrangler.json`.
- **Deprecated:** the *worker* named `my-llc-production` is an unused former placeholder — do not deploy to it. (The *D1 database* of the same name is the real production DB and is not deprecated.)
- Scripts: `dev`, `build` (tsc -b && vite build), `check`, `deploy` (`wrangler deploy --env production -c wrangler.json`), `lint`, `preview`; smoke: `test:w7`, `test:oa`, `test:journey`. Holding Hub smoke scripts run directly via node (not npm-wired): `src/worker/db/holdings-calendar-smoke.mjs`, `src/react-app/lib/{holdings,date,calendar}.smoke.mjs`.

## 8. Current status (as of 2026-10-14)

Per MASTER-EXECUTION-SUMMARY / AGENT-TEAM-EXECUTION-PLAN:
- ✅ Staging live (Oct 13). Planning / docs complete.
- ✅ **Holding Hub built** (Oct 14): design system (Phase 0), holdings/calendar backend + compliance (Phase 1/1b), `HoldingHub` UI with 4 tabs — Constellation (tree + KPIs), List (`grouped|list`), Timeline (custom Gantt), Calendar (Month/Week/Day/Year, drag-to-move, CRUD) (Phases 2–3).
- ⏳ QA internal testing Oct 16–20 (4 personas: Maria IT→DE, James CA→US, Chen CN→SG, Bruno BR→UK).
- ⏳ Agent legal review Oct 21–27 (federal_advisor_us, international_law, commercialista_italiano, steuerberater_de, legal).
- ⬜ Committee sign-off Oct 28 → prod prep Nov 4–13 → **LAUNCH Nov 15, 2026**.

## 9. Known debt / risks / doc drift

- **Doc drift:** `BACKEND_README.md` says password hashing = "SHA256 + salt" and rate-limiting is a "next step" — both are stale. Code is PBKDF2 (`utils/hash.ts`) and rate limiting is implemented. **Trust code over root docs.**
- **No test framework wired** — only ad-hoc node smoke scripts; no `test` npm script beyond smoke wrappers.
- JWT 15 min with no refresh — session UX risk.
- CORS wildcard (see §6).
- **Scope docs lag code:** MASTER-EXECUTION-SUMMARY lists treaty analyzer, FBAR/FATCA, and multi-entity as Phase-2/not-in-MVP, but `TreatyAnalyzer`, `DocumentGenerator`, and `EntityManager` already ship in `src/react-app/components/`.
- `audit-archive/` currently holds only one feature package (compliance-checklist-deadlines).
- **Holding Hub deferred:** event resizing, Google Calendar import, and `AppShell` sidebar wiring into `App.tsx` are not done.

## 10. Open questions

- Pricing model (free vs freemium $5–15/mo) undecided.
- Custom domain `my-llc.dev` not yet configured.
- Confirm all five legal sign-offs recorded before the Nov 15 gate.
- **Legal `[CONFIRM]` items** in `content/legal/PRIVACY-POLICY.md`: EU/UK transfer mechanism, Art. 27 EU representative, UK representative. Retention schedule + erasure runbook need human counsel. (Privacy Policy at `PRIVACY_VERSION v1.1`.)
