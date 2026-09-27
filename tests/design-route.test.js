import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

function load() {
  const ids = ["anthropic/claude-opus-4", "anthropic/claude-sonnet-4"];
  const models = ids.map(id => parse(readFileSync(new URL("../data/models/" + id + ".yaml", import.meta.url), "utf8")));
  const window = { __CHRONICLE_MODELS__: models };
  const context = createContext({ window, URL, URLSearchParams });
  for (const name of ["chronicle.js", "chronicle-route.js"]) runInContext(readFileSync(new URL("../public/graph-v2/" + name, import.meta.url), "utf8"), context);
  return window.MC;
}

describe("shareable design routes", () => {
  it("round-trips detail, filters, empty compare selection and selected group", () => {
    const mc = load();
    const state = { view: "detail", id: "claude-opus-4", vendors: ["anthropic"], tiers: ["flagship"], caps: ["reasoning"], cmp: [], bench: "SWE-bench Verified", groups: { "SWE-bench Verified": "Claude 4" } };
    const result = mc.route.parse(mc.route.serialize(state));
    expect(result).toMatchObject({ view: "detail", id: "claude-opus-4", vendors: ["anthropic"], tiers: ["flagship"], caps: ["reasoning"], cmp: [], groups: { "SWE-bench Verified": "Claude 4" } });
  });

  it("falls back from an unknown detail id without dropping valid filters", () => {
    const mc = load();
    expect(mc.route.parse("#/detail/missing?vendors=anthropic,unknown&cmp=missing,claude-opus-4")).toMatchObject({ view: "timeline", id: null, vendors: ["anthropic"], cmp: ["claude-opus-4"] });
  });

  it("selects an explicitly named verified group", () => {
    const mc = load();
    const original = mc.models;
    const another = original.map(m => ({ ...m, id: m.id + "-other", benchmarks: [{ name: "SWE-bench Verified", score: 50, comparison_group: "Other valid setup", evaluation: { benchmark_version: "different", tools: false, reasoning_effort: "off", harness: "test" } }] }));
    expect(mc.comparisonGroups([...original, ...another], "SWE-bench Verified").length).toBe(2);
    expect(mc.comparable([...original, ...another], "SWE-bench Verified", "Other valid setup").models.map(m => m.id)).toEqual(another.map(m => m.id));
  });
});
