# MY-LLC DASHBOARD: Foreign LLC Tax Compliance Platform

**Status:** MVP Product Specification  
**Repository:** `/Volumes/Mini Media/Augment Code 2026/my-llc-dashboard`  
**Tech Stack:** Hono + React 19 + Vite + Cloudflare Workers + Tailwind v4  
**Target Users:** Foreign-resident LLC owners (non-resident aliens)  
**MVP Scope:** Tax timeline, compliance checklists, treaty analysis, document generation  

---

## 1. PRODUCT VISION

**Problem:** Foreign LLC owners struggle to:
- Track multiple tax filing deadlines across jurisdictions
- Understand double taxation risks
- Generate compliant tax forms (W-7, operating agreements)
- Coordinate US and home-country filings
- Avoid penalties for missed deadlines or incorrect filings

**Solution:** A dashboard that guides users through US LLC tax compliance with:
- **Timeline view** — all critical deadlines in one place
- **Compliance checklist** — step-by-step task tracking
- **Treaty analyzer** — automatic double taxation prevention
- **Document generator** — auto-filled forms (W-7, 1040-NR, operating agreements)
- **Multi-entity management** — track multiple LLCs
- **Alert system** — notifications for upcoming deadlines

---

## 2. CORE FEATURES (MVP)

### **2.1 USER ONBOARDING**

**Flow:**
1. Sign up with email (optional: Google/GitHub OAuth later)
2. Profile setup:
   - Full name
   - Citizenship (dropdown: Italy, Germany, etc.)
   - Residency (current country)
   - ITIN status (yes/no)
3. Entity creation:
   - LLC name
   - Formation date
   - State of formation (default: Wyoming)
   - Business type (holding, operating, etc.)
   - Member count (single or multi-member)

**Data Storage:** Cloudflare D1 (SQLite)

---

### **2.2 DASHBOARD HOME**

**Layout:**
```
┌─────────────────────────────────────┐
│ Welcome, Andrea Lujendo Ventrucci    │
│ Royalty Lite LLC (Wyoming)           │
├─────────────────────────────────────┤
│ UPCOMING DEADLINES (Next 30 Days)    │
│ • Oct 20: Mail W-7 to IRS ⚠️ HIGH  │
│ • Nov 15: Complete German Form      │
│ • Dec 1: FATCA Questionnaire        │
├─────────────────────────────────────┤
│ COMPLIANCE STATUS                    │
│ ✓ Operating Agreement Signed        │
│ ✗ ITIN Application (Pending)       │
│ ✗ German Tax Filing                 │
├─────────────────────────────────────┤
│ QUICK ACTIONS                        │
│ [Fill W-7] [Download Docs] [Schedule] │
└─────────────────────────────────────┘
```

---

### **2.3 TIMELINE & DEADLINE TRACKER**

**View Options:**
- **Calendar view** — see all deadlines on a calendar
- **List view** — chronological with status indicators
- **Jurisdictional view** — US vs. Germany vs. Italy
- **Filter by entity** — if multiple LLCs

**Deadline Categories:**
1. **US Federal**
   - Form W-7 (ITIN) — within 30 days of formation
   - Form 1040-NR — April 15 (or June 15 for non-residents)
   - Form 5472 (if applicable) — March 15 or June 15
   - FBAR (if applicable) — April 15
   - FATCA (if applicable) — April 15

2. **State (Wyoming)**
   - Annual report — biennial (Aug 12, 2027 for Royalty Lite)
   - Biennial license fee — $60

3. **Home Country (Germany/Italy)**
   - German income tax — May 31 (or July 31 with advisor)
   - Italian income tax — June 30

4. **Compliance Triggers**
   - When income appears: File 1040-NR
   - When foreign accounts >$10k: File FBAR
   - When foreign assets >$200k: File FATCA

**Features:**
- ✅ Red/yellow/green status (due soon / upcoming / completed)
- ✅ Click-through to instructions and forms
- ✅ Email/SMS reminders (configurable)
- ✅ PDF export of timeline

---

