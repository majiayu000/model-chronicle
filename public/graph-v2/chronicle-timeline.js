// Display hierarchy only. Source dates, IDs and predecessor edges remain unchanged.
(function () {
  const MC = window.MC;
  const titles = {
    gpt: "GPT",
    "o-series": "o 系列",
    "gpt-oss": "gpt-oss",
    gemini: "Gemini",
    gemma: "Gemma",
    llama: "Llama",
    qwen: "Qwen",
    opus: "Opus",
    sonnet: "Sonnet",
    haiku: "Haiku",
    fable: "Fable",
  };
  function seriesOf(model) {
    let family = model.family;
    if (model.vendor === "openai") {
      if (family === "gpt-pro") family = "gpt";
      if (family === "o-series-pro") family = "o-series";
    }
    return {
      id: `series-${model.vendor}-${family}`,
      vendor: model.vendor,
      family: titles[family] || family,
      key: `${model.vendor}/${family}`,
    };
  }
  function versionOf(model) {
    if (
      model.vendor === "openai" &&
      ["gpt", "gpt-pro"].includes(model.family)
    ) {
      const match = model.name.match(/^GPT[- ](\d+(?:\.\d+)?[a-z]?)/i);
      if (match) return match[1] + (/turbo/i.test(model.name) ? " Turbo" : "");
    }
    if (
      model.vendor === "openai" &&
      ["o-series", "o-series-pro"].includes(model.family)
    ) {
      const match = model.name.match(/^(o\d+)(-preview)?/i);
      if (match) return match[0];
    }
    return model.generation;
  }
  function catalogSeries() {
    const series = new Map();
    for (const model of MC.models) {
      const info = seriesOf(model);
      if (!series.has(info.id))
        series.set(info.id, { ...info, models: [], versions: [] });
      series.get(info.id).models.push(model);
    }
    for (const row of series.values()) {
      const buckets = new Map();
      for (const model of row.models) {
        const version = versionOf(model);
        if (!buckets.has(version)) buckets.set(version, []);
        buckets.get(version).push(model);
      }
      for (const [version, members] of buckets) {
        const ids = new Set(members.map((m) => m.id)),
          revisions = new Map();
        for (const model of members) {
          let depth = 0;
          const seen = new Set();
          for (
            let prev = model.prev;
            prev && !seen.has(prev.id);
            prev = prev.prev
          ) {
            seen.add(prev.id);
            if (ids.has(prev.id)) depth++;
          }
          if (!revisions.has(depth)) revisions.set(depth, []);
          revisions.get(depth).push(model);
        }
        for (const [depth, models] of revisions) {
          models.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
          const revision = revisions.size > 1 ? ` · ${models[0].date}` : "";
          row.versions.push({
            id:
              "version-" +
              encodeURIComponent(
                `${row.key}/${version}${revisions.size > 1 ? `/revision-${depth}` : ""}`,
              ),
            version,
            label: version + revision,
            name: `${row.family}${row.family === "GPT" ? "-" : " "}${version}${revision}`,
            models,
          });
        }
      }
      row.versions.sort(
        (a, b) => a.models[0].t - b.models[0].t || a.id.localeCompare(b.id),
      );
    }
    return [...series.values()].sort(
      (a, b) =>
        MC.VENDORS.indexOf(a.vendor) - MC.VENDORS.indexOf(b.vendor) ||
        a.family.localeCompare(b.family),
    );
  }
  const catalog = catalogSeries();
  function windowRange(mode = "recent", today = MC.today) {
    const end = Date.parse(today),
      [year, month, day] = today.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
    const start = Date.UTC(year - 1, month - 1, Math.min(day, lastDay));
    return {
      mode: mode === "all" ? "all" : "recent",
      start,
      end,
      startDate: new Date(start).toISOString().slice(0, 10),
      endDate: today,
    };
  }
  function dateBounds(date) {
    if (date.length === 10) return [Date.parse(date), Date.parse(date)];
    const [year, month] = date.split("-").map(Number);
    return [Date.UTC(year, month - 1, 1), Date.UTC(year, month, 0)];
  }
  function inWindow(model, range) {
    const [first, last] = dateBounds(model.date);
    return range.mode === "all" || (last >= range.start && first <= range.end);
  }
  function partition(models, range) {
    const ids = new Set(models.map((m) => m.id));
    const rows = catalog
      .map((row) => ({
        ...row,
        models: row.models.filter((m) => ids.has(m.id)),
        versions: row.versions
          .map((v) => ({ ...v, models: v.models.filter((m) => ids.has(m.id)) }))
          .filter((v) => v.models.length),
      }))
      .filter((row) => row.models.length);
    return {
      rows: rows.filter((row) => row.models.some((m) => inWindow(m, range))),
      archived: rows.filter(
        (row) => !row.models.some((m) => inWindow(m, range)),
      ),
    };
  }
  function normalizeVersionIds(ids) {
    const versions = catalog.flatMap((row) => row.versions),
      valid = new Set(versions.map((v) => v.id));
    const result = [];
    for (const id of ids) {
      if (valid.has(id)) result.push(id);
      else if (id.startsWith("variants-")) {
        // Previously shared version groups map through their actual source model IDs.
        let parts;
        try {
          parts = decodeURIComponent(id.slice(9)).split("/");
        } catch {
          continue;
        }
        const matches = MC.models.filter(
          (m) =>
            m.vendor === parts[0] &&
            m.family === parts[1] &&
            m.generation === parts.slice(2).join("/"),
        );
        for (const v of versions)
          if (v.models.some((m) => matches.some((old) => old.id === m.id)))
            result.push(v.id);
      }
    }
    return [...new Set(result)];
  }
  function normalizeHistoryIds(ids) {
    const valid = new Set(catalog.map((row) => row.id));
    return [
      ...new Set(
        ids.flatMap((id) =>
          valid.has(id) ? [id] : MC.byId[id] ? [seriesOf(MC.byId[id]).id] : [],
        ),
      ),
    ];
  }
  MC.timeline = {
    windowRange,
    dateBounds,
    inWindow,
    seriesOf,
    versionOf,
    catalog,
    partition,
    normalizeVersionIds,
    normalizeHistoryIds,
  };
})();
