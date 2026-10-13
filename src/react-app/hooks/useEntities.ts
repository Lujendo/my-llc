import { useState, useEffect, useCallback } from "react";
import type { Entity } from "../types";

export const useEntities = (userId: string | undefined) => {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    if (!userId) return;

    const stored = localStorage.getItem(`entities_${userId}`);
    if (stored) {
      try {
        setEntities(JSON.parse(stored));
      } catch {
        localStorage.removeItem(`entities_${userId}`);
      }
    }
  }, [userId]);

  const createEntity = useCallback(
    (name: string, formationDate: string, state: string, membersCount: number, businessType: string) => {
      if (!userId) throw new Error("User not authenticated");

      const newEntity: Entity = {
        id: `entity_${Date.now()}`,
        userId,
        name,
        formationDate,
        state,
        membersCount,
        businessType,
        createdAt: new Date().toISOString(),
      };

      const updated = [...entities, newEntity];
      localStorage.setItem(`entities_${userId}`, JSON.stringify(updated));
      setEntities(updated);
      return newEntity;
    },
    [userId, entities]
  );

  const deleteEntity = useCallback(
    (entityId: string) => {
      if (!userId) throw new Error("User not authenticated");

      const updated = entities.filter((e) => e.id !== entityId);
      localStorage.setItem(`entities_${userId}`, JSON.stringify(updated));
      setEntities(updated);
    },
    [userId, entities]
  );

  return {
    entities,
    createEntity,
    deleteEntity,
  };
};
