import type { Model, Tier, Vendor } from "./schema";
import { TIERS, VENDORS } from "./constants";
import { byRelease } from "./intervals";

/** 一条“继任线”：同 vendor + family + tier 的模型按时间排列 */
export interface Line {
  key: string;
  vendor: Vendor;
  family: string;
  tier: Tier;
  models: Model[];
}

export function buildLines(models: Model[]): Line[] {
  const map = new Map<string, Line>();
  for (const m of models) {
    const key = `${m.vendor}/${m.family}/${m.tier}`;
    const line = map.get(key) ?? { key, vendor: m.vendor, family: m.family, tier: m.tier, models: [] };
    line.models.push(m);
    map.set(key, line);
  }
  return [...map.values()]
    .map((l) => ({ ...l, models: [...l.models].sort(byRelease) }))
    .sort(
      (a, b) =>
        VENDORS.indexOf(a.vendor) - VENDORS.indexOf(b.vendor) ||
        a.family.localeCompare(b.family) ||
        TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier),
    );
}
