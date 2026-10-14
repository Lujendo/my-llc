import type { CalendarEvent, Entity, Holding, HoldingMember, HoldingRelationship, Task } from "../types";

// API field contract is camelCase, matching the frontend TS types
// (src/react-app/types/index.ts). D1 columns are snake_case, so every row is
// mapped here at the API boundary — do not rename the columns.
// ponytail: one place for the wire shape, so tasks + entities stay consistent.

export function taskToApi(t: Task) {
  return {
    id: t.id,
    entityId: t.entity_id,
    title: t.title,
    section: t.section,
    dueDate: t.due_date,
    completed: !!t.completed,
    completedAt: t.completed_at,
    instructions: t.instructions,
    createdAt: t.created_at,
  };
}

export function entityToApi(e: Entity) {
  return {
    id: e.id,
    userId: e.user_id,
    name: e.name,
    formationDate: e.formation_date,
    state: e.state,
    membersCount: e.members_count,
    status: e.status,
    ownerName: e.owner_name,
    ownerCitizenship: e.owner_citizenship,
    ownerResidency: e.owner_residency,
    ownerType: e.owner_type,
    taxClassification: e.tax_classification,
    // ponytail: frontend renders entity.businessType; mirror the tax classification
    // rather than add a second column for the same value.
    businessType: e.tax_classification,
    createdAt: e.created_at,
  };
}

export function holdingToApi(h: Holding) {
  return {
    id: h.id,
    userId: h.user_id,
    name: h.name,
    jurisdictionCountry: h.jurisdiction_country,
    jurisdictionSubdivision: h.jurisdiction_subdivision,
    baseCurrency: h.base_currency,
    currencyAsOf: h.currency_as_of,
    effectiveFrom: h.effective_from,
    effectiveTo: h.effective_to,
    createdAt: h.created_at,
  };
}

export function holdingRelationshipToApi(r: HoldingRelationship) {
  return {
    id: r.id,
    childHoldingId: r.child_holding_id,
    parentHoldingId: r.parent_holding_id,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
    createdAt: r.created_at,
  };
}

export function holdingMemberToApi(m: HoldingMember) {
  return {
    id: m.id,
    holdingId: m.holding_id,
    entityId: m.entity_id,
    effectiveFrom: m.effective_from,
    effectiveTo: m.effective_to,
    createdAt: m.created_at,
  };
}

export function calendarEventToApi(e: CalendarEvent) {
  return {
    id: e.id,
    userId: e.user_id,
    title: e.title,
    description: e.description,
    location: e.location,
    color: e.color,
    startTime: e.start_time,
    endTime: e.end_time,
    isAllDay: !!e.is_all_day,
    jurisdictionCountry: e.jurisdiction_country,
    eventType: e.event_type,
    source: e.source,
    reminder: e.reminder,
    recurrence: e.recurrence,
    entityId: e.entity_id,
    createdAt: e.created_at,
  };
}
