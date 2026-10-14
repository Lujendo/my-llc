import { useState, useEffect, useCallback } from "react";
import type { Entity } from "../types";
import { api } from "../lib/api";
import { toStateCode } from "../lib/states";

export interface EntityInput {
  name: string;
  formationDate?: string;
  state?: string;
  membersCount?: number;
  ownerName?: string;
  ownerCitizenship?: string;
  ownerResidency?: string;
  ownerType?: string;
  taxClassification?: string;
}

// Wire shape is snake_case (src/worker/routes/entities.ts). State is stored as a
// canonical 2-letter code so the OA gate (OA_SUPPORTED_STATES = ["WY"]) matches.
const toWire = (d: Partial<EntityInput>): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (d.name !== undefined) body.name = d.name;
  if (d.formationDate !== undefined) body.formation_date = d.formationDate;
  if (d.state !== undefined) body.state = toStateCode(d.state);
  if (d.membersCount !== undefined) body.members_count = d.membersCount;
  if (d.ownerName !== undefined) body.owner_name = d.ownerName;
  if (d.ownerCitizenship !== undefined) body.owner_citizenship = d.ownerCitizenship;
  if (d.ownerResidency !== undefined) body.owner_residency = d.ownerResidency;
  if (d.ownerType !== undefined) body.owner_type = d.ownerType;
  if (d.taxClassification !== undefined) body.tax_classification = d.taxClassification;
  return body;
};

const normalize = (e: Entity): Entity => ({ ...e, state: toStateCode(e.state) });

export const useEntities = (userId: string | undefined) => {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const data = await api.request<{ entities: Entity[] }>("/api/entities");
        setEntities((data.entities || []).map(normalize));
      } catch {
        setEntities([]);
      }
    })();
  }, [userId]);

  const createEntity = useCallback(
    async (input: EntityInput) => {
      if (!userId) throw new Error("User not authenticated");
      const data = await api.request<{ entity: Entity }>("/api/entities", {
        method: "POST",
        body: JSON.stringify(toWire(input)),
      });
      const entity = normalize(data.entity);
      setEntities((prev) => [...prev, entity]);
      return entity;
    },
    [userId]
  );

  const updateEntity = useCallback(
    async (id: string, input: Partial<EntityInput>) => {
      if (!userId) throw new Error("User not authenticated");
      const data = await api.request<{ entity: Entity }>(`/api/entities/${id}`, {
        method: "PATCH",
        body: JSON.stringify(toWire(input)),
      });
      const entity = normalize(data.entity);
      setEntities((prev) => prev.map((e) => (e.id === id ? entity : e)));
      return entity;
    },
    [userId]
  );

  const deleteEntity = useCallback(
    async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      await api.request(`/api/entities/${id}`, { method: "DELETE" });
      setEntities((prev) => prev.filter((e) => e.id !== id));
    },
    [userId]
  );

  return {
    entities,
    createEntity,
    updateEntity,
    deleteEntity,
  };
};
