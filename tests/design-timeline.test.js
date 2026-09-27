import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

const catalog = JSON.parse(readFileSync(new URL("../src/generated/models.json", import.meta.url), "utf8"));
const base = catalog.find(m => m.id === "gpt-4o");
function model(id, date, overrides = {}) {
  return { ...structuredClone(base), id, name: id, generation: id, predecessor: null,
    dates: { announced: date, ga: date, deprecated: null, retired: null }, ...overrides };
}
function load(records = catalog, initialStorage) {
  const saved = new Map();
  const storage = initialStorage || { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  const window = { __CHRONICLE_MODELS__: records, scrollTo() {}, localStorage: storage,
    location: { hash: "#/timeline" }, addEventListener() {}, removeEventListener() {} };
  window.history = { pushState: (_a, _b, hash) => window.location.hash = hash, replaceState: (_a, _b, hash) => window.location.hash = hash };
  const context = createContext({ window, URL, URLSearchParams, document: { querySelector: () => ({ focus() {} }) },
    React: { Component: class {}, createElement(tag, props, ...children) { return { tag, props, children }; } },
    DCLogic: class { setState(p, callback) { this.state = { ...this.state, ...p }; callback?.(); } } });
  for (const name of ["chronicle.js", "chronicle-timeline.js", "chronicle-visibility.js", "chronicle-route.js", "chronicle-vm.js", "chronicle-ext.js", "chronicle-ext2.js"]) {
    runInContext(readFileSync(new URL(`../public/graph-v2/${name}`, import.meta.url), "utf8"), context);
    window.MC.today = "2026-09-28";
  }
  runInContext(readFileSync(new URL("../src/design/application.js", import.meta.url), "utf8") + "\nwindow.App = Component;", context);
  const mc = window.MC, changes = [];
  const view = (state = {}) => mc.vm({ ...mc.initState(), ...state }, p => changes.push(p));
  function app(state = {}) {
    const result = new window.App(); result.props = {};
    result.state = { ...mc.initState(), ready: true, ...state };
    return result;
  }
  return { mc, window, view, app, render: state => app(state).renderVals(), changes, storage };
}
const liveIds = v => v.tl.rows.filter(r => r.isLine).flatMap(r => r.versions.flatMap(v => v.models.map(m => m.id)));

describe("series and version timeline", () => {
  it("uses one GPT series with ordered version nodes and places Pro/mini/nano inside their version", () => {
    const { view } = load();
    const rows = view({ vendors: ["openai"] }).tl.rows.filter(r => r.isLine);
    expect(rows.map(r => r.family)).toEqual(["GPT"]);
    const gpt = rows[0];
    expect(gpt.versions.map(v => v.label)).toEqual(["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6"]);
    expect(gpt.versions.find(v => v.label === "5.4").models.map(m => m.id).sort()).toEqual(["gpt-5-4", "gpt-5-4-mini", "gpt-5-4-nano", "gpt-5-4-pro"]);
    expect(gpt.versions.find(v => v.label === "6").models).toHaveLength(3);
    expect(gpt.n).toBe(17);
    expect(gpt).not.toHaveProperty("segs");
    expect(gpt).not.toHaveProperty("pending");
  });
  it("keeps GPT, o and gpt-oss separate and includes every catalog record exactly once", () => {
    const { mc, view } = load();
    expect(mc.timeline.catalog.filter(r => r.vendor === "openai").map(r => r.family).sort()).toEqual(["GPT", "gpt-oss", "o 系列"].sort());
    const original = catalog.map(m => m.id).sort();
    expect(mc.timeline.catalog.flatMap(r => r.versions.flatMap(v => v.models.map(m => m.id))).sort()).toEqual(original);
    expect(liveIds(view({ window: "all" })).sort()).toEqual(original);
    const recent = view();
    const ids = recent.tl.rows.flatMap(r => r.isLine ? [...r.versions.flatMap(v => v.models.map(m => m.id)), ...r.history.map(m => m.id)] : r.archivedRows.flatMap(a => a.models.map(m => m.id)));
    expect(ids.sort()).toEqual(original);
  });
  it("preserves distinct GPT-4, GPT-4 Turbo and GPT-4o versions and groups mini variants correctly", () => {
    const gpt = load().mc.timeline.catalog.find(r => r.family === "GPT");
    expect(gpt.versions.map(v => v.version)).toEqual(expect.arrayContaining(["4", "4 Turbo", "4o", "4.1"]));
    expect(gpt.versions.find(v => v.version === "4.1").models).toHaveLength(3);
    expect(gpt.versions.find(v => v.version === "4o").models).toHaveLength(2);
  });
  it("keeps sequential same-version revisions in separate nodes without inferring new edges", () => {
    const { mc } = load([model("original", "2025-01-01", { generation: "4" }), model("revision", "2026-01-01", { generation: "4", predecessor: "original" })]);
    const versions = mc.timeline.catalog[0].versions;
    expect(versions).toHaveLength(2);
    expect(new Set(versions.map(v => v.id)).size).toBe(2);
    expect(versions.map(v => v.models.map(m => m.id))).toEqual([["original"], ["revision"]]);
    expect(mc.byId.revision.predecessor).toBe("original");
  });
  it("places all five Gemma 4 models in one node within the Gemma series", () => {
    const { view } = load();
    const row = view({ vendors: ["google"] }).tl.rows.find(r => r.family === "Gemma");
    const v = row.versions.find(v => v.label === "4");
    expect(v.models).toHaveLength(5);
    expect(v.dateRange).toBe("2026-04-02 — 2026-06-03");
    expect(view({ vendors: ["google"], tiers: ["small"] }).tl.rows.find(r => r.family === "Gemma").versions[0].models).toHaveLength(3);
  });
  it("separates near-simultaneous version controls without shifting their time coordinates", () => {
    const { view, window } = load(); window.innerWidth = 390;
    const versions = view({ vendors: ["openai"] }).tl.rows.find(r => r.family === "GPT").versions;
    for (const a of versions) for (const b of versions) if (a !== b && a.top === b.top) expect(a.px + a.width + 12 <= b.px || b.px + b.width + 12 <= a.px).toBe(true);
    expect(versions.find(v => v.label === "5.3").px).toBeLessThan(versions.find(v => v.label === "5.4").px);
  });
});

describe("window, archive and vendor controls", () => {
  it("uses inclusive calendar-year boundaries and clamps leap day", () => {
    const { mc } = load([]), range = mc.timeline.windowRange();
    expect(range.startDate).toBe("2025-09-28");
    for (const [date, included] of [["2025-09-27", false], ["2025-09-28", true], ["2026-09-28", true], ["2026-09-29", false], ["2025-09", true], ["2025-08", false]]) expect(mc.timeline.inWindow({ date }, range), date).toBe(included);
    expect(mc.timeline.windowRange("recent", "2024-02-29").startDate).toBe("2023-02-28");
  });
  it("expands earlier history without moving current nodes or changing counts", () => {
    const { view, changes } = load([model("old", "2024-01-01"), model("new", "2026-01-01", { predecessor: "old" })]);
    const row = view().tl.rows[0];
    expect(row.history.map(m => m.id)).toEqual(["old"]);
    row.toggleHistory();
    const after = view(changes.at(-1));
    expect(after.tl.rows[0].historyOpen).toBe(true);
    expect(after.shown).toBe(1);
    expect(after.tl.rows[0].versions[0].px).toBe(row.versions[0].px);
  });
  it("retains archives for old-only vendors and handles completely empty filters", () => {
    const { view, changes } = load([model("old", "2024-01-01")]);
    const v = view(); expect(v.empty).toBe(true); expect(v.tl.rowCount).toBe(0);
    v.tl.rows[0].toggleArchive();
    expect(view(changes.at(-1)).tl.rows[0].archiveOpen).toBe(true);
    expect(view({ vendors: [] }).tl.rows).toEqual([]);
  });
  it("keeps month-only records on the visible axis and adapts default zoom", () => {
    const { view, window, changes, mc } = load([model("month", "2025-09")]);
    window.innerWidth = 390;
    expect(view().tl.rows[0].versions[0].px).toBeGreaterThanOrEqual(0);
    expect(view().tl.pxPerYear).toBe(220);
    view().tl.onZoom({ target: { value: "840" } });
    expect(view(mc.route.parse(mc.route.serialize({ ...mc.initState(), ...changes.at(-1) }))).tl.pxPerYear).toBe(840);
  });
  it("keeps cards, coverage and heatmap synchronized with visible filtered models", () => {
    const { render } = load();
    const v = render({ vendors: ["anthropic"] });
    expect(v).toMatchObject({ heroTotal: 12, coverageTotal: 12, vendorCount: 1, shown: 12 });
    expect(v.heat.flatMap(r => r.cells).reduce((n, cell) => n + Number(cell.tip.match(/ · (\d+)$/)?.[1] || 0), 0)).toBe(12);
    expect(render({ vendors: [] })).toMatchObject({ heroTotal: 0, coverageTotal: 0 });
  });
  it("supports single-vendor focus, existing multiselect and restoring all vendors", () => {
    const { view, changes, mc, render } = load();
    view().vendorFocus.change({ target: { value: "google" } });
    expect(changes.at(-1)).toEqual({ vendors: ["google"], hover: null });
    const focused = view(changes.at(-1)); expect(focused.vendorFocus.value).toBe("google");
    focused.vendorChips.find(c => c.label === "OpenAI").toggle();
    expect(view(changes.at(-1)).vendorFocus.custom).toBe(true);
    view({ vendors: [] }).vendorFocus.reset(); expect(changes.at(-1).vendors).toEqual(mc.VENDORS);
    view().tl.rows.find(r => r.vendorLabel === "OpenAI").focusVendor(); expect(changes.at(-1).vendors).toEqual(["openai"]);
    const select = render({ vendors: ["google"] }).vendorSelect;
    expect(select.children.find(c => c?.props.value === "google").children).toEqual(["Google (14)"]);
  });
});

describe("personal model visibility", () => {
  it("hides an individual model, preserves version position and supports undo", () => {
    const { view, changes, app } = load();
    const before = view({ vendors: ["openai"] }), version = before.tl.rows[0].versions.find(v => v.label === "6");
    version.models.find(m => m.id === "gpt-6-astra").hide();
    const state = changes.at(-1), instance = app({ vendors: ["openai"], ...state }), after = instance.renderVals();
    expect(state.hiddenModels).toEqual(["gpt-6-astra"]);
    expect(after.heroTotal).toBe(16); expect(after.visibility).toMatchObject({ count: 1, eligible: 17, inScope: 1 });
    expect(after.tl.rows[0].versions.find(v => v.label === "6")).toMatchObject({ px: version.px, n: 2, eligible: 3 });
    after.visibility.undo(); expect(instance.state.hiddenModels).toEqual([]);
  });
  it("hides whole versions and undo restores only newly hidden IDs", () => {
    const { view, changes } = load();
    const state = { vendors: ["openai"], hiddenModels: ["gpt-6-luna"] };
    view(state).tl.rows[0].versions.find(v => v.label === "6").hide();
    const patch = changes.at(-1);
    expect(patch.hiddenModels).toEqual(["gpt-6-astra", "gpt-6-luna", "gpt-6-sol"]);
    expect(view({ ...state, ...patch }).tl.rows[0].versions.some(v => v.label === "6")).toBe(false);
    view({ ...state, ...patch }).visibility.undo(); expect(changes.at(-1).hiddenModels).toEqual(["gpt-6-luna"]);
  });
  it("hides an entire series including older filtered models and recovers from all-hidden state", () => {
    const { view, changes, mc } = load();
    view({ vendors: ["openai"] }).tl.rows[0].hide();
    const patch = changes.at(-1), ids = mc.timeline.catalog.find(r => r.family === "GPT").models.map(m => m.id).sort();
    expect(patch.hiddenModels).toEqual(ids);
    expect(view({ vendors: ["openai"], ...patch }).shown).toBe(0);
    const allHidden = { hiddenModels: catalog.map(m => m.id) };
    expect(view(allHidden).tl.rows).toEqual([]);
    view(allHidden).visibility.restoreAll(); expect(changes.at(-1).hiddenModels).toEqual([]);
  });
  it("leaves other views, direct detail, model IDs and predecessor data untouched", () => {
    const { view, render, mc } = load(); const hiddenModels = catalog.map(m => m.id);
    expect(view({ view: "trends", hiddenModels }).shown).toBe(catalog.length);
    expect(render({ view: "detail", id: "gpt-6-astra", hiddenModels }).d.m.id).toBe("gpt-6-astra");
    expect(mc.models.map(m => [m.id, m.predecessor]).sort()).toEqual(catalog.map(m => [m.id, m.predecessor]).sort());
  });
  it("persists the preference, survives route changes and never includes hidden IDs in shared links", () => {
    const { app, storage, mc } = load();
    const first = app(); first.componentDidMount();
    first.update({ hiddenModels: ["gpt-6-luna"], hideUndo: ["gpt-6-luna"], hideNotice: "hidden" });
    expect(mc.visibility.load(storage).ids).toEqual(["gpt-6-luna"]);
    expect(mc.route.serialize(first.state)).not.toContain("gpt-6-luna");
    first._route(); expect(first.state.hiddenModels).toEqual(["gpt-6-luna"]);
    const refreshed = app(); refreshed.componentDidMount();
    expect(refreshed.state.hiddenModels).toEqual(["gpt-6-luna"]);
  });
  it("rejects stale/malformed IDs and handles denied or corrupted storage without losing session controls", () => {
    const { mc } = load();
    expect(mc.visibility.normalize(["gpt-6-luna", "missing", "__proto__", 1, null, "gpt-6-luna"])).toEqual(["gpt-6-luna"]);
    expect(mc.visibility.load({ getItem: () => "bad json" })).toEqual({ ids: [], persistent: false });
    expect(mc.visibility.load({ getItem: () => '{"version":1,"ids":["gpt-6-luna","unknown"]}' }).ids).toEqual(["gpt-6-luna"]);
    const broken = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
    const { app } = load(catalog, broken); const instance = app(); instance.componentDidMount();
    instance.update({ hiddenModels: ["gpt-6-luna"] });
    expect(instance.state).toMatchObject({ hiddenModels: ["gpt-6-luna"], hiddenPersistent: false });
  });
});

describe("shared display state", () => {
  it("round-trips versions, history and vendors while ignoring unknown entries", () => {
    const { mc } = load(), version = mc.timeline.catalog.find(r => r.family === "GPT").versions.find(v => v.label === "6");
    const state = { ...mc.initState(), vendors: ["openai"], variants: [version.id], history: ["series-openai-gpt"], view: "detail", id: "gpt-6-astra" };
    expect(mc.route.parse(mc.route.serialize(state))).toMatchObject({ variants: [version.id], history: ["series-openai-gpt"], vendors: ["openai"], id: "gpt-6-astra" });
    expect(mc.route.parse("#/timeline?variants=missing&history=missing")).toMatchObject({ variants: [], history: [] });
  });
  it("migrates existing version-group and lineage-root links", () => {
    const { mc } = load();
    const result = mc.route.parse("#/timeline?variants=variants-google%252Fgemma%252F4&history=claude-3-opus");
    expect(result.variants).toEqual(["version-google%2Fgemma%2F4"]);
    expect(result.history).toEqual(["series-anthropic-opus"]);
  });
});
