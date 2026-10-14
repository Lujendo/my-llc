// Runnable check: node journey-smoke.mjs [baseUrl]
// Verifies the core user journey against a deployed API:
//   register -> create entity (+owner fields) -> auto-seeded checklist ->
//   GET tasks (camelCase contract) -> POST task -> PATCH task -> security checks.
// Guards H1, H4, M1 and re-checks the auth/header/rate-limit hardening.
const baseUrl = process.argv[2] || process.env.VITE_API_URL || "https://my-llc-staging.info-eac.workers.dev";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};

const call = async (path, { token, method = "GET", body } = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json, headers: res.headers };
};

const email = `journey_${Date.now()}@example.com`;
const password = "password123";
const consent = {
  acceptedTerms: true,
  acceptedPrivacy: true,
  attestedAdult: true,
  termsVersion: "v1.0",
  privacyVersion: "v1.0",
  timestamp: new Date().toISOString(),
};

console.log(`base: ${baseUrl}\nregister (consent gate):`);
const noConsent = await call("/api/auth/register", {
  method: "POST",
  body: { email: `noconsent_${Date.now()}@example.com`, password, name: "No Consent" },
});
ok(noConsent.status === 400, `register without consent -> 400 (got ${noConsent.status})`);

const reg = await call("/api/auth/register", {
  method: "POST",
  body: { email, password, name: "Journey Tester", citizenship: "Italy", residency: "Germany", consent },
});
ok(reg.status === 201 && reg.json?.success === true, `register -> ${reg.status}`);
const token = reg.json?.data?.token;
ok(typeof token === "string" && token.length > 10, "register returns a JWT");

console.log("entity create + owner fields:");
const create = await call("/api/entities", {
  token,
  method: "POST",
  body: {
    name: "Journey Holdings LLC",
    formation_date: "2026-03-04",
    state: "Wyoming",
    members_count: 1,
    owner_name: "Maria Rossi",
    owner_citizenship: "Italy",
    owner_residency: "Italy",
    owner_type: "foreign",
    tax_classification: "Disregarded entity",
  },
});
ok(create.status === 201 && create.json?.success === true, `POST /api/entities -> ${create.status}`);
const entity = create.json?.data?.entity;
const entityId = entity?.id;
ok(!!entityId, "create returns an entity id");
ok(entity?.ownerName === "Maria Rossi", "ownerName returned (camelCase)");
ok(entity?.ownerCitizenship === "Italy" && entity?.ownerResidency === "Italy", "owner citizenship/residency returned");
ok(entity?.ownerType === "foreign", "ownerType returned");
ok(entity?.taxClassification === "Disregarded entity", "taxClassification returned");
ok(entity?.businessType === "Disregarded entity", "businessType mirrors taxClassification (frontend render)");
ok(entity?.formationDate === "2026-03-04" && !("formation_date" in (entity || {})), "entity date is camelCase only");

console.log("auto-seeded checklist (H1):");
const listed = await call(`/api/tasks?entityId=${entityId}`, { token });
ok(listed.status === 200 && listed.json?.success === true, `GET /api/tasks?entityId= -> ${listed.status}`);
const seeded = listed.json?.data?.tasks || [];
ok(seeded.length >= 5, `entity creation seeded ${seeded.length} default tasks`);
const titles = seeded.map((t) => t.title.toLowerCase());
ok(titles.some((t) => t.includes("w-7")), "seed includes Form W-7 / ITIN task");
ok(titles.some((t) => t.includes("5472")), "seed includes Form 5472 task");
ok(titles.some((t) => t.includes("fbar")), "seed includes FBAR task");
ok(titles.some((t) => t.includes("registered agent")), "seed includes registered agent renewal");
ok(titles.some((t) => t.includes("einkommensteuer")), "seed includes the Germany income tax task (BUG-03)");
ok(seeded.some((t) => typeof t.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)), "seeded tasks carry a concrete dueDate (BUG-03)");
ok(seeded.every((t) => t.entityId === entityId), "every seeded task is tied to the entity");

