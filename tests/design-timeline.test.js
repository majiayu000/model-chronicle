import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

const catalog = JSON.parse(readFileSync(new URL("../src/generated/models.json", import.meta.url), "utf8"));
const base = catalog.find(m => m.id === "gpt-4o");
function model(id, date, overrides = {}) {
  return { ...structuredClone(base), id, name: id, generation: id, predecessor: null,
    dates: { announced: date, ga: date, deprecated: null, retired: null }, ...overrides };
}
function load(records = catalog) {
  const window = { __CHRONICLE_MODELS__: records, scrollTo() {} };
  const context = createContext({ window, URL, URLSearchParams,
    React: { Component: class {}, createElement(tag, props, ...children) { return { tag, props, children }; } }, DCLogic: class {} });
  for (const name of ["chronicle.js", "chronicle-timeline.js", "chronicle-route.js", "chronicle-vm.js", "chronicle-ext.js", "chronicle-ext2.js"]) {
    runInContext(readFileSync(new URL(`../public/graph-v2/${name}`, import.meta.url), "utf8"), context);
    window.MC.today = "2026-09-27";
  }
  runInContext(readFileSync(new URL("../src/design/application.js", import.meta.url), "utf8") + "\nwindow.App = Component;", context);
  const mc = window.MC;
  const changes = [];
  const view = (state = {}) => mc.vm({ ...mc.initState(), ...state }, p => changes.push(p));
  const render = (state = {}) => {
    const app = new window.App(); app.props = {};
    app.state = { ...mc.initState(), ready: true, ...state };
    return app.renderVals();
  };
  return { mc, view, render, changes, window };
}

