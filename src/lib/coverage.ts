import type { Model } from "./schema";

export type ReviewReason = "ga" | "pricing" | "benchmark" | "comparison" | "architecture" | "stale";

export function reviewReasons(model: Model, today: string): ReviewReason[] {
  const reasons: ReviewReason[] = [];
  if (!model.dates.ga) reasons.push("ga");
  if (model.specs.pricing.input_per_mtok === null || model.specs.pricing.output_per_mtok === null) reasons.push("pricing");
  if (!model.benchmarks.length) reasons.push("benchmark");
  else if (!model.benchmarks.some((b) => b.comparison_group && b.evaluation)) reasons.push("comparison");
  if (!model.arch) reasons.push("architecture");
  if ((Date.parse(today) - Date.parse(model.verified_at)) / 86_400_000 > 90) reasons.push("stale");
  return reasons;
}

export function coverage(models: Model[], today: string) {
  const count = (test: (model: Model) => boolean) => models.filter(test).length;
  return {
    total: models.length,
    ga: count((m) => !!m.dates.ga),
    pricing: count((m) => m.specs.pricing.input_per_mtok !== null && m.specs.pricing.output_per_mtok !== null),
    benchmark: count((m) => m.benchmarks.length > 0),
    comparable: count((m) => m.benchmarks.some((b) => b.comparison_group && b.evaluation)),
    architecture: count((m) => !!m.arch),
    lifecycle: count((m) => !!m.dates.deprecated || !!m.dates.retired),
    priceHistory: count((m) => (m.price_history?.length ?? 0) > 1),
    stale: count((m) => reviewReasons(m, today).includes("stale")),
  };
}
