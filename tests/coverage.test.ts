import { describe, expect, it } from "vitest";
import { coverage, reviewReasons } from "../src/lib/coverage";
import { modelSchema } from "../src/lib/schema";
import { makeModel } from "./fixture";

describe("published data coverage", () => {
  it("separates missing values from zero and marks outdated verification", () => {
    const model = makeModel({ verified_at: "2026-01-01", dates: { ga: null, announced: "2026-01-01" } });
    const reasons = reviewReasons(model, "2026-09-27");
    expect(reasons).toContain("ga");
    expect(reasons).toContain("pricing");
    expect(reasons).toContain("stale");
    expect(coverage([model], "2026-09-27")).toMatchObject({ total: 1, ga: 0, pricing: 0, stale: 1 });
  });

  it("accepts ordered sourced price observations and rejects unsupported prices", () => {
    const model = makeModel();
    const source = model.sources[0];
    const observation = { observed_at: "2024-01-01", input_per_mtok: 0, output_per_mtok: 1, source };
    expect(modelSchema.safeParse({ ...model, price_history: [observation] }).success).toBe(true);
    expect(modelSchema.safeParse({ ...model, price_history: [observation, observation] }).success).toBe(false);
    expect(modelSchema.safeParse({ ...model, price_history: [{ ...observation, source: "https://elsewhere.example/pricing" }] }).success).toBe(false);
    expect(modelSchema.safeParse({ ...model, price_history: [{ ...observation, observed_at: "2023-12-31" }] }).success).toBe(false);
  });

  it("keeps partially known evaluation conditions out of comparison groups", () => {
    const model = makeModel();
    const benchmark = { name: "GPQA Diamond", score: 70, reported_by: "vendor", source: model.sources[0], evaluation: { benchmark_version: "GPQA Diamond", tools: false, reasoning_effort: "high" } };
    expect(modelSchema.safeParse({ ...model, benchmarks: [benchmark] }).success).toBe(true);
    expect(modelSchema.safeParse({ ...model, benchmarks: [{ ...benchmark, comparison_group: "same-table" }] }).success).toBe(false);
    expect(modelSchema.safeParse({ ...model, benchmarks: [{ ...benchmark, comparison_group: "same-table", evaluation: { ...benchmark.evaluation, harness: "documented harness" } }] }).success).toBe(true);
  });
});
