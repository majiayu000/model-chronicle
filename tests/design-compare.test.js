import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

function load() {
  const records = ["anthropic/claude-opus-4", "anthropic/claude-sonnet-4", "openai/gpt-5-mini", "openai/gpt-5-nano", "openai/gpt-4o"]
    .map(id => parse(readFileSync(new URL("../data/models/" + id + ".yaml", import.meta.url), "utf8")));
  const window = { __CHRONICLE_MODELS__: records, scrollTo() {} };
  const context = createContext({ window });
  for (const name of ["catalog-tools.js", "chronicle.js", "chronicle-ext2.js"]) {
    runInContext(readFileSync(new URL("../public/graph-v2/" + name, import.meta.url), "utf8"), context);
  }
  return window.MC;
}

const event = { preventDefault() {}, stopPropagation() {} };

describe("design model comparison", () => {
  it("shows unverified scores without claiming a benchmark winner", () => {
    const mc = load();
    const result = mc.ext2({ view: "compare", cmp: ["gpt-5-mini", "gpt-5-nano"] }, () => {});
    const row = result.cp.bench.find(row => row.label === "SWE-bench Verified");
    expect(row.cells.map(cell => cell.v)).toEqual([71, 54.7]);
    expect(row.cells.some(cell => cell.best)).toBe(false);
    expect(result.cp.heads.map(head => head.wins)).toEqual([0, 0]);
  });

  it("ranks only the verified comparison group when mixed with other scores", () => {
    const mc = load();
    const result = mc.ext2({ view: "compare", cmp: ["claude-opus-4", "claude-sonnet-4", "gpt-5-mini"] }, () => {});
    const row = result.cp.bench.find(row => row.label === "SWE-bench Verified");
    expect(row.cells.map(cell => cell.best)).toEqual([false, true, false]);
    expect(result.cp.heads.map(head => head.wins)).toEqual([0, 1, 0]);
  });

  it("preserves an empty selection and skips unknown model IDs", () => {
    const mc = load();
    expect(mc.ext2({ view: "compare", cmp: [] }, () => {}).cp.empty).toBe(true);
    expect(mc.ext2({ view: "compare", cmp: ["missing"] }, () => {}).cp.n).toBe(0);
  });

  it("prevents a fifth model or duplicate from being added through search", () => {
    const mc = load();
    const changes = [];
    const result = mc.ext2({ view: "compare", cmp: ["claude-opus-4", "claude-sonnet-4", "gpt-5-mini", "gpt-5-nano"] }, change => changes.push(change));
    expect(result.cp.full).toBe(true);
    for (const hit of result.pal.hits) hit.add(event);
    expect(changes).toEqual([]);
  });
});
