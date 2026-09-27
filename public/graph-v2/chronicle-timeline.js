// Presentation-only grouping: never rewrite the catalog's predecessor graph.
(function () {
  const MC = window.MC;
  function windowRange(mode = "recent", today = MC.today) {
    const end = Date.parse(today);
    const [year, month, day] = today.split("-").map(Number);
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
    if (range.mode === "all") return true;
    const [first, last] = dateBounds(model.date);
    return last >= range.start && first <= range.end;
  }
  function variantGroups() {
    const candidates = new Map();
    for (const m of MC.models) {
      const key = [m.vendor, m.family, m.generation].join("/");
      if (!candidates.has(key)) candidates.set(key, []);
      candidates.get(key).push(m);
    }
    const groups = [];
    for (const [key, models] of candidates) {
      if (models.length < 2) continue;
      const ids = new Set(models.map((m) => m.id));
      // A revised release with the same generation is not a parallel size variant.
      const sequential = models.some((m) => {
        const seen = new Set();
        for (let prev = m.prev; prev && !seen.has(prev.id); prev = prev.prev) {
          if (ids.has(prev.id)) return true;
          seen.add(prev.id);
        }
        return false;
      });
      if (sequential) continue;
      let name = models[0].name;
      for (const m of models)
        while (name && !m.name.startsWith(name)) name = name.slice(0, -1);
      name = name.replace(/[\s-]+$/, "");
      groups.push({
        id: "variants-" + encodeURIComponent(key),
        vendor: models[0].vendor,
        family: name || `${models[0].family} ${models[0].generation}`,
        tier: "",
        isVariants: true,
        merged: true,
        models,
        lineCount: 1,
      });
    }
    return groups;
  }
  function groupLines(lines) {
    const models = lines.flatMap((line) => line.models);
    const selected = new Set(models.map((m) => m.id));
    const variants = variantGroups()
      .map((group) => ({
        ...group,
        models: group.models.filter((m) => selected.has(m.id)),
      }))
      .filter((group) => group.models.length);
    const variantIds = new Set(
      variants.flatMap((group) => group.models.map((m) => m.id)),
    );
    const rows = [...variants],
      independent = new Map();
    for (const original of lines) {
      const line = {
        ...original,
        models: original.models.filter((m) => !variantIds.has(m.id)),
      };
      if (!line.models.length) continue;
      const model = line.models[0];
      if (line.models.length === 1 && !model.prev && !model.next) {
        const id = `independent-${line.vendor}-${line.tier}`;
        if (!independent.has(id)) {
          const row = {
            ...line,
            id,
            family: "独立型号",
            merged: true,
            models: [],
            lineCount: 0,
          };
          independent.set(id, row);
          rows.push(row);
        }
        const row = independent.get(id);
        row.models.push(model);
        row.lineCount++;
      } else {
        rows.push({
          ...line,
          id: line.key.split("/").at(-1),
          merged: false,
          lineCount: 1,
        });
      }
    }
    for (const row of rows)
      row.models.sort((a, b) => a.t - b.t || a.id.localeCompare(b.id));
    return rows.sort(
      (a, b) =>
        MC.VENDORS.indexOf(a.vendor) - MC.VENDORS.indexOf(b.vendor) ||
        a.family.localeCompare(b.family) ||
        MC.TIERS.indexOf(a.tier) - MC.TIERS.indexOf(b.tier) ||
        a.id.localeCompare(b.id),
    );
  }
  function partition(models, range) {
    const lines = MC.lines(models);
    const current = lines.filter((line) =>
      line.models.some((m) => inWindow(m, range)),
    );
    const archived = lines.filter(
      (line) => !line.models.some((m) => inWindow(m, range)),
    );
    const rows = groupLines(lines).flatMap((row) => {
      if (!row.merged || row.isVariants || range.mode === "all") return [row];
      return [
        { ...row, models: row.models.filter((m) => inWindow(m, range)) },
        { ...row, models: row.models.filter((m) => !inWindow(m, range)) },
      ].filter((part) => part.models.length);
    });
    return {
      rows: rows.filter((row) => row.models.some((m) => inWindow(m, range))),
      archived: rows.filter(
        (row) => !row.models.some((m) => inWindow(m, range)),
      ),
      lineCount: current.length,
      archivedLineCount: archived.length,
    };
  }
  MC.timeline = {
    windowRange,
    inWindow,
    groupLines,
    partition,
    dateBounds,
    variantGroups,
  };
})();
