# PRODUCTION DEPLOY — MY-LLC Dashboard

**Status: DEPLOYED** at `https://my-llc.info-eac.workers.dev`.

Prod Worker name: `my-llc` (via the `env.production.name` override in `wrangler.json`)
Production URL: `https://my-llc.info-eac.workers.dev`

> **Name override:** `env.production.name = "my-llc"` cancels wrangler's default
> `--env production` suffix, so production deploys to the **`my-llc`** worker
> (not `my-llc-production`). Production deploys **must** use
> `npx wrangler deploy --env production -c wrangler.json`.

---

## The one trap to remember

A bare `wrangler deploy` in this repo **does not use `wrangler.json`**. It reads
`.wrangler/deploy/config.json`, which redirects to the Vite build artifact
`dist/my_llc/wrangler.json`. In the old config that artifact baked in the
**plaintext** `JWT_SECRET`, and it points at the wrong D1.

**Always pass `-c wrangler.json`.** Every command below does.

---

## Preconditions (already done during prep)

| Item | Value |
|------|-------|
| Production D1 | `my-llc-production` |
| D1 `database_id` | `2d82b8d3-9d22-4c03-a9a2-a6defbb94d0e` |
| Region | EEUR |
| Worker secret `JWT_SECRET` | set on `my-llc-production` (value never recorded here) |
| Schema | base `schema.sql` + migrations `0001`, `0002`, `0003` applied; verified byte-identical to staging |
| `wrangler.json` | zero plaintext secrets |

Verify preconditions any time:

```bash
# D1 exists and has the migrated schema
npx wrangler d1 list | grep my-llc-production
npx wrangler d1 execute my-llc-production --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
# → document_acceptances, documents, entities, notifications, rate_limits, tasks, users

# Secret is present (names only)
npx wrangler secret list --env production -c wrangler.json
# → [{ "name": "JWT_SECRET", "type": "secret_text" }]
```

---

## Step 1 — Deploy

```bash
cd "/Volumes/Mini Media/Augment Code 2026/my-llc-dashboard"
npx wrangler deploy --env production -c wrangler.json
```

Expected output: `Uploaded my-llc-production` + `Current Version ID: <id>`.
Record the Version ID — it is the rollback target reference.

The assets binding (`ASSETS` → `./dist/client`) is defined at the top level of
`wrangler.json` and is inherited by `env.production`, same as staging. No
`--env`-specific assets block is needed. Ensure `dist/client` is built
(`npm run build`) before deploying if the frontend changed.

## Step 2 — Post-deploy smoke checks

Run against the prod URL; expect the codes shown.

```bash
BASE="https://my-llc-production.info-eac.workers.dev"
EMAIL="smoke-$(date +%s)@example.com"
PASS="Verification-Pass-2026!"

# register → 201 (requires consent)
curl -s -o /tmp/r.json -w "%{http_code}\n" -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"Smoke\",\"citizenship\":\"US\",\"residency\":\"DE\",\"consent\":{\"acceptedTerms\":true,\"acceptedPrivacy\":true}}"

# login → 200
curl -s -o /tmp/l.json -w "%{http_code}\n" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}"

# /me with token → 200
TOKEN=$(node -e "console.log(require('/tmp/l.json').data.token)")
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN"

# /me without token → 401
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/api/auth/me"

# SPA asset served (no 404)
curl -s -o /dev/null -w "%{http_code}\n" "$BASE/"
```

Pass = `201 / 200 / 200 / 401 / 200`.

## Step 3 — Rollback

**Code rollback** (previous Worker version):

```bash
npx wrangler versions list --env production -c wrangler.json
npx wrangler rollback --env production -c wrangler.json            # previous version
# or pin a specific version:
npx wrangler versions deploy <VERSION_ID>@100% --env production -c wrangler.json
```

**Data rollback** (D1 Time Travel — point-in-time, ~30 days, act fast):

```bash
npx wrangler d1 time-travel info my-llc-production
npx wrangler d1 time-travel restore my-llc-production --timestamp="<ISO-8601>"
```

**Secret rollback:** if prod auth fails with "JWT_SECRET not configured", the
secret binding is missing — re-run Step 4 below. There is no "undo" for a
rotated secret; rotating invalidates all issued tokens (users re-login).

---

## Step 4 — Secret management (reference)

Set / rotate the production JWT secret. **Never echo the value.**

```bash
openssl rand -base64 48 | tr -d '\n' | \
  npx wrangler secret put JWT_SECRET --env production -c wrangler.json
```

Same command with `--env staging` rotates staging.

### Gotchas learned during prep

- Cloudflare rejects a secret whose name collides with an existing **var**
  binding on the live Worker. If you ever re-add `JWT_SECRET` as a var, you must
  deploy a version *without* the var before `secret put` will succeed. Keep it
  out of `wrangler.json` (current state) and this never bites.
- `wrangler secret put` against a Worker that does not exist yet offers to
  create a secret-only placeholder Worker — that is how `my-llc-production` was
  created. No code was deployed.
- Local dev reads `.dev.vars` (gitignored). Staging/production never read it.

## Migrations (reference)

Migrations are applied with `--remote` and are **not** idempotent (SQLite lacks
`ADD COLUMN IF NOT EXISTS`) — run each exactly once per database.

```bash
npx wrangler d1 execute my-llc-production --remote --file=src/worker/db/migrations/0001_owner_fields.sql
npx wrangler d1 execute my-llc-production --remote --file=src/worker/db/migrations/0002_rate_limits_consent_acceptances.sql
npx wrangler d1 execute my-llc-production --remote --file=src/worker/db/migrations/0003_widen_document_acceptances.sql
```

For a **fresh** database, apply the base schema first, then the three
migrations — that pair reproduces the consolidated `src/worker/db/schema.sql`
exactly (verified). Production was built this way and matches staging.
