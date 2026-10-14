# Privacy Policy

**Effective date:** October 14, 2026
**Last updated:** October 14, 2026
**Data controller:** MY-LLC ("we", "us", "our")
**Privacy contact:** support@my-llc.app

This Privacy Policy explains what personal data we collect, why, how we store it, who can see it, how long we keep it, and your rights. It applies to MY-LLC Dashboard (the "Service"). We are the "controller" (the company that decides how your data is used).

**Plain-English summary** (the full text controls):
- **Your sensitive form data stays in your browser.** The passport/ID numbers, date of birth, ITIN/IRSN, and foreign tax ID you type to pre-fill a form are processed in your browser and are **not transmitted to us or stored on our servers**.
- We store only what the Service needs to run: your account, your LLC/entity basics, and a record that you ticked the professional-review acknowledgment before a download.
- We use your data to run the Service — we do **not** sell it.
- We keep account, entity, and acceptance records only as long as needed (see §5).
- We apply safeguards to any data that leaves the EEA/UK (§6).
- You can ask to see, correct, export, or delete the data we hold (§7).

---

## 1. What we collect

**1.1. Account data** — name, email, password (stored hashed), country of citizenship, country of tax residence, and an ITIN **status** flag (`not_started` / `pending` / `received`). The flag is a status only — we do **not** store your ITIN number. Paid plans are not launched, so we hold **no payment data** today; when they launch, our payment processor will handle card data and we will not store full card numbers.

**1.2. Entity data** — the US LLC basics you choose to save: LLC name, formation date, state, member count, status, and the owner fields (owner name, citizenship, residency, foreign/domestic, tax classification). We do **not** store EINs or entity addresses — the Service does not ask for them.

**1.3. Sensitive form data you pre-fill — processed in your browser, not sent to us.** The passport/ID numbers, date of birth, ITIN/IRSN, foreign tax ID, and similar entries you type to pre-fill a form (for example the W-7 or the Operating Agreement) are processed **locally in your browser** — validation and PDF generation happen on your device — and are **not transmitted to, or stored on, our servers**. Because we never receive this data, we cannot recover it for you if you clear your browser: **keep your own copy of anything you enter.**

**1.4. Usage and device data** — we do **not** currently run analytics or marketing tools, and we set no tracking cookies. The only client-side storage is in your browser: your login token, your display and email preferences, your cookie choice (§8), and a local copy of the acknowledgment log (form/version/timestamp only — it contains no sensitive form data). Our hosting provider (Cloudflare) processes request metadata, including your IP address, as needed to serve and secure the Service. We do not log your page views or in-app actions to our database.

**1.5. Support and communications** — messages you send us and our replies.

**1.6. What actually reaches our servers.** In practice the Service stores on our infrastructure only: (a) account data (§1.1); (b) the entity basics you choose to save — LLC name, formation date, state, member count, and owner name / citizenship / residency (§1.2); (c) a **download/acceptance record** noting that you ticked the professional-review acknowledgment, together with the document type, its version, and a timestamp; (d) the **holdings** you create (see §1.7); and (e) your **calendar entries** (see §1.7). It does not include the sensitive form data described in §1.3.

**1.7. Holdings and calendar data.** When you use the **holding hub + calendar** feature you enter, and we store on our servers: (a) **holdings** — the holding name, its jurisdiction (country and subdivision), and base currency; (b) **holding relationships** — the parent/child structure between your holdings; (c) **holding members** — the links that associate your entities with a holding; and (d) **calendar entries** — the event title, description, location, start/end times, and any optional jurisdiction you add. Tasks you create may also carry start/end times and an all-day flag. This is data you type, and it is stored like the entity basics in §1.2.

## 2. Why we collect it (and our lawful basis)

| Purpose | Data used | Lawful basis (GDPR) |
|---|---|---|
| Create and manage your account | Account data | Contract |
| Provide the Service / pre-fill forms and generate drafts | Entity basics; acceptance records (sensitive form data stays in your browser — §1.3) | Contract |
| Organize holdings / schedule & reminders | holdings, holding_relationships, holding_members, calendar entries (§1.7) | Contract |
| Process payments | Account, payment data | Contract (not enabled — paid plans not yet launched) |
| Secure the Service, prevent fraud | Request metadata (e.g. IP via our host), account | Legitimate interests / legal obligation |
| Comply with tax, accounting, and legal duties | Account | Legal obligation |
| Improve the Service | Usage data | Legitimate interests (not currently used — no analytics) |
| Marketing emails | Account | Consent (not currently used) |

If we rely on consent for anything, you can withdraw it at any time (see §7.6).

**Data minimisation.** We collect only what the Service needs. We deliberately do **not** receive the sensitive form data you pre-fill (§1.3), and we collect no analytics or marketing data today (§1.4). Where a purpose is not yet active (payments, marketing), we hold no data for it.

## 3. How we store it

3.1. **Encryption:** data is encrypted in transit (TLS), and our infrastructure provider encrypts database and storage data at rest.

3.2. **Where:** data is stored with our infrastructure providers, primarily in the **United States**. See §6 (International transfers).

3.3. **Access controls:** access is limited to personnel who need it, and to systems that operate the Service.

3.4. **Browser-only data.** The sensitive form data you enter to pre-fill a document (§1.3) is never received by us and is never stored on our servers — it stays in your browser.

