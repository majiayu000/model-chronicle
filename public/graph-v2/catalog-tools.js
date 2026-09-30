// Small, shared catalog operations used by the timeline and static tools.
(function () {
  const normalize = (text) =>
    String(text || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s._-]+/g, "");
  function search(models, query, labels = {}) {
    const q = normalize(query);
    const score = (m) => {
      if (!q) return 1;
      const names = [normalize(m.name), normalize(m.id)];
      if (names.includes(q)) return 3;
      if (names.some((name) => name.startsWith(q))) return 2;
      return [
        m.name,
        m.id,
        m.family,
        labels[m.vendor] || m.vendor,
        m.generation,
      ].some((v) => normalize(v).includes(q))
        ? 1
        : 0;
    };
    return models
      .map((m) => ({ m, score: score(m) }))
      .filter((x) => x.score)
      .sort(
        (a, b) =>
          b.score - a.score ||
          (b.m.dates.ga || b.m.dates.announced).localeCompare(
            a.m.dates.ga || a.m.dates.announced,
          ) ||
          a.m.name.localeCompare(b.m.name),
      )
      .map((x) => x.m);
  }
  function filter(models, options) {
    return models.filter((m) => {
      const date = m.dates.ga || m.dates.announced;
      const start = date.length === 7 ? date + "-01" : date;
      const end = date.length === 7 ? date + "-31" : date;
      return (
        (!options.vendor || m.vendor === options.vendor) &&
        (!options.modality ||
          m.specs.modalities_in.includes(options.modality)) &&
        (!options.open || m.open_weights) &&
        (!options.context ||
          (m.specs.context_window != null &&
            m.specs.context_window >= options.context)) &&
        (!options.from || end >= options.from) &&
        (!options.to || start <= options.to)
      );
    });
  }
  function estimate(price, input, output, requests) {
    if (price.input_per_mtok == null || price.output_per_mtok == null)
      return null;
    if (![input, output, requests].every((n) => Number.isFinite(n) && n >= 0))
      return null;
    const total =
      ((input * price.input_per_mtok + output * price.output_per_mtok) *
        requests) /
      1e6;
    return Number.isFinite(total) ? total : null;
  }
  function csv(models) {
    const columns = [
      "id",
      "name",
      "vendor",
      "release",
      "context_window",
      "max_output",
      "input_launch_price",
      "output_launch_price",
      "verified_at",
      "sources",
    ];
    const quote = (v) => {
      const text = String(v ?? "");
      return (
        '"' +
        (/^[=+@\-\t\r]/.test(text) ? "'" : "") +
        text.replaceAll('"', '""') +
        '"'
      );
    };
    return (
      "\ufeff" +
      [
        columns,
        ...models.map((m) => [
          m.id,
          m.name,
          m.vendor,
          m.dates.ga || m.dates.announced,
          m.specs.context_window,
          m.specs.max_output,
          m.specs.pricing.input_per_mtok,
          m.specs.pricing.output_per_mtok,
          m.verified_at,
          m.sources.join(" | "),
        ]),
      ]
        .map((r) => r.map(quote).join(","))
        .join("\r\n")
    );
  }
  function download(models, filename) {
    const url = URL.createObjectURL(
      new Blob([csv(models)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.MCCatalog = { normalize, search, filter, estimate, csv, download };
})();