### **2.4 COMPLIANCE CHECKLIST**

**Sections:**
1. **Formation Phase**
   - [ ] Articles of Organization filed with state
   - [ ] EIN obtained (if multi-member)
   - [ ] Registered agent appointed
   - [ ] Operating agreement signed

2. **ITIN & US Tax ID**
   - [ ] ITIN application (W-7) completed
   - [ ] Italian passport gathered
   - [ ] Form 1040-NR blank prepared
   - [ ] W-7 package mailed
   - [ ] ITIN notice received
   - [ ] ITIN saved for records

3. **US Federal Filings**
   - [ ] Form 1040-NR prepared (if income exists)
   - [ ] Form 5472 assessed (if related-party transactions)
   - [ ] FBAR questionnaire completed
   - [ ] FATCA questionnaire completed
   - [ ] Foreign tax credit (Form 1116) calculated (if applicable)

4. **German Tax Coordination**
   - [ ] Treaty analysis completed
   - [ ] German tax filing prepared
   - [ ] Foreign tax credit strategy documented
   - [ ] German return filed

5. **Banking & Operations**
   - [ ] Business bank account opened
   - [ ] Bookkeeping system set up
   - [ ] Tax advisor engaged
   - [ ] Quarterly estimated taxes tracked

6. **Ongoing Compliance**
   - [ ] Annual financial statements maintained
   - [ ] Tax return filed (1040-NR)
   - [ ] Foreign filings up to date
   - [ ] Deadline reminders reviewed

**Interactive:**
- Click to mark as complete
- Click for detailed instructions
- Click to download related form/document
- Progress bar showing % complete

---

### **2.5 TREATY ANALYZER & DOUBLE TAXATION PREVENTION**

**Input Questions (Questionnaire):**
1. What is your citizenship? (dropdown: Italy, Germany, France, etc.)
2. Where do you live currently? (address field)
3. Is the LLC a disregarded entity or electing to be taxed as a corporation?
4. Did the LLC generate income in 2025? (yes/no)
5. Where is the LLC's principal place of business? (US address)
6. Do you expect to have foreign-source income separate from the LLC? (yes/no)

**Output Analysis:**
```
═══════════════════════════════════════
TREATY ANALYSIS: Andrea Lujendo (Italy → Germany → US LLC)
═══════════════════════════════════════

APPLICABLE TREATY:
✅ US-Italy Income Tax Treaty (1984, as amended)
✅ US-Germany Income Tax Treaty (2006)
⚠️ Germany-Italy Tax Cooperation Agreement (OECD)

YOUR SITUATION:
• Entity: Disregarded LLC (single-member, transparent for US tax)
• Income: Flows through to your 1040-NR
• Home Country: Germany (currently resident)
• Citizenship: Italy

DOUBLE TAXATION RISK:
🔴 HIGH (2026) — German tax authorities questioning treaty relief for disregarded entities
• Potential US tax: 37% federal + 3.8% NIIT = ~41%
• Potential German tax: ~42% income tax + solidarity surcharge
• Overlapped: 83% combined (worst case)

MITIGATION STRATEGY:
1. File German return FIRST (by May 31) with explicit treaty claim
2. Claim Art. 23(3)(a) relief (elimination method) OR Art. 10 relief
3. Attach proof of US federal tax payment to German filing
4. File US Form 1040-NR (by June 15) with Form 1116 (foreign tax credit)
5. Monitor BZSt position on disregarded entities through 2026

RECOMMENDED FILING ORDER:
Step 1: Germany Steuererklärung (May 31, 2027)
Step 2: US Form 1040-NR (June 15, 2027)
Step 3: File Form 1116 (with 1040-NR) if German tax paid

EXPECTED TAX POSITION (with treaty relief):
Income: $100,000
US federal: -$37,000 (37% top rate)
German tax: -$0 (treaty exclusion)
Effective rate: 37%

NEXT STEPS:
⚠️ Consult German tax advisor (Steuerberater) by Dec 2026
⚠️ Prepare treaty position statement
⚠️ Track BZSt position updates through 2026-2027
═══════════════════════════════════════
```

