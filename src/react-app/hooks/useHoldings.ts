import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { normalizeHolding, type HoldingNode } from "../lib/holdings";

export interface ConstellationInput {
  name: string;
  jurisdictionCountry: string;
  baseCurrency: string;
  effectiveFrom: string;
}

// Loads the user's root holdings (constellations) and creates new ones.
// The consolidated rollup is fetched per-selection inside HoldingHub.
export const useHoldings = (userId: string | undefined) => {
  const [constellations, setConstellations] = useState<HoldingNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listHoldings();
      setConstellations((data.constellations || []).map(normalizeHolding));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load holdings");
      setConstellations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConstellation = useCallback(
    async (input: ConstellationInput) => {
      const data = await api.createHolding(input);
      const holding = normalizeHolding(data.holding);
      await refresh();
      return holding;
    },
    [refresh]
  );

  return { constellations, loading, error, refresh, createConstellation };
};
