import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

describe("API lifecycle display", () => {
  it("honors sourced retirement even without GA and does not retire a future shutdown early", () => {
    const template = parse(readFileSync(new URL("../data/models/google/gemini-2-0-pro.yaml", import.meta.url), "utf8"));
    const records = [
      { ...template, id: "retired-preview", name: "Retired preview", dates: { ...template.dates, ga: null, deprecated: "2025-11-04", retired: "2025-12-09" } },
      { ...template, id: "future-shutdown", name: "Future shutdown", dates: { ...template.dates, ga: "2025-02-05", deprecated: "2026-04-22", retired: "2026-10-23" } },
      { ...template, id: "unverified", name: "Unverified", dates: { ...template.dates, deprecated: null, retired: null } },
    ];
    const window = { __CHRONICLE_MODELS__: records };
    const context = createContext({ window });
    runInContext(readFileSync(new URL("../public/graph-v2/chronicle.js", import.meta.url), "utf8"), context);
    window.MC.today = "2026-09-27";
    runInContext(readFileSync(new URL("../public/graph-v2/chronicle-ext.js", import.meta.url), "utf8"), context);
    const result = window.MC.ext({ view: "life", vendors: ["google"], tiers: ["flagship"], caps: [] }, () => {}).li;
    expect(Object.fromEntries(result.rows.map(r => [r.name, r.stLabel]))).toEqual({
      "Retired preview": "已下线", "Future shutdown": "弃用中", Unverified: "状态未核实",
    });
    expect(result.upcoming.map(r => r.name)).toEqual(["Future shutdown"]);
  });
});