## 4. Who can access it

4.1. **Our team** — only staff/contractors who need access to operate, support, or secure the Service, bound by confidentiality.

4.2. **Subprocessors** — service providers that process data for us (see §9). They act on our instructions under written data processing agreements.

4.3. **Legal and safety** — we may disclose data if required by law, subpoena, or to protect rights and safety.

4.4. **Business transfers** — if we are acquired or merge, data may transfer; we will notify you and require the new owner to honor this policy.

4.5. **We do not sell your personal data.**

## 5. How long we keep it (retention)

5.1. **Financial/accounting records, if we hold any** (for example, invoices once paid plans launch): **at least 7 years** after the relevant tax year, or longer if law requires. We do not store tax-return data or the drafts you generate — those stay in your browser (§1.3).

5.2. **Account data:** while your account is active, then up to `24 months` after closure, unless retention is required by law.

5.3. **Usage/marketing data:** not currently collected (§1.4). If that changes, any such data is kept no longer than `14 months`.

5.4. **Legal holds:** we may keep data longer if needed for a legal claim, dispute, or legal obligation.

5.5. When retention ends, we delete or anonymize data — this includes account data (§5.2) and the holdings and calendar data described in §5.7.

5.6. **Browser-only data.** We keep no server-side copy of the sensitive form data described in §1.3, so there is nothing for us to retain on our side (and nothing for us to delete — you control it in your browser).

5.7. **Holdings and calendar data** (`holdings`, `holding_relationships`, `holding_members`, `calendar_entries`, §1.7): while your account is active, then up to `24 months` after closure, unless retention is required by law — the same rule as account data (§5.2).

## 6. International data transfers

6.1. Users are global. Our servers and providers may be in the **United States** and other countries. Your data may be transferred to and stored in a country different from yours.

6.2. **For EU/EEA/UK users:** we apply appropriate safeguards for transfers of personal data outside the EEA/UK. Our intended transfer mechanism is the **EU-US Data Privacy Framework** (including its UK Extension) where our provider is certified, and otherwise the **European Commission Standard Contractual Clauses (2021/914)** together with a transfer impact assessment. `[CONFIRM]` — counsel to confirm the certified mechanism(s) and that a transfer impact assessment is on file. We review those safeguards as the law requires.

6.3. By using the Service, you understand that your data may be processed in the US.

## 7. Your rights

Subject to your location and applicable law, you may have the right to:

7.1. **Access** the personal data we hold about you.
7.2. **Correct** inaccurate data.
7.3. **Delete** your data ("right to erasure") — subject to our legal retention duties (e.g. tax records).
7.4. **Export / portability** — receive your data in a portable format.
7.5. **Object or restrict** certain processing.
7.6. **Withdraw consent** where processing is based on consent.
7.7. **Not be discriminated against** for exercising rights (CCPA/CPRA).
7.8. **Opt out of "sale"/"sharing"** if applicable (CCPA/CPRA). We do not sell or share your personal data; if that ever changes, we will provide a clear opt-out.

7.9. **What these rights cover.** Your access/correction/erasure/portability rights apply to all the data we hold on our servers (§1.6) — including your account data, entity basics, acceptance records, and the **holdings and calendar data** described in §1.7. The sensitive form data you pre-fill in your browser is never in our possession, so we cannot access, export, or erase it for you — you control it directly.

To exercise rights, contact support@my-llc.app. We will respond within the time required by law (GDPR: 1 month; CCPA: 45 days). We may need to verify your identity.

## 8. Cookies and consent

8.1. We use cookies and similar technologies. **Today we set only strictly necessary cookies** (login and security) — these need no consent. We do **not** currently set analytics or marketing cookies (§1.4). If we introduce them, we will set them only with your consent, and we will update this section first.

8.2. In the EU/UK/EEA we show a consent banner with an equal-prominence "Reject" option before setting non-essential cookies. No pre-ticked boxes.

8.3. You can change or withdraw cookie choices at any time via the Cookie settings, and via browser settings.

## 9. Third parties and subprocessors

We use service providers to run the Service. Current list:

| Provider | Purpose | Data | Location |
|---|---|---|---|
| Cloudflare | Hosting, database, storage, security | All Service data | US / global |
| Payment processor | Payment processing (not enabled — paid plans not yet launched) | Account, payment data | Not applicable (not enabled) |

9.1. We require processors to protect data under written agreements (DPAs) and to process only on our instructions. We execute a current DPA with each subprocessor as it is onboarded.

## 10. Security

10.1. We use reasonable technical and organizational measures to protect data. No system is 100% secure; we cannot guarantee absolute security.

10.2. **Breach notification:** if a breach affects your rights, we will notify you and authorities as required by law (GDPR: within 72 hours to the supervisory authority).

## 11. Children

11.1. The Service is for adults (18+). We do not knowingly collect data from children. If we learn we have, we will delete it.

## 12. Changes to this policy

12.1. We may update this policy. We will post the new version and update the "Last updated" date. For material changes, we will give reasonable notice (for example, by email or an in-app notice).

## 13. Contact

**Controller:** MY-LLC
**Privacy contact:** support@my-llc.app
**EU representative (if required):** not yet appointed `[CONFIRM]`
**UK representative (if required):** not yet appointed `[CONFIRM]`

If you are in the EU/UK, you also have the right to complain to your local supervisory authority.