**Features:**
- ✅ Dynamic treaty selector (based on citizenship/residency)
- ✅ Risk assessment (low/medium/high)
- ✅ Filing order recommendations
- ✅ Downloadable treaty position memo template
- ✅ Links to treaty text, IRS guidance, foreign tax authority info
- ✅ Email report to user's tax advisor

---

### **2.6 DOCUMENT GENERATOR**

**Auto-Fillable Forms (MVP):**

1. **Form W-7** (ITIN Application)
   - Input: Full name, DOB, citizenship, passport number, German address
   - Output: Pre-filled PDF with user data
   - Download: Ready to print and sign

2. **Form 1040-NR** (Template)
   - Input: Filing status, income sources, ITIN, German address
   - Output: Blank form with key fields auto-populated
   - Note: Requires detailed income data (filled in when available)

3. **Operating Agreement** (LLC Internal Document)
   - Input: Entity name, member names, formation date, state
   - Output: Fully drafted agreement ready for signature
   - Download: Word or PDF format

4. **Treaty Position Memo**
   - Input: Entity details, citizenship, treaty country, income type
   - Output: Professional memo for German tax filing
   - Download: PDF with IRS/treaty references

**Future (Post-MVP):**
- Form 5472 (CFC reporting)
- Form 1116 (Foreign Tax Credit) with calculations
- FBAR (FinCEN Form 114)
- FATCA (Form 8938)
- German Anlage G (self-employment income)
- Italian Form REDDITI (if applicable)

---

### **2.7 MULTI-ENTITY MANAGEMENT**

**If User Has Multiple LLCs:**

Dashboard layout:
```
MY ENTITIES
├─ Royalty Lite LLC (Wyoming) — Status: ITIN pending
│  ├─ Formation: Aug 12, 2025
│  ├─ Members: Andrea Lujendo (100%)
│  └─ Last filing: Pending W-7
│
├─ elelci LLC (Wyoming) — Status: EIN pending
│  ├─ Formation: Jul 31, 2026
│  ├─ Members: Andrea (50%), Antonio (50%)
│  └─ Last filing: Pending SS-4
│
└─ [+ Add New Entity]
```

**Per-Entity Features:**
- Separate timelines for each entity
- Consolidated compliance status
- Cross-entity reporting (e.g., combined foreign accounts for FBAR)
- Allocation of joint expenses (e.g., CPA fees)

---

### **2.8 NOTIFICATIONS & ALERTS**

**Email Reminders:**
- 30 days before deadline: "You have 30 days to complete X"
- 7 days before deadline: "Action required in 7 days: X"
- Day of deadline: "TODAY: X is due"
- Overdue: "OVERDUE: X was due on DATE"

**In-App Notifications:**
- Red banner on dashboard if deadline is overdue
- Yellow banner if deadline is within 7 days
- Green checkmark if task is completed

**Configurable:**
- Email frequency (daily/weekly/custom)
- Notification channels (email, SMS, in-app)
- Reminder timing (customize "30 days before" threshold)

---

## 3. TECHNICAL ARCHITECTURE

### **3.1 Frontend** (React 19 + TypeScript)
```
src/
├─ components/
│  ├─ Dashboard.tsx
│  ├─ Timeline.tsx
│  ├─ Checklist.tsx
│  ├─ TreatyAnalyzer.tsx
│  ├─ DocumentGenerator.tsx
│  ├─ EntityManager.tsx
│  └─ UI/
│     ├─ Button.tsx
│     ├─ Card.tsx
│     ├─ Modal.tsx
│     ├─ Dropdown.tsx
│     └─ Alert.tsx
├─ hooks/
│  ├─ useAuth.ts
│  ├─ useEntities.ts
│  ├─ useTasks.ts
│  └─ useUser.ts
├─ services/
│  ├─ api.ts
│  ├─ treatyAnalyzer.ts
│  ├─ documentGenerator.ts
│  └─ notifications.ts
├─ types/
│  └─ index.ts (User, Entity, Task, Treaty types)
└─ App.tsx
```

