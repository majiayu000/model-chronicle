import type { Model } from "../src/lib/schema";

type Overrides = Omit<Partial<Model>, "dates" | "specs"> & {
  dates?: Partial<Model["dates"]>;
  specs?: Partial<Model["specs"]>;
};

export function makeModel(o: Overrides = {}): Model {
  const { dates, specs, ...rest } = o;
  return {
    id: "m-1",
    name: "M 1",
    vendor: "anthropic",
    family: "claude",
    tier: "mid",
    generation: "1",
    predecessor: null,
    open_weights: false,
    benchmarks: [],
    highlights: [],
    sources: ["https://example.com/a"],
    verified_at: "2026-09-24",
    ...rest,
    dates: { announced: null, ga: "2024-01-01", deprecated: null, retired: null, ...dates },
    specs: {
      context_window: null,
      max_output: null,
      modalities_in: ["text"],
      modalities_out: ["text"],
      knowledge_cutoff: null,
      params_b: null,
      pricing: { input_per_mtok: null, output_per_mtok: null },
      ...specs,
    },
  };
}
