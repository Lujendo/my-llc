# .opencode — Agentic Awareness

Local, in-repo memory for agents working on **MY-LLC Dashboard**.
Documentation only — this is **not** opencode runtime config.

## Files

| File | Purpose |
|---|---|
| `AWARENESS.md` | Point-in-time snapshot: product, architecture, API, data model, envs, status, debt. |
| `ACTIVITY-LOG.md` | Append-only chronology of agentic / development activity. |

## Conventions

- **Read `AWARENESS.md` first** before touching the repo — it is the fast orientation.
  Verify against code; treat the root `*README*` / planning docs as possibly stale (see §9 of awareness).
- **Append to `ACTIVITY-LOG.md`** after any non-trivial change:
  `YYYY-MM-DD · agent · action · artifact`. Newest entries at the top.
- **Update `AWARENESS.md`** when architecture, stack, envs, or status materially change; bump the snapshot date.
- **Verify before claiming done:** `npm run build` + the relevant smoke script (`src/worker/db/*-smoke.mjs`, `src/react-app/lib/*.smoke.mjs`).
- Keep it lean. No speculative scaffolding, no duplicated docs.
