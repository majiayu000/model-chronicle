// Hash routes keep the static GitHub Pages site shareable without a server router.
(function init() {
  if (!window.MC || !window.MC.models) return setTimeout(init, 20);
  const MC = window.MC;
  const VIEWS = new Set([
    "timeline",
    "trends",
    "arch",
    "catchup",
    "cost",
    "life",
    "compare",
    "detail",
  ]);
  const keep = (value, allowed) =>
    value.split(",").filter((item) => allowed.includes(item));

  function parse(hash) {
    const url = new URL(
      (hash || "#/timeline").slice(1),
      "https://model-chronicle.invalid",
    );
    const parts = url.pathname.split("/").filter(Boolean);
    const view = VIEWS.has(parts[0]) ? parts[0] : "timeline";
    const id = view === "detail" && MC.byId[parts[1]] ? parts[1] : null;
    const state = { view: view === "detail" && !id ? "timeline" : view, id };
    const q = url.searchParams;
    state.window = q.get("window") === "all" ? "all" : "recent";
    state.autoScale = true;
    const requestedHistory = (q.get("history") || "").split(",");
    state.variants =
      MC.timeline?.normalizeVersionIds((q.get("variants") || "").split(",")) ||
      [];
    state.history = MC.timeline
      ? MC.timeline.normalizeHistoryIds(requestedHistory)
      : [];
    state.archives = [...new Set(keep(q.get("archives") || "", MC.VENDORS))];
    if (q.has("vendors")) state.vendors = keep(q.get("vendors"), MC.VENDORS);
    if (q.has("tiers")) state.tiers = keep(q.get("tiers"), MC.TIERS);
    if (q.has("caps")) state.caps = keep(q.get("caps"), Object.keys(MC.CAPS));
    if (q.has("cmp"))
      state.cmp = [
        ...new Set(
          keep(
            q.get("cmp"),
            MC.models.map((m) => m.id),
          ),
        ),
      ].slice(0, 4);
    if (q.has("bench") && MC.BENCH.includes(q.get("bench")))
      state.bench = q.get("bench");
    state.diffOnly = q.get("diff") === "1";
    if (q.has("threshold")) {
      const value = Number(q.get("threshold"));
      if (
        MC.BENCH.includes(state.bench) &&
        Number.isFinite(value) &&
        value >= 20 &&
        value <= 95
      )
        state.thr = { [state.bench]: value };
    }
    if (q.has("groups")) {
      try {
        const groups = JSON.parse(q.get("groups"));
        if (groups && typeof groups === "object" && !Array.isArray(groups)) {
          state.groups = Object.fromEntries(
            Object.entries(groups).filter(
              ([bench, name]) =>
                MC.BENCH.includes(bench) &&
                typeof name === "string" &&
                name.length < 200,
            ),
          );
        }
      } catch {
        /* Ignore malformed shared state. */
      }
    }
    if (
      q.has("life") &&
      ["all", "unknown", "deprecated", "retired"].includes(q.get("life"))
    )
      state.lifeMode = q.get("life");
    if (q.has("px")) {
      const px = Number(q.get("px"));
      if (Number.isFinite(px) && px >= 220 && px <= 1400) {
        state.px = px;
        state.autoScale = false;
      }
    }
    return state;
  }

  function serialize(s) {
    const view = VIEWS.has(s.view) ? s.view : "timeline";
    const path =
      view === "detail" && MC.byId[s.id] ? `/detail/${s.id}` : `/${view}`;
    const q = new URLSearchParams();
    if (s.window === "all") q.set("window", "all");
    if (s.variants?.length) q.set("variants", s.variants.join(","));
    if (s.history?.length) q.set("history", s.history.join(","));
    if (s.archives?.length) q.set("archives", s.archives.join(","));
    if (s.vendors && s.vendors.length !== MC.VENDORS.length)
      q.set("vendors", s.vendors.join(","));
    if (s.tiers && s.tiers.length !== MC.TIERS.length)
      q.set("tiers", s.tiers.join(","));
    if (s.caps?.length) q.set("caps", s.caps.join(","));
    if (s.cmp !== null && s.cmp !== undefined) q.set("cmp", s.cmp.join(","));
    if (s.bench) q.set("bench", s.bench);
    if (s.diffOnly) q.set("diff", "1");
    if (s.thr?.[s.bench] !== undefined)
      q.set("threshold", String(s.thr[s.bench]));
    if (s.groups && Object.keys(s.groups).length)
      q.set("groups", JSON.stringify(s.groups));
    if (s.lifeMode && s.lifeMode !== "all") q.set("life", s.lifeMode);
    if (s.px && (s.autoScale === false || s.px !== 840))
      q.set("px", String(s.px));
    return `#${path}${q.size ? `?${q}` : ""}`;
  }

  MC.route = { parse, serialize };
})();
