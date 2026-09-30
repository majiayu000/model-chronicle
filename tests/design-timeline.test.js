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
  const focused = [];
  const context = createContext({ window, URL, URLSearchParams, document: { querySelector: selector => ({ focus(options) { focused.push({ selector, options }); } }) },
    React: { Component: class {}, createElement(tag, props, ...children) { return { tag, props, children }; } },
    DCLogic: class { setState(p, callback) { this.state = { ...this.state, ...p }; callback?.(); } } });
  for (const name of ["chronicle.js", "chronicle-timeline.js", "chronicle-visibility.js", "chronicle-route.js", "chronicle-vm.js", "chronicle-ext.js", "chronicle-ext2.js"]) {
    runInContext(readFileSync(new URL(`../public/graph-v2/${name}`, import.meta.url), "utf8"), context);
    window.MC.today = "2026-09-30";
  }
  runInContext(readFileSync(new URL("../src/design/application.js", import.meta.url), "utf8") + "\nwindow.App = Component;", context);
  const mc = window.MC, changes = [];
  const view = (state = {}) => mc.vm({ ...mc.initState(), ...state }, p => changes.push(p));
  function app(state = {}) {
    const result = new window.App(); result.props = {};
    result.state = { ...mc.initState(), ready: true, ...state };
    return result;
  }
  return { mc, window, view, app, render: state => app(state).renderVals(), changes, storage, focused };
}
const liveIds = v => v.tl.rows.filter(r => r.isLine).flatMap(r => r.versions.flatMap(v => v.models.map(m => m.id)));

