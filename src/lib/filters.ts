import type { Model, Tier, Vendor } from "./schema";

export interface Filters {
  vendors: Set<Vendor>;
  tiers: Set<Tier>;
  openWeightsOnly: boolean;
}

export function applyFilters(models: Model[], f: Filters): Model[] {
  return models.filter(
    (m) => f.vendors.has(m.vendor) && f.tiers.has(m.tier) && (!f.openWeightsOnly || m.open_weights),
  );
}

export function toggle<T>(set: Set<T>, v: T): Set<T> {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}