describe("focused timeline", () => {
  it("defaults to a calendar-year window with inclusive boundaries and leap-day clamping", () => {
    const { mc } = load([]);
    expect(mc.initState()).toMatchObject({ window: "recent", history: [], archives: [], px: 840 });
    const range = mc.timeline.windowRange();
    expect(range.startDate).toBe("2025-09-27");
    for (const [date, included] of [["2025-09-26", false], ["2025-09-27", true], ["2026-09-27", true], ["2026-09-28", false], ["2025-09", true], ["2025-08", false]]) {
      expect(mc.timeline.inWindow({ date }, range), date).toBe(included);
    }
    expect(mc.timeline.windowRange("recent", "2024-02-29").startDate).toBe("2023-02-28");
  });

  it("keeps early history accessible and preserves the global axis and window counts when expanded", () => {
    const { view, changes } = load([model("old", "2024-01-01"), model("new", "2026-01-01", { predecessor: "old" })]);
    const closed = view(); const row = closed.tl.rows.find(r => r.isLine);
    expect(row.dots.map(d => d.id)).toEqual(["new"]);
    expect(row.history.map(m => m.id)).toEqual(["old"]);
    expect(row.historyOpen).toBe(false); expect(row.hasHistory).toBe(true);
    row.toggleHistory(); expect(changes.at(-1)).toMatchObject({ history: ["old"] });
    const expanded = view(changes.at(-1));
    expect(expanded.tl.rows[0].historyOpen).toBe(true);
    expect(expanded.tl.rows[0].dots[0].px).toBe(row.dots[0].px);
    expect(expanded.shown).toBe(closed.shown);
    expect(expanded.tl.width).toBe(closed.tl.width);
  });

  it("groups genuine independent models only within their vendor and tier, separating old archives", () => {
    const records = [model("one", "2026-01-01"), model("two", "2026-01-01", { family: "gpt-pro" }),
      model("small", "2026-01-01", { tier: "small" }), model("google", "2026-01-01", { vendor: "google", family: "gemini" }),
      model("old-solo", "2024-01-01")];
    const { view, mc } = load(records);
    const rows = view().tl.rows.filter(r => r.isLine);
    expect(rows).toHaveLength(3);
    const merged = rows.find(r => r.n === 2);
    expect(merged.dots.map(d => d.id)).toEqual(["one", "two"]);
    expect(new Set(merged.dots.map(d => d.top)).size).toBe(2);
    expect(new Set(merged.dots.map(d => d.px)).size).toBe(1);
    expect(merged.segs).toEqual([]); expect(merged.pending).toBeNull();
    expect(view().tl.archiveCount).toBe(1);
    expect(mc.models.every(m => m.predecessor === null)).toBe(true);
  });

  it("does not merge a real lineage reduced to one node by filters or invent an edge across an excluded generation", () => {
    const textOnly = { ...base.specs, modalities_in: ["text"] };
    const records = [model("first", "2025-10-01"), model("middle", "2026-01-01", { predecessor: "first", specs: textOnly }),
      model("last", "2026-05-01", { predecessor: "middle" }), model("solo", "2026-05-01")];
    const { view } = load(records);
    const rows = view({ caps: ["vision"] }).tl.rows.filter(r => r.isLine);
    expect(rows).toHaveLength(2);
    expect(rows.find(r => !r.merged).segs).toEqual([]);
    const { view: single } = load([model("first", "2024-01-01", { specs: textOnly }), model("last", "2026-05-01", { predecessor: "first" }), model("solo", "2026-05-01")]);
    expect(single({ caps: ["vision"] }).tl.rows.filter(r => r.isLine).map(r => r.merged)).toEqual([false, true]);
  });

  it("exposes old-only vendors in expandable archives even with an empty recent result", () => {
    const { view, changes } = load([model("old", "2024-01-01")]);
    const v = view(); expect(v.empty).toBe(true); expect(v.tl.rowCount).toBe(0);
    const archive = v.tl.rows[0]; expect(archive.archive).toBe(true);
    archive.toggleArchive();
    const open = view(changes.at(-1)).tl.rows[0];
    expect(open.archiveOpen).toBe(true);
    expect(open.archivedRows.flatMap(r => r.models.map(m => m.id))).toEqual(["old"]);
    expect(view({ vendors: [] }).tl.rows).toEqual([]);
  });

  it("restores every model in all-history mode and never loses a catalog record to folding", () => {
    const { view } = load();
    const recent = view();
    expect(recent).toMatchObject({ shown: 92, total: 92 });
    expect(recent.tl).toMatchObject({ lineCount: 46, archiveCount: 44 });
    const ids = recent.tl.rows.flatMap(r => r.isLine ? [...(r.isVariants ? r.variants : r.dots).map(d => d.id), ...r.history.map(h => h.id)] : r.archivedRows.flatMap(a => a.models.map(m => m.id)));
    expect(new Set(ids).size).toBe(catalog.length);
    const all = view({ window: "all" });
    expect(all.tl.lineCount).toBe(90);
    expect(all.tl.archiveCount).toBe(0);
    expect(view({ window: "all", history: ["claude-3-opus"] }).tl.rows.every(r => !r.historyOpen)).toBe(true);
    expect(all.tl.rows.flatMap(r => r.isVariants ? r.variants : r.dots).map(d => d.id).sort()).toEqual(catalog.map(m => m.id).sort());
  });

  it("updates cards, coverage and heatmap with window and filters but leaves other views and detail available", () => {
    const { render, mc } = load();
    const v = render({ vendors: ["anthropic"] });
    expect(v).toMatchObject({ heroTotal: 12, coverageTotal: 12, vendorCount: 1, shown: 12, total: 92 });
    expect(v.heat.flatMap(r => r.cells).reduce((n, cell) => n + Number(cell.tip.match(/ · (\d+)$/)?.[1] || 0), 0)).toBe(12);
    expect(render({ vendors: [], caps: ["vision"] })).toMatchObject({ heroTotal: 0, vendorCount: 0, coverageTotal: 0 });
    expect(render({ view: "trends" }).heroTotal).toBe(catalog.length);
    expect(render({ view: "detail", id: "claude-2" }).d.m.id).toBe("claude-2");
    expect(mc.models).toHaveLength(catalog.length);
  });

  it("keeps a month-precision boundary node on the visible axis without changing its recorded date", () => {
    const { view } = load([model("month", "2025-09")]);
    const row = view().tl.rows[0];
    expect(row.dots[0].px).toBeGreaterThanOrEqual(0);
    expect(row.dots[0].id).toBe("month");
  });

  it("adapts default zoom to narrow screens and preserves explicit zoom in shared links", () => {
    const { view, window, mc, changes } = load();
    window.innerWidth = 390;
    expect(view().tl.pxPerYear).toBe(220);
    view().tl.onZoom({ target: { value: "840" } });
    const state = { ...mc.initState(), ...changes.at(-1) };
    const restored = mc.route.parse(mc.route.serialize(state));
    expect(restored).toMatchObject({ px: 840, autoScale: false });
    expect(view(restored).tl.pxPerYear).toBe(840);
  });

  it("avoids overlapping long generation labels at narrow-screen zoom", () => {
    const { render, window } = load([
      model("one", "2026-01-25", { generation: "Long Generation" }),
      model("two", "2026-02-15", { predecessor: "one", generation: "2" }),
      model("three", "2026-04-02", { predecessor: "two", generation: "3" }),
    ]);
    window.innerWidth = 390;
    const dots = render().tl.rows[0].dots;
    expect(dots[0].showGen).toBe(true);
    expect(dots[1].showGenUp).toBe(true);
    expect(dots[2].showGen).toBe(false);
    expect(dots.map(d => d.id)).toEqual(["one", "two", "three"]);
  });
});

