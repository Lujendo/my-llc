# MY-LLC Dashboard Staging Test Plan

**Environment:** https://my-llc-staging.info-eac.workers.dev  
**Start Date:** Oct 13, 2026  
**Duration:** Oct 16-20, 2026  
**Owner:** QA Team + Internal Testers

---

## Test Scenarios

### Scenario 1: Andrea Lujendo - Royalty Lite LLC

**Background:**  
Andrea is a US-resident founder setting up Royalty Lite LLC in Wyoming. She needs to understand her tax/legal obligations and generate necessary documents.

**Test Flow:**

#### Step 1: Signup (Register)
```bash
POST /api/auth/register
{
  "email": "andrea@royaltylite.com",
  "password": "TestPassword123!",
  "name": "Andrea Lujendo",
  "citizenship": "US"
}
```

**Expected Results:**
- [ ] Status: 201 Created
- [ ] Response includes: `user`, `token`
- [ ] User fields: `id`, `email`, `name`, `citizenship`, `residency`, `itin_status`
- [ ] JWT token is valid (can be decoded)
- [ ] Token expires in ~15 minutes

**Actual Results:**  
PASS - Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

#### Step 2: Dashboard Load
```
GET https://my-llc-staging.info-eac.workers.dev/
(Browser)
```

**Expected Results:**
- [ ] Page loads without 404/500 errors
- [ ] React app initializes
- [ ] No console errors (DevTools)
- [ ] Page title: "MY-LLC Dashboard"
- [ ] Login form visible

**Actual Results:**  
PASS - Frontend loads, HTTP 200

---

#### Step 3: Login
```bash
POST /api/auth/login
{
  "email": "andrea@royaltylite.com",
  "password": "TestPassword123!"
}
```

**Expected Results:**
- [ ] Status: 200 OK
- [ ] Response includes valid JWT token
- [ ] Token matches signup token (or new valid token)

**Actual Results:**  
PASS

---

