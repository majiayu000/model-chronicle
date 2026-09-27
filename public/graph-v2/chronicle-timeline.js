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
  function groupLines(lines) {
    const rows = [],
      independent = new Map();
    for (const line of lines) {
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
        Number(a.merged) - Number(b.merged) ||
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
    return {
      rows: groupLines(current),
      archived: groupLines(archived),
      lineCount: current.length,
      archivedLineCount: archived.length,
    };
  }
  MC.timeline = { windowRange, inWindow, groupLines, partition, dateBounds };
})();
