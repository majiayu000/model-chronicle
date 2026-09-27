import type { Model } from "./schema";

/** Code-point ordering does not depend on locale or filesystem enumeration. */
export function sortModels(models: Model[]): Model[] {
  return models.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

const columns: [string, (model: Model) => unknown][] = [
  ["id", m => m.id], ["name", m => m.name], ["vendor", m => m.vendor],
  ["family", m => m.family], ["tier", m => m.tier],
  ["announced", m => m.dates.announced], ["ga", m => m.dates.ga],
  ["input_per_mtok", m => m.specs.pricing.input_per_mtok],
  ["output_per_mtok", m => m.specs.pricing.output_per_mtok],
  ["verified_at", m => m.verified_at], ["sources", m => m.sources.join(" | ")],
  ["generation", m => m.generation], ["predecessor", m => m.predecessor],
  ["open_weights", m => m.open_weights], ["reasoning", m => m.reasoning],
  ["deprecated", m => m.dates.deprecated], ["retired", m => m.dates.retired],
  ["context_window", m => m.specs.context_window], ["max_output", m => m.specs.max_output],
  ["knowledge_cutoff", m => m.specs.knowledge_cutoff], ["params_b", m => m.specs.params_b],
  ["modalities_in", m => JSON.stringify(m.specs.modalities_in)],
  ["modalities_out", m => JSON.stringify(m.specs.modalities_out)],
  ["architecture", m => m.arch ? JSON.stringify(m.arch) : null],
  ["benchmarks", m => JSON.stringify(m.benchmarks)],
  ["price_history", m => JSON.stringify(m.price_history ?? [])],
  ["highlights", m => JSON.stringify(m.highlights)],
];

export function modelsCsv(models: Model[]): string {
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [columns.map(([name]) => name).join(","),
    ...sortModels(models).map(m => columns.map(([, get]) => quote(get(m))).join(",")),
  ].join("\n") + "\n";
}