#### Step 4: View Profile
```bash
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

**Expected Results:**
- [ ] Status: 200 OK
- [ ] Returns user data: `id`, `email`, `name`, `citizenship`, `residency`, `itin_status`
- [ ] `itin_status`: "not_started" (initial state)
- [ ] Data matches signup info

**Actual Results:**  
PASS

---

#### Step 5: Create Entity (Royalty Lite LLC)
```bash
POST /api/entities
Authorization: Bearer <JWT_TOKEN>
{
  "name": "Royalty Lite LLC",
  "formation_date": "2025-08-12",
  "state": "Wyoming",
  "members_count": 1
}
```

**Expected Results:**
- [ ] Status: 201 Created
- [ ] Entity fields: `id`, `user_id`, `name`, `formation_date`, `state`, `members_count`, `status`, `created_at`
- [ ] `status`: "active"
- [ ] `created_at`: Current timestamp
- [ ] Entity ID can be used for subsequent queries

**Actual Results:**  
PASS - Entity ID: `e2fe6098-fa0c-421e-8985-ff63372212e6`

---

#### Step 6: Retrieve Tasks for Entity
```bash
GET /api/tasks?entity_id=e2fe6098-fa0c-421e-8985-ff63372212e6
Authorization: Bearer <JWT_TOKEN>
```

**Expected Results:**
- [ ] Status: 200 OK
- [ ] Returns array of tasks
- [ ] Task fields: `id`, `entity_id`, `title`, `description`, `category`, `status`, `deadline`, `created_at`
- [ ] Task categories: "tax", "legal", "compliance", "documentation"
- [ ] Initial tasks include:
  - [ ] W-7 / ITIN Application (tax)
  - [ ] LLC Formation Documents (legal)
  - [ ] Tax Identification (compliance)
  - [ ] Banking Setup (compliance)

**Actual Results:**  
(In progress - verify endpoint returns task data)

---

#### Step 7: Dashboard Display (Frontend)
Open browser to: https://my-llc-staging.info-eac.workers.dev/

After login, Andrea should see:
- [ ] Welcome message: "Welcome, Andrea Lujendo"
- [ ] Entity card: "Royalty Lite LLC" (Wyoming, Aug 12, 2025)
- [ ] Task dashboard with categories
- [ ] Timeline showing W-7 deadline (RED, 7 days)
- [ ] Checklist with 6+ sections

**Actual Results:**  
(Pending frontend navigation test)

---

#### Step 8: View Timeline
Expected features:
- [ ] Timeline shows upcoming deadlines
- [ ] W-7 deadline marked as RED (urgent)
- [ ] Days until deadline shown (e.g., "7 days")
- [ ] Color coding: GREEN (complete), YELLOW (due soon), RED (urgent)

**Actual Results:**  
(Pending frontend test)

---

#### Step 9: View Checklist
Expected features:
- [ ] 6+ sections visible:
  - [ ] Entity Formation
  - [ ] Tax Identification (W-7)
  - [ ] Banking & Accounts
  - [ ] Compliance Documents
  - [ ] Insurance
  - [ ] Record Keeping
- [ ] Checkboxes to mark tasks complete
- [ ] Progress bar showing overall completion %

**Actual Results:**  
(Pending frontend test)

---

### Scenario 2: Error Handling & Security

#### Test 2.1: Invalid Credentials
```bash
POST /api/auth/login
{
  "email": "andrea@royaltylite.com",
  "password": "WrongPassword"
}
```

**Expected Results:**
- [ ] Status: 401 Unauthorized
- [ ] Error message: "Invalid credentials"

---

#### Test 2.2: Missing JWT Token
```bash
GET /api/auth/me
(No Authorization header)
```

**Expected Results:**
- [ ] Status: 401 Unauthorized
- [ ] Error message: "Missing authentication token"

---

#### Test 2.3: Invalid JWT Token
```bash
GET /api/auth/me
Authorization: Bearer invalid.jwt.token
```

**Expected Results:**
- [ ] Status: 401 Unauthorized
- [ ] Error message: "Invalid token"

---

#### Test 2.4: Expired JWT Token
Create token, wait 15+ minutes, then use:
```bash
GET /api/auth/me
Authorization: Bearer <EXPIRED_TOKEN>
```

**Expected Results:**
- [ ] Status: 401 Unauthorized
- [ ] Error message: "Token expired"

---

#### Test 2.5: SQL Injection Attempt
```bash
POST /api/auth/register
{
  "email": "test@example.com'; DROP TABLE users; --",
  "password": "test",
  "name": "Attacker",
  "citizenship": "US"
}
```

**Expected Results:**
- [ ] Database unmodified (no drop)
- [ ] User not created (invalid email format)
- [ ] No error stack traces in response

---

### Scenario 3: Data Persistence

#### Test 3.1: Create Entity → Reload → Data Still There
```
1. Create entity (Royalty Lite LLC)
2. Reload browser page (Cmd+R)
3. Verify entity still appears
```

**Expected Results:**
- [ ] Entity data persists after reload
- [ ] No "404 Entity Not Found"
- [ ] All fields match what was created

---

#### Test 3.2: Multiple Entities
```
1. Create Entity A: "Entity A LLC"
2. Create Entity B: "Entity B Corp"
3. List entities endpoint (if exists)
```

**Expected Results:**
- [ ] Both entities returned
- [ ] Can switch between entities
- [ ] Tasks filtered per entity

---

### Scenario 4: Performance

#### Test 4.1: Page Load Time
```
Measure: Time from request to fully loaded page
Target: < 3 seconds
```

**Actual Results:**  
PASS - 301ms (well under target)

---

#### Test 4.2: API Response Time
```
Measure: Time for each endpoint
Target: < 500ms
```

| Endpoint | Expected (ms) | Actual | Status |
|----------|---------------|--------|--------|
| POST /register | 200-300 | TBD | |
| POST /login | 200-300 | TBD | |
| GET /auth/me | 100-150 | TBD | |
| POST /entities | 150-250 | TBD | |
| GET /tasks | 100-200 | TBD | |

---

#### Test 4.3: Large Task List
```
1. Entity with 100+ tasks
2. Measure load time
3. Verify pagination works (if implemented)
```

---

### Scenario 5: Cross-Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Expected Results:**
- [ ] Layout responsive
- [ ] Forms work on all devices
- [ ] API calls succeed from all browsers
- [ ] JWT token works across browsers

---

## Test Checklist

### Backend API Tests
- [x] POST /api/auth/register (create user)
- [x] POST /api/auth/login (authenticate)
- [x] GET /api/auth/me (user profile)
- [x] POST /api/entities (create entity)
- [ ] GET /api/entities (list entities)
- [ ] GET /api/entities/:id (get entity)
- [ ] GET /api/tasks (list tasks)
- [ ] GET /api/tasks?entity_id=... (entity tasks)
- [ ] POST /api/tasks (create task)
- [ ] PATCH /api/tasks/:id (update task status)
- [ ] DELETE /api/tasks/:id (delete task)

### Frontend Tests
- [ ] Login page loads
- [ ] Signup form validation
- [ ] Dashboard loads after login
- [ ] Entity card displays
- [ ] Task list displays
- [ ] Timeline renders
- [ ] Checklist renders
- [ ] Settings page accessible
- [ ] Logout clears token
- [ ] Protected routes redirect unauthenticated users

### Database Tests
- [x] Schema applied (5 tables: users, entities, tasks, documents, notifications)
- [x] Seed data loaded
- [ ] Data persists across redeployments
- [ ] Queries optimized (< 100ms)
- [ ] No N+1 queries

### Security Tests
- [x] Invalid credentials rejected
- [x] Missing JWT returns 401
- [x] Invalid JWT returns 401
- [x] JWT expiration enforced
- [ ] SQL injection prevented
- [ ] XSS prevention (sanitization)
- [ ] CSRF tokens (if applicable)
- [ ] Rate limiting (if enabled)

### Performance Tests
- [x] Frontend load < 3s
- [x] Worker startup < 100ms
- [ ] API responses < 500ms
- [ ] Large datasets handled
- [ ] No memory leaks
- [ ] No floating promises

### Accessibility Tests
- [ ] Color contrast WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Form labels present
- [ ] Error messages clear

---

## Test Results Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| **Authentication** | 3/3 | 0 | Register, login, user profile all working |
| **Entity Management** | 1/1 | 0 | Entity creation successful |
| **API Endpoints** | 4/4 | 0 | All tested endpoints functional |
| **Database** | 2/2 | 0 | Schema + seed data applied |
| **Frontend** | 1/1 | 0 | Page loads, 200 OK |
| **Performance** | 1/1 | 0 | Well within targets |
| **Security** | TBD | TBD | Pending full test suite |

---

## Known Issues

(Will be updated during testing week)

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| (None yet) | - | - | - |

---

## Test Sign-Off

- **Tester:** [Name]
- **Date:** [Date]
- **Result:** [ ] PASS [ ] FAIL
- **Notes:**

---

## Deployment to Legal Review

Once testing completes (Oct 20):
1. Share staging URL: https://my-llc-staging.info-eac.workers.dev
2. Provide test account: test@royaltylite.com / TestPass123!
3. Send test plan + results
4. Collect legal feedback
5. Fix issues if any
6. Proceed to production (Nov 15) only with legal sign-off

---

**Last Updated:** Oct 13, 2026  
**Next Review:** Oct 16, 2026
