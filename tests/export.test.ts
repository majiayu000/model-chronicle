import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { Model } from "../src/lib/schema";
import { modelsCsv, sortModels } from "../src/lib/export";

const models = JSON.parse(readFileSync(new URL("../src/generated/models.json", import.meta.url), "utf8")) as Model[];

// RFC 4180 quoted cells, including embedded newlines and escaped quotes.
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(cell); cell = "";
      if (c === '\n') { rows.push(row); row = []; }
    } else cell += c;
  }
  return rows;
}

describe("dataset exports", () => {
  it("produces identical JSON ordering and CSV from different enumeration orders", () => {
    const reversed = [...models].reverse();
    expect(sortModels(reversed)).toEqual(models);
    expect(modelsCsv(reversed)).toBe(modelsCsv(models));
    expect(reversed[0]).toEqual(models.at(-1));
    expect(readFileSync(new URL("../public/dataset/models.json", import.meta.url), "utf8")).toBe(JSON.stringify(models, null, 2));
    expect(readFileSync(new URL("../public/dataset/models.csv", import.meta.url), "utf8")).toBe(modelsCsv(models));
  });

  it("round trips structured data, quotes and newlines without conflating null, zero and false", () => {
    const model: Model = { ...models[0], name: 'name, "quoted"\nsecond line', open_weights: false,
      specs: { ...models[0].specs, context_window: null, pricing: { input_per_mtok: 0, output_per_mtok: null } } };
    const [header, values] = parseCsv(modelsCsv([model]));
    const row = Object.fromEntries(header.map((name, i) => [name, values[i]]));
    expect(header).toHaveLength(27);
    expect(values).toHaveLength(header.length);
    expect(row).toMatchObject({ name: model.name, input_per_mtok: "0", output_per_mtok: "", context_window: "", open_weights: "false" });
    expect(JSON.parse(row.benchmarks)).toEqual(model.benchmarks);
    expect(JSON.parse(row.modalities_in)).toEqual(model.specs.modalities_in);
    expect(JSON.parse(row.price_history)).toEqual(model.price_history ?? []);
  });
});