describe("series and version timeline", () => {
  it("uses one GPT series with ordered version nodes and places Pro/mini/nano inside their version", () => {
    const { view } = load();
    const rows = view({ vendors: ["openai"] }).tl.rows.filter(r => r.isLine);
    expect(rows.map(r => r.family)).toEqual(["GPT"]);
    const gpt = rows[0];
    expect(gpt.versions.map(v => v.label)).toEqual(["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6", "6.1"]);
    expect(gpt.versions.find(v => v.label === "5.4").models.map(m => m.id).sort()).toEqual(["gpt-5-4", "gpt-5-4-mini", "gpt-5-4-nano", "gpt-5-4-pro"]);
    expect(gpt.versions.find(v => v.label === "6").models).toHaveLength(3);
    expect(gpt.n).toBe(18);
    expect(gpt.links.length).toBeGreaterThan(0);
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
  it("keeps every marker on one baseline and only alternates close labels", () => {
    const { view, window } = load(); window.innerWidth = 390;
    const versions = view({ vendors: ["openai"] }).tl.rows.find(r => r.family === "GPT").versions;
    expect(new Set(versions.map(v => v.top)).size).toBe(1);
    for (const a of versions) for (const b of versions) if (a !== b && a.labelLane === b.labelLane) {
      const leftA = a.px + a.hideLeft, rightA = a.px + a.labelLeft + a.labelWidth;
      const leftB = b.px + b.hideLeft, rightB = b.px + b.labelLeft + b.labelWidth;
      expect(rightA + 8 <= leftB || rightB + 8 <= leftA).toBe(true);
    }
    expect(versions.find(v => v.label === "5.3").px).toBeLessThan(versions.find(v => v.label === "5.4").px);
    const a = versions.find(v => v.label === "5.3"), b = versions.find(v => v.label === "5.4");
    expect(a.px + a.hitLeft + a.hitWidth).toBeLessThanOrEqual(b.px + b.hitLeft);
    for (const v of versions) expect(v.hitLeft + v.glyphLeft + 7).toBe(0);
  });
});

describe("recorded successor connections", () => {
  it("keeps the entire Opus chain horizontal without staggering 4.8", () => {
    const { render } = load();
    const row = render({ vendors: ["anthropic"] }).tl.rows.find(r => r.family === "Opus");
    expect(row.versions.map(v => v.top)).toEqual(Array(6).fill(48));
    const paths = row.linksEl.children.filter(c => c.tag === "g").map(g => g.children.find(c => c?.props?.className === "series-link").props.d);
    expect(paths).toHaveLength(5);
    expect(paths.every(d => /^M[\d.]+,48 H[\d.]+$/.test(d))).toBe(true);
  });
  it("restores the real GPT paths, including branches that skip a version", () => {
    const { view, mc } = load();
    const row = view({ vendors: ["openai"] }).tl.rows[0];
    const pairs = row.links.flatMap(link => link.pairs);
    expect(pairs.map(pair => [pair.from, pair.to])).toEqual(expect.arrayContaining([
      ["gpt-5-1", "gpt-5-2"], ["gpt-5-2", "gpt-5-4"],
      ["gpt-5-3-instant", "gpt-5-5-instant"], ["gpt-5-4-mini", "gpt-5-6-luna"],
      ["gpt-5-6-sol", "gpt-6-astra"],
      ["gpt-6-sol", "gpt-6-1-sol"],
    ]));
    for (const pair of pairs) expect(mc.byId[pair.to].predecessor).toBe(pair.from);
    const first = row.links.find(link => link.source.label === "5.1" && link.target.label === "5.2");
    expect(first.gap).toBe("29 天");
    const last = row.links.find(link => link.source.label === "5.6" && link.target.label === "6");
    expect(last.pairs).toHaveLength(3);
    expect(last.title).toContain("GPT-5.6 Sol → GPT-6 Astra");
    expect(last.gap).toBeNull();
  });

  it("does not bridge hidden, filtered or out-of-window intermediate models", () => {
    const records = [model("first", "2025-10-01"),
      model("middle", "2026-01-01", { predecessor: "first", specs: { ...base.specs, modalities_in: ["text"] } }),
      model("last", "2026-05-01", { predecessor: "middle" })];
    const { view } = load(records);
    expect(view().tl.rows[0].links).toHaveLength(2);
    expect(view({ hiddenModels: ["middle"] }).tl.rows[0].links).toEqual([]);
    expect(view({ caps: ["vision"] }).tl.rows[0].links).toEqual([]);
    const { view: recent } = load([model("old", "2024-01-01"), model("new", "2026-01-01", { predecessor: "old" })]);
    expect(recent().tl.rows[0].links).toEqual([]);
    expect(recent({ window: "all" }).tl.rows[0].links).toHaveLength(1);
  });

  it("retains only supported model pairs when some specifications of a version are hidden", () => {
    const { view } = load();
    const row = view({ vendors: ["openai"], hiddenModels: ["gpt-6-astra"] }).tl.rows[0];
    const last = row.links.find(link => link.target.label === "6");
    expect(last.pairs).toHaveLength(2);
    expect(last.pairs.some(pair => pair.to === "gpt-6-astra")).toBe(false);
    expect(view({ vendors: ["google"] }).tl.rows.find(r => r.family === "Gemma").links).toEqual([]);
  });

  it("renders horizontal successor lines and uses arcs only for real skip-version branches", () => {
    const { render } = load();
    const row = render({ vendors: ["openai"] }).tl.rows[0];
    expect(row.linksEl.tag).toBe("svg");
    const groups = row.linksEl.children.filter(child => child.tag === "g");
    expect(groups).toHaveLength(row.links.length);
    expect(row.links.every(link => link.source.top === link.target.top)).toBe(true);
    for (const group of groups) {
      const path = group.children.find(child => child?.props?.className === "series-link");
      expect(path.props.d).toMatch(/^M[\d., -]+ [HQ][\d., -]+$/);
      expect(path.props.d).not.toMatch(/NaN|undefined|\{\{/);
      const hit = group.children.find(child => child.props?.className === "series-link-hit");
      expect(hit.props["aria-label"]).toContain("→");
      expect(hit.props.onMouseMove).toBeTypeOf("function");
      expect(group.children.some(child => child?.tag === "title")).toBe(false);
    }
  });
});

describe("original model glyphs", () => {
  it("restores Dense circles, MoE diamonds, unknown outlines and reasoning rings from recorded fields", () => {
    const { view } = load([
      model("dense", "2026-01-01", { arch: { type: "dense", source: base.sources[0] } }),
      model("moe", "2026-02-01", { arch: { type: "moe", source: base.sources[0] }, reasoning: true }),
      model("unknown", "2026-03-01", { arch: null, reasoning: true }),
      model("preview", "2026-04-01", { dates: { announced: "2026-04-01", ga: null, deprecated: null, retired: null } }),
    ]);
    const versions = view().tl.rows[0].versions;
    expect(versions[0]).toMatchObject({ dense: true, moe: false, unknown: false });
    expect(versions[1]).toMatchObject({ dense: false, moe: true, reasoning: true });
    expect(versions[2]).toMatchObject({ unknown: true, reasoning: true });
    expect(versions[1].ring).not.toBe("none");
    expect(versions[3].announcedOnly).toBe(true);
  });
  it("opens single models directly and reserves expansion for actual multiple-model versions", () => {
    const { view, changes } = load();
    const opus = view({ vendors: ["anthropic"] }).tl.rows.find(r => r.family === "Opus").versions.find(v => v.label === "4.8");
    expect(opus.multiple).toBe(false);
    opus.toggle({ preventDefault() {} });
    expect(changes.at(-1)).toMatchObject({ view: "detail", id: "claude-opus-4-8" });
    expect(view({ vendors: ["anthropic"], variants: [opus.key] }).tl.rows.find(r => r.family === "Opus").versions.find(v => v.key === opus.key).expanded).toBe(false);
    const gpt = view({ vendors: ["openai"] }).tl.rows[0].versions.find(v => v.label === "6");
    expect(gpt.multiple).toBe(true); gpt.toggle();
    expect(changes.at(-1)).toMatchObject({ variants: [gpt.key] });
  });
  it("expands version members as connected tree nodes inside the axis and collapses their space", () => {
    const { view, render } = load();
    const before = view({ vendors: ["openai"] }).tl.rows[0];
    const version = before.versions.find(v => v.label === "6");
    const state = { vendors: ["openai"], variants: [version.key] };
    const row = render(state).tl.rows[0];
    const expanded = row.versions.find(v => v.key === version.key);
    expect(expanded.models.map(m => m.id).sort()).toEqual(["gpt-6-astra", "gpt-6-luna", "gpt-6-sol"]);
    expect(row.height).toBeGreaterThan(before.height);
    expect(expanded.px).toBe(version.px);
    expect(new Set(expanded.models.map(m => m.treeTop)).size).toBe(3);
    expect(expanded.models.every(m => m.treeTop + 44 <= row.height)).toBe(true);
    expect(row.linksEl.children.flatMap(c => c.children || []).filter(c => c?.props?.className === "model-branch").map(c => c.props.d)).toEqual(expanded.models.map(m => m.branchPath));
    const hidden = render({ ...state, hiddenModels: ["gpt-6-astra"] }).tl.rows[0];
    expect(hidden.versions.find(v => v.key === version.key).models.map(m => m.id)).not.toContain("gpt-6-astra");
    expect(hidden.height).toBeLessThan(row.height);
    expect(view({ ...state, variants: [] }).tl.rows[0].height).toBe(before.height);
  });
  it("does not present a mixed-architecture version as a verified MoE or Dense model", () => {
    const { view } = load([
      model("one", "2026-01-01", { generation: "1", arch: { type: "dense", source: base.sources[0] } }),
      model("two", "2026-01-01", { generation: "1", arch: { type: "moe", source: base.sources[0] } }),
    ]);
    expect(view().tl.rows[0].versions[0]).toMatchObject({ multiple: true, unknown: true, moe: false, dense: false });
  });
});

describe("window, archive and vendor controls", () => {
  it("uses inclusive calendar-year boundaries and clamps leap day", () => {
    const { mc } = load([]), range = mc.timeline.windowRange("recent", "2026-09-28");
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
    expect(after.heroTotal).toBe(17); expect(after.visibility).toMatchObject({ count: 1, eligible: 18, inScope: 1 });
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

 describe("hidden model recovery panel", () => {
  it("can reopen persisted hidden models, restore one and return focus without scrolling", () => {
    const { app, storage, mc, focused } = load();
    mc.visibility.save(storage, ["claude-opus-4-8"]);
    const instance = app(); instance.componentDidMount();
    instance.renderVals().visibility.toggleManager();
    expect(instance.state.hiddenManager).toBe(true);
    expect(focused.at(-1)).toEqual({ selector: "[data-hidden-close]", options: { preventScroll: true } });
    const row = instance.renderVals().visibility.rows.find(r => r.name === "Claude Opus 4.8");
    row.restore();
    expect(liveIds(instance.renderVals())).toContain("claude-opus-4-8");
    expect(mc.visibility.load(storage).ids).toEqual([]);
    instance._key({ key: "Escape" });
    expect(instance.state.hiddenManager).toBe(false);
    expect(focused.at(-1).options.preventScroll).toBe(true);
  });
});

describe("timeline hover previews", () => {
  it("immediately previews successor dates and days, following the timeline cursor after scrolling", () => {
    const { view, changes, window } = load([
      model("first", "2026-01-01"),
      model("second", "2026-01-11", { predecessor: "first" }),
    ]);
    window.innerWidth = 1440;
    const vm = view(), link = vm.tl.rows[0].links[0];
    const svgLeft = -100;
    const currentTarget = {
      getBoundingClientRect: () => ({ left: svgLeft + link.source.px, top: 200, width: link.target.px - link.source.px, height: 0 }),
      ownerSVGElement: { getBoundingClientRect: () => ({ left: svgLeft, width: vm.tl.width }) },
    };
    link.enter({ currentTarget, clientX: svgLeft + (link.source.px + link.target.px) / 2, clientY: 200 });
    expect(view(changes.at(-1)).hover).toMatchObject({ line: true, date: "2026-01-06", pairs: [{ fromName: "first", toName: "second", interval: "相隔 10 天" }] });
    link.enter({ currentTarget, clientX: svgLeft + link.target.px, clientY: 200 });
    expect(view(changes.at(-1)).hover.date).toBe("2026-01-11");
    link.enter({ currentTarget });
    expect(view(changes.at(-1)).hover.date).toBe("2026-01-06");
    link.leave();
    expect(view(changes.at(-1)).hover).toBeNull();
  });
  it("labels announcement dates without inventing a release interval", () => {
    const { view, changes } = load([
      model("first", "2026-01-01"),
      model("second", "2026-01-11", { predecessor: "first", dates: { announced: "2026-01-11", ga: null } }),
    ]);
    const vm = view(), link = vm.tl.rows[0].links[0];
    link.enter({ currentTarget: {
      getBoundingClientRect: () => ({ left: link.source.px, top: 200, width: link.target.px - link.source.px, height: 0 }),
      ownerSVGElement: { getBoundingClientRect: () => ({ left: 0, width: vm.tl.width }) },
    } });
    expect(view(changes.at(-1)).hover.pairs[0]).toMatchObject({ toDate: "2026-01-11 · 仅有宣布日期", interval: "日期口径不同，未计算间隔" });
  });
  const target = (left = 200, top = 200) => ({ currentTarget: {
    getBoundingClientRect: () => ({ left, top, bottom: top + 24 }),
  } });
  it("previews a single model with recorded specs and benchmarks, then clears on leave", () => {
    const { view, changes, mc } = load();
    const version = view().tl.rows.find(r => r.family === "Haiku").versions[0];
    version.enter(target());
    const preview = view(changes.at(-1)).hover;
    expect(preview.m.id).toBe("claude-haiku-4-5");
    expect(preview.m.ctxLabel).toBe(mc.byId[preview.m.id].ctxLabel);
    expect(preview.bench).toEqual(mc.byId[preview.m.id].benchmarks.slice(0, 3));
    expect(preview.group).toBe(false);
    version.leave();
    expect(view(changes.at(-1)).hover).toBeNull();
  });
  it("previews only visible version members and gives each expanded model its own details", () => {
    const { view, changes } = load();
    const state = { vendors: ["openai"], hiddenModels: ["gpt-5-4-pro"] };
    const version = view(state).tl.rows[0].versions.find(v => v.label === "5.4");
    version.enter(target());
    const preview = view({ ...state, ...changes.at(-1) }).hover;
    expect(preview.group).toBe(true);
    expect(preview.m).toBeNull();
    expect(preview.models.map(m => m.id).sort()).toEqual(["gpt-5-4", "gpt-5-4-mini", "gpt-5-4-nano"]);
    const mini = version.models.find(m => m.id === "gpt-5-4-mini");
    mini.enter(target());
    expect(view({ ...state, ...changes.at(-1) }).hover.m.id).toBe(mini.id);
    mini.open();
    expect(changes.at(-1)).toEqual({ view: "detail", id: mini.id, hover: null });
  });
  it("keeps the card inside the viewport at the right and bottom edges", () => {
    const { view, changes, window } = load();
    window.innerWidth = 390; window.innerHeight = 700;
    const version = view().tl.rows.find(r => r.family === "Haiku").versions[0];
    version.enter(target(370, 650));
    expect(view(changes.at(-1)).hover).toMatchObject({ x: 62, y: 62, position: "bottom" });
    version.enter(target(-20, 50));
    expect(view(changes.at(-1)).hover).toMatchObject({ x: 8, y: 86, position: "top" });
  });
  it("dismisses previews on scrolling, Escape and filter changes", () => {
    const { app } = load();
    const instance = app(); instance.componentDidMount();
    const enter = () => instance.renderVals().tl.rows.find(r => r.family === "Haiku").versions[0].enter(target());
    enter(); expect(instance.state.hover).not.toBeNull();
    instance._scroll(); expect(instance.state.hover).toBeNull();
    enter(); instance._key({ key: "Escape" }); expect(instance.state.hover).toBeNull();
    enter(); instance.renderVals().vendorChips[0].toggle(); expect(instance.state.hover).toBeNull();
  });
});