### **3.2 Backend** (Hono on Cloudflare Workers)
```
src/
├─ worker/
│  ├─ index.ts (main entry)
│  ├─ routes/
│  │  ├─ auth.ts (login/register)
│  │  ├─ entities.ts (CRUD entities)
│  │  ├─ tasks.ts (CRUD tasks/checklist)
│  │  ├─ deadlines.ts (get timelines)
│  │  ├─ documents.ts (generate forms)
│  │  ├─ treaty.ts (analyze treaties)
│  │  └─ notifications.ts (send alerts)
│  ├─ middleware/
│  │  ├─ auth.ts
│  │  └─ cors.ts
│  ├─ db/
│  │  ├─ schema.sql
│  │  └─ queries.ts
│  └─ utils/
│     ├─ generateW7.ts
│     ├─ generateAgreement.ts
│     ├─ treatyRules.ts
│     └─ deadlineEngine.ts
```

### **3.3 Database** (Cloudflare D1 — SQLite)
```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  citizenship TEXT,
  residency TEXT,
  created_at TIMESTAMP
);

-- Entities (LLCs)
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  formation_date DATE,
  state TEXT,
  members_count INT,
  created_at TIMESTAMP
);

-- Tasks/Checklist
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  title TEXT,
  section TEXT (e.g., "ITIN", "Federal", "Germany"),
  due_date DATE,
  completed BOOLEAN,
  instructions TEXT,
  created_at TIMESTAMP
);

-- Document Versions
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  entity_id TEXT,
  type TEXT (e.g., "W-7", "Operating Agreement"),
  content TEXT (JSON),
  status TEXT (draft/completed),
  created_at TIMESTAMP
);

-- Notifications Log
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  message TEXT,
  type TEXT (email/sms/in-app),
  sent_at TIMESTAMP
);
```

### **3.4 Styling** (Tailwind CSS v4)
- Dark mode option (toggle in settings)
- Responsive design (mobile-first)
- Color scheme: Green (completed), Yellow (pending), Red (overdue)
- Typography: Clean, readable, professional

---

## 4. MVP SCOPE & PHASING

### **Phase 1: MVP (Q4 2026 — Weeks 1-4)**
**Target:** Launch functional dashboard for single-entity users

- ✅ User signup/login (email + password, no OAuth yet)
- ✅ Entity creation (one LLC per user)
- ✅ Timeline view (static deadlines for non-resident alien scenario)
- ✅ Checklist (6 sections, 20+ tasks)
- ✅ Treaty analyzer (Italy → Germany → US only)
- ✅ Document generator (W-7, Operating Agreement)
- ✅ Basic notifications (email reminders)

**Definition of Done:**
- [ ] Deployed to Cloudflare Workers
- [ ] Users can sign up and add one entity
- [ ] Timeline, checklist, treaty analyzer functional
- [ ] Documents downloadable as PDF
- [ ] Email notifications working

### **Phase 2: Multi-Entity & Expand (Q1 2027)**
- Multi-entity management (multiple LLCs)
- Additional treaties (Germany, France, Spain, etc.)
- FBAR/FATCA assessments integrated
- SMS notifications
- Mobile-optimized UI

### **Phase 3: Advanced (Q2+ 2027)**
- Additional form generators (5472, 1116, FBAR, etc.)
- Tax advisor portal (CPA/EA dashboard)
- Integration with tax software (TurboTax, etc.)
- Multi-language support (German, Italian, Spanish)
- Real-time BZSt/IRS guidance updates

---

## 5. CASE STUDY: Royalty Lite LLC (Your Scenario)

**User Journey:**

1. **Sign Up** (Oct 13, 2026)
   - Email: info@lujiventrucci.com
   - Name: Andrea Lujendo Ventrucci
   - Citizenship: Italy
   - Residency: Germany
   - ITIN: Not yet

2. **Create Entity**
   - Name: Royalty Lite LLC
   - State: Wyoming
   - Formation Date: Aug 12, 2025
   - Members: 1 (Andrea, 100%)
   - Business Type: Holding company

