# MY-LLC Dashboard Backend (Hono + Cloudflare Workers)

## Status

**Priority 1 Routes: ✅ COMPLETE**  
All authentication, entity management, and task tracking routes implemented and tested locally.

## Architecture

- **Framework**: Hono (lightweight web framework for Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Auth**: JWT tokens (15 min expiration)
- **Password Hash**: SHA256 + salt (MVP; upgrade to bcryptjs/Argon2 before production)
- **No ORM**: Direct parameterized D1 queries for simplicity

## File Structure

```
src/worker/
├── index.ts              -- Main Hono app
├── env.d.ts              -- D1 type definitions
├── types/                -- TypeScript interfaces (User, Entity, Task, etc)
├── utils/                -- Utilities (ID generation, hashing, JWT, errors)
├── middleware/           -- Auth guard, error handler, CORS
├── services/             -- Business logic (AuthService, EntityService, TaskService)
├── routes/               -- API endpoints (auth.ts, entities.ts, tasks.ts)
└── db/                   -- Database schema, queries, seed data
```

## Running Locally

```bash
# Install dependencies
npm install

# Initialize D1 database
npx wrangler d1 execute my-llc-db --local --file src/worker/db/schema.sql
npx wrangler d1 execute my-llc-db --local --file src/worker/db/seed.sql

# Start dev server
npx wrangler dev --env ""

# Test
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"andrea@example.com","password":"password123"}'
```

## Implemented Routes (Priority 1)

### Authentication
- `POST /api/auth/register` — Create account (201)
- `POST /api/auth/login` — Get JWT token (200)
- `POST /api/auth/logout` — Logout (200, stateless)
- `GET /api/auth/me` — Get current user (requires JWT, 200)

### Entities (LLCs)
- `GET /api/entities` — List user's entities (requires JWT)
- `POST /api/entities` — Create new entity (requires JWT)
- `GET /api/entities/:id` — Get single entity (requires JWT)
- `PATCH /api/entities/:id` — Update entity (requires JWT)
- `DELETE /api/entities/:id` — Delete entity (requires JWT)

### Tasks
- `GET /api/tasks?entity_id=...` — List tasks for entity (requires JWT)
- `GET /api/tasks/:id` — Get single task (requires JWT)
- `PATCH /api/tasks/:id` — Mark complete/incomplete (requires JWT)
- `GET /api/tasks/upcoming?entity_id=...&days=30` — Get upcoming deadlines (requires JWT)

## Security

✅ **Auth**: JWT tokens required on all protected routes  
✅ **Input Validation**: All inputs validated before DB queries  
✅ **SQL Injection Prevention**: Parameterized queries only  
✅ **Authorization**: Users can only access their own entities/tasks  
✅ **Error Handling**: Errors logged, safe responses returned  

## Testing

All routes tested with curl locally. No test framework yet (can add Jest/Vitest in Phase 2).

## Next Steps (Priority 2)

- Documents: Create, retrieve, export to PDF
- Treaty Analysis: Analyze tax exposure by citizenship/residency
- Notifications: Mark read, update preferences
- Replace SHA256 with secure hash (bcryptjs)
- Add rate limiting on auth routes

## Deployment

```bash
# Set production JWT_SECRET in wrangler.toml
# Set D1 database ID for production

npx wrangler deploy
```

---

**Last Updated**: Oct 13, 2026  
**Developer**: Senior Backend Engineer  
**MVP Target**: Nov 15, 2026
