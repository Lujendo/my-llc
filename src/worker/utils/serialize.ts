import type { Entity, Task } from "../types";

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