3. **View Timeline**
   - ⚠️ Oct 20: Mail W-7 to IRS (7 days remaining)
   - Dec 15: ITIN notice expected (weeks 7-11)
   - May 31, 2027: German tax return due
   - June 15, 2027: Form 1040-NR due (if income)
   - Aug 12, 2027: Wyoming annual report due

4. **Complete Checklist**
   - ✓ Operating Agreement signed
   - ✗ ITIN (W-7) — [Click: Download pre-filled W-7]
   - ✗ FBAR assessment (< $10k, marked "Not Required")
   - ✗ Treaty analysis pending

5. **Run Treaty Analyzer**
   - Input: Italy citizen, Germany resident, disregarded LLC
   - Output: Risk assessment, filing order, treaty position memo
   - Download: Treaty Memo PDF for German filing

6. **Generate Documents**
   - Download: Pre-filled W-7 (ready to print & sign)
   - Download: Operating Agreement (already signed, for records)
   - Download: Treaty Position Memo (for German advisor)

7. **Set Reminders**
   - Email: 7-day warning before each deadline
   - SMS: 1-day warning (optional)
   - In-app: Dashboard alerts

---

## 6. SUCCESS METRICS (Post-Launch)

- **User Adoption:** 100+ foreign LLC owners signed up within 6 months
- **Task Completion:** 80% of users complete 90%+ of their checklist items
- **On-Time Filings:** 95% of users file forms by deadline (with email reminders)
- **Satisfaction:** NPS > 50 (Net Promoter Score)
- **Referral Rate:** 20% of new users are referred by existing users

---

## 7. FUTURE EXTENSIONS

- **Tax Software Integration:** Connect to TurboTax, Wealthfront, etc.
- **Accounting Integration:** QuickBooks, Wave, Xero
- **CPA Portal:** Tax advisors can see client status, download checklist, provide guidance
- **Multi-Language:** German, Italian, Spanish, French
- **Marketplace:** Connect users with vetted tax advisors (CPA/EA/Steuerberater)
- **Blog/Guides:** Monthly updates on treaty changes, IRS guidance, international tax news
- **Community Forum:** Users discuss challenges, share solutions
- **API Access:** Developers can build integrations

---

## 8. SECURITY & COMPLIANCE

- **Data Encryption:** All user data encrypted at rest (Cloudflare D1 encryption)
- **Authentication:** OAuth 2.0 (Google, GitHub, email + password)
- **Authorization:** Users can only access their own entities/documents
- **Privacy:** GDPR-compliant (US users), privacy policy + terms of service
- **Compliance:** Compliance with IRS Publication 17 guidance, tax form accuracy
- **Audit Trail:** Log all document downloads, task completions, deadline changes

---

## 9. NEXT STEPS (START THIS WEEK)

1. **Design Database Schema** (2 hours)
   - [ ] Define exact column types, relationships, indexes

2. **Set Up Hono Backend** (2 hours)
   - [ ] Add Hono middleware, D1 binding, routing structure

3. **Build React Components** (8 hours)
   - [ ] Dashboard, Timeline, Checklist, TreatyAnalyzer, DocumentGenerator

4. **Integrate Document Generation** (4 hours)
   - [ ] W-7 auto-fill (use your example as reference)
   - [ ] Operating Agreement template
   - [ ] PDF export

5. **Deploy to Cloudflare** (2 hours)
   - [ ] `wrangler deploy`
   - [ ] Test live

6. **Test with Royalty Lite Case** (2 hours)
   - [ ] Sign up as Andrea Lujendo
   - [ ] Create Royalty Lite entity
   - [ ] Verify all features work end-to-end

**Total MVP Time Estimate:** 20 hours (achievable in 1 week with focus)

---

**Product Owner:** You (CEO)  
**Development Team:** TBD (likely `opencode` or delegation to `dev_frontend` + `dev_backend`)  
**Launch Target:** November 15, 2026 (beta)  
**Marketing Target:** Tax season 2027 (Jan-Apr)

---