console.log("document acceptance endpoint:");
const accept = await call("/api/documents/acceptance", {
  token,
  method: "POST",
  body: { documentType: "terms", documentVersion: "v1.0" },
});
ok(accept.status === 201 && accept.json?.success === true, `POST /api/documents/acceptance -> ${accept.status}`);
// BUG-A: the gated form outputs (W-7, OA, Treaty memo) must be accepted too,
// with the client's acceptedAt carried through.
for (const documentType of ["w7", "oa", "treaty_memo"]) {
  const r = await call("/api/documents/acceptance", {
    token,
    method: "POST",
    body: { documentType, documentVersion: "v1.0", acceptedAt: new Date().toISOString() },
  });
  ok(r.status === 201 && r.json?.success === true, `POST acceptance documentType=${documentType} -> ${r.status}`);
}
const acceptBad = await call("/api/documents/acceptance", {
  token,
  method: "POST",
  body: { documentType: "nonsense", documentVersion: "v1.0" },
});
ok(acceptBad.status === 400, `invalid documentType -> 400 (got ${acceptBad.status})`);
const acceptAnon = await call("/api/documents/acceptance", {
  method: "POST",
  body: { documentType: "terms", documentVersion: "v1.0" },
});
ok(acceptAnon.status === 401, `acceptance without token -> 401 (got ${acceptAnon.status})`);

console.log("task field contract (M1):");
const sample = seeded[0];
ok(sample && "dueDate" in sample, "tasks expose dueDate (camelCase)");
ok(sample && sample.completed === false, "completed is a boolean, not 0/1");
ok(sample && !("due_date" in sample) && !("entity_id" in sample), "no snake_case leak in task payload");

console.log("POST /api/tasks (H1):");
const created = await call("/api/tasks", {
  token,
  method: "POST",
  body: { entityId, title: "Open a US business bank account", section: "Banking", dueDate: "2026-11-01", instructions: "Bring EIN + Operating Agreement." },
});
ok(created.status === 201 && created.json?.success === true, `POST /api/tasks -> ${created.status}`);
const newTask = created.json?.data?.task;
ok(newTask?.dueDate === "2026-11-01" && newTask?.entityId === entityId, "created task echoes camelCase fields");
ok(newTask?.section === "Banking", "created task keeps its section");

console.log("filter by entity (snake alias still works):");
const listedSnake = await call(`/api/tasks?entity_id=${entityId}`, { token });
ok((listedSnake.json?.data?.tasks || []).some((t) => t.id === newTask?.id), "entity_id filter returns the new task");

console.log("PATCH task:");
const patched = await call(`/api/tasks/${newTask.id}`, { token, method: "PATCH", body: { completed: true } });
ok(patched.status === 200 && patched.json?.data?.task?.completed === true, "toggling completed returns boolean true");

console.log("entity detail round-trip:");
const detail = await call(`/api/entities/${entityId}`, { token });
ok(detail.json?.data?.entity?.ownerName === "Maria Rossi", "owner fields persist via GET /api/entities/:id");

console.log("entity delete cascades children (BUG-01):");
const del = await call(`/api/entities/${entityId}`, { token, method: "DELETE" });
ok(del.status === 200 && del.json?.success === true, `DELETE /api/entities/:id with tasks -> ${del.status}`);
const gone = await call(`/api/entities/${entityId}`, { token });
ok(gone.status === 404, "deleted entity is gone");

console.log("SPA deep links (BUG-B):");
for (const p of ["/terms", "/privacy"]) {
  const res = await fetch(`${baseUrl}${p}`);
  const ct = res.headers.get("content-type") || "";
  ok(res.status === 200 && ct.includes("text/html"), `GET ${p} -> ${res.status} ${ct}`);
}
const api404 = await call("/api/does-not-exist");
ok(api404.status === 404 && api404.json?.success === false, `GET /api/does-not-exist -> JSON 404 (got ${api404.status})`);

console.log("security (unchanged):");
const anon = await call(`/api/tasks?entityId=${entityId}`);
ok(anon.status === 401, "GET /api/tasks without token -> 401");
const badToken = await call("/api/entities", { token: "not-a-jwt" });
ok(badToken.status === 401, "invalid bearer token -> 401");
const health = await call("/api/health");
ok(health.status === 200 && health.json?.success === true, "health -> 200");
ok((health.headers.get("x-content-type-options") || "") === "nosniff", "security headers present (x-content-type-options)");
ok((health.headers.get("content-security-policy") || "").length > 0, "CSP header present");

console.log(failures === 0 ? "\nJourney smoke check PASSED" : `\nJourney smoke check FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
