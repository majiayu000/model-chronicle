import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

const records = JSON.parse(readFileSync(new URL("../src/generated/models.json", import.meta.url), "utf8"));
function load() {
  const window = { __CHRONICLE_MODELS__: records, scrollTo() {} };
  const context = createContext({ window, URL, URLSearchParams });
  for (const file of ["catalog-tools.js", "chronicle.js", "chronicle-vm.js", "chronicle-route.js", "chronicle-ext.js", "chronicle-ext2.js"]) runInContext(readFileSync(new URL(`../public/graph-v2/${file}`, import.meta.url), "utf8"), context);
  return { mc: window.MC, tools: window.MCCatalog };
}

describe("catalog search and tools", () => {
  it("keeps the startup fallback until ready, then hides it without moving it over the timeline", () => {
    const landing = { hidden: false };
    const window = {};
    const context = createContext({
      window,
      document: { querySelector: () => null, getElementById: id => id === "site-discovery" ? landing : null },
      DCLogic: class {},
    });
    runInContext(readFileSync(new URL("../src/design/application.js", import.meta.url), "utf8") + "\nwindow.App = Component;", context);
    const app = new window.App();
    app.componentDidUpdate();
    expect(landing.hidden).toBe(false);
    app.state.ready = true;
    app.componentDidUpdate();
    expect(landing.hidden).toBe(true);
  });
  it("normalizes spelling, prioritizes exact models, and exposes all results", () => {
    const { mc } = load();
    const search = (q, extra = {}) => mc.ext2({ ...mc.initState(), q, ...extra }, () => {}).pal;
    expect(search("gpt 4o").hits[0].name).toBe("GPT-4o");
    expect(search("千问").count).toBe(records.filter(m => m.vendor === "qwen").length);
    expect(search("千问").hits).toHaveLength(8);
    expect(search("千问").hasMore).toBe(true);
    expect(search("千问", { searchAll: true }).hits).toHaveLength(search("千问").count);
  });
  it("opens the keyboard-selected search result and ignores composition Enter", () => {
    const { mc } = load();
    let state = { ...mc.initState(), q: "gpt 4o" };
    const set = patch => { state = { ...state, ...patch }; };
    mc.ext2(state, set).pal.onKey({ key: "ArrowDown", preventDefault() {} });
    expect(state.searchIndex).toBe(1);
    mc.ext2(state, set).pal.onKey({ key: "Enter", isComposing: true });
    expect(state.view).toBe("timeline");
    mc.ext2(state, set).pal.onKey({ key: "Enter", preventDefault() {} });
    expect(state.id).toBe("gpt-4o-mini");
  });
  it("round-trips thresholds and difference-only comparison", () => {
    const { mc } = load();
    const state = { ...mc.initState(), view: "cost", bench: "SWE-bench Verified", thr: { "SWE-bench Verified": 85 }, diffOnly: true };
    const restored = { ...mc.initState(), ...mc.route.parse(mc.route.serialize(state)) };
    expect(mc.ext(restored, () => {}).co.thr).toBe(85);
    expect(restored.diffOnly).toBe(true);
    expect(mc.route.parse("#/cost?bench=SWE-bench+Verified&threshold=1000").thr).toBeUndefined();
  });
  it("does not equate missing open-weight evidence with failure to catch up", () => {
    const { mc } = load();
    const result = mc.ext({ ...mc.initState(), view: "catchup", bench: "SWE-bench Verified" }, () => {}).cu;
    expect(result.insufficient).toBe(true);
    expect(result.rows).toEqual([]);
    expect(result.pendingDays).toBe("—");
    expect(result.pendingSub).toContain("资料不足");
  });
  it("defaults to a usable verified comparison and can omit identical rows", () => {
    const { mc } = load();
    const full = mc.ext2({ ...mc.initState(), view: "compare" }, () => {}).cp;
    expect(full.hasBench).toBe(true);
    expect(full.heads.length).toBeGreaterThanOrEqual(2);
    const diff = mc.ext2({ ...mc.initState(), view: "compare", diffOnly: true }, () => {}).cp;
    expect(diff.specs.length).toBeLessThan(full.specs.length);
    expect(diff.specs.every(r => new Set(r.cells.map(c => c.v)).size > 1)).toBe(true);
  });
  it("keeps unknown specifications out of positive filters and preserves month precision", () => {
    const { tools } = load();
    const model = structuredClone(records[0]);
    model.specs.context_window = null;
    expect(tools.filter([model], { context: 1 })).toEqual([]);
    model.dates.ga = "2026-09";
    expect(tools.filter([model], { from: "2026-09-25", to: "2026-10-01" })).toHaveLength(1);
    expect(tools.filter([model], { from: "2026-10-01" })).toEqual([]);
  });
  it("calculates explicit usage without inventing missing prices", () => {
    const { tools } = load();
    const price = { input_per_mtok: 2, output_per_mtok: 10 };
    expect(tools.estimate(price, 3000, 1000, 1000)).toBe(16);
    expect(tools.estimate({ ...price, input_per_mtok: null }, 3000, 1000, 1000)).toBeNull();
    expect(tools.estimate(price, -1, 1000, 1000)).toBeNull();
    expect(tools.estimate(price, Infinity, 1000, 1000)).toBeNull();
  });
  it("exports just selected models and preserves missing fields and safe spreadsheet text", () => {
    const { tools } = load();
    const model = structuredClone(records[0]);
    model.name = '=HYPERLINK("x")';
    model.specs.context_window = null;
    const csv = tools.csv([model]);
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('""');
    expect(csv).toContain(model.verified_at);
  });
});