describe("timeline share state", () => {
  it("round-trips window and expansion state through a detail link", () => {
    const { mc } = load();
    const state = { ...mc.initState(), view: "detail", id: "claude-3-opus", window: "all", history: ["claude-3-opus"], archives: ["anthropic"], px: 420 };
    expect(mc.route.parse(mc.route.serialize(state))).toMatchObject({ view: "detail", id: "claude-3-opus", window: "all", history: ["claude-3-opus"], archives: ["anthropic"], px: 420 });
  });
  it("resets missing state to recent and discards unknown, duplicate or non-root expansion IDs", () => {
    const { mc } = load();
    expect(mc.route.parse("#/timeline")).toMatchObject({ window: "recent", history: [], archives: [] });
    expect(mc.route.parse("#/timeline?window=invalid&history=missing,claude-3-opus,claude-3-opus,claude-opus-4&archives=anthropic,unknown,anthropic")).toMatchObject({ window: "recent", history: ["claude-3-opus"], archives: ["anthropic"] });
  });
});

describe("generation variants and vendor focus", () => {
  it("renders native select options as plain text with accessible names", () => {
    const select = load().render({ vendors: ["google"] }).vendorSelect;
    expect(select.tag).toBe("select");
    expect(select.props.value).toBe("google");
    expect(select.children.find(c => c?.props.value === "google").children).toEqual(["Google (14)"]);
    expect(select.children.filter(Boolean).every(c => c.tag === "option" && typeof c.children[0] === "string")).toBe(true);
  });
  it("collapses all five Gemma 4 variants including 12B into one expandable row across tiers", () => {
    const { view, changes } = load();
    const google = view({ vendors: ["google"] });
    const row = google.tl.rows.find(r => r.family === "Gemma 4");
    const ids = catalog.filter(m => m.family === "gemma" && m.generation === "4").map(m => m.id).sort();
    expect(row).toMatchObject({ isVariants: true, n: 5, height: 72, variantsOpen: false });
    expect(row.variants.map(m => m.id).sort()).toEqual(ids);
    expect(row.dots).toEqual([]); expect(row.segs).toEqual([]); expect(row.pending).toBeNull();
    expect(row.variantDate).toBe("2026-04-02 — 2026-06-03");
    const others = google.tl.rows.filter(r => r !== row).flatMap(r => [...r.dots, ...(r.variants || []), ...(r.history || [])]).map(m => m.id);
    expect(others.some(id => ids.includes(id))).toBe(false);
    row.toggleVariants();
    expect(view({ vendors: ["google"], ...changes.at(-1) }).tl.rows.find(r => r.family === "Gemma 4").variantsOpen).toBe(true);
    expect(view({ vendors: ["google"], tiers: ["small"] }).tl.rows.find(r => r.family === "Gemma 4").n).toBe(3);
  });

  it("groups parallel variants across tiers without combining vendors, families or sequential revisions", () => {
    const records = [
      model("small", "2026-01-01", { generation: "4", tier: "small" }),
      model("large", "2026-02-01", { generation: "4" }),
      model("other-vendor", "2026-01-01", { generation: "4", vendor: "google" }),
      model("other-family", "2026-01-01", { generation: "4", family: "gpt-pro" }),
    ];
    const { mc } = load(records);
    expect(mc.timeline.variantGroups().map(g => g.models.map(m => m.id).sort())).toEqual([["large", "small"]]);
    const revised = load([model("original", "2025-01-01", { generation: "4" }), model("revision", "2026-01-01", { generation: "4", predecessor: "original" })]);
    expect(revised.mc.timeline.variantGroups()).toEqual([]);
  });

  it("preserves variant expansion and single-vendor selection in shareable detail links", () => {
    const { mc, view } = load();
    const id = view().tl.rows.find(r => r.family === "Gemma 4").key;
    const state = { ...mc.initState(), vendors: ["google"], variants: [id], view: "detail", id: "gemma-4-31b" };
    expect(mc.route.parse(mc.route.serialize(state))).toMatchObject({ vendors: ["google"], variants: [id], id: "gemma-4-31b" });
    expect(mc.route.parse("#/timeline?variants=unknown").variants).toEqual([]);
    expect(mc.route.parse("#/timeline").variants).toEqual([]);
  });

  it("focuses a vendor from either entry point without resetting window, tier or capability filters", () => {
    const { view, render, changes, mc } = load();
    const state = { window: "all", tiers: ["small"], caps: ["open"] };
    view(state).vendorFocus.change({ target: { value: "google" } });
    expect(changes.at(-1)).toEqual({ vendors: ["google"], hover: null });
    const focused = render({ ...state, ...changes.at(-1) });
    expect(focused.vendorFocus.value).toBe("google");
    expect(focused.statsModels.every(m => m.vendor === "google" && m.tier === "small" && m.open_weights)).toBe(true);
    expect(focused.tl.rows.every(r => !r.canFocusVendor)).toBe(true);
    view().tl.rows.find(r => r.vendorLabel === "OpenAI").focusVendor();
    expect(changes.at(-1)).toEqual({ vendors: ["openai"], hover: null });
    view(changes.at(-1)).vendorFocus.reset();
    expect(changes.at(-1).vendors).toEqual(mc.VENDORS);
  });

  it("keeps the dropdown in sync with multi-select chips and provides recovery from an empty selection", () => {
    const { view, changes } = load();
    expect(view().vendorFocus.value).toBe("all");
    expect(view({ vendors: ["google", "openai"] }).vendorFocus).toMatchObject({ value: "custom", custom: true, customLabel: "已选 2 家（多选）" });
    expect(view({ vendors: [] }).vendorFocus).toMatchObject({ value: "custom", customLabel: "未选择厂商", canReset: true });
    view({ vendors: ["google"] }).vendorChips.find(c => c.label === "OpenAI").toggle();
    expect(view(changes.at(-1)).vendorFocus.custom).toBe(true);
    const count = changes.length;
    view().vendorFocus.change({ target: { value: "invalid" } });
    expect(changes).toHaveLength(count);
  });
});
