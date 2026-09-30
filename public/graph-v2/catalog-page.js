(async function () {
  const script = document.querySelector("script[data-dataset]");
  const finder = document.getElementById("finder");
  const calculator = document.getElementById("calculator");
  document
    .querySelector("[data-copy-citation]")
    ?.addEventListener("click", async () => {
      const field = document.getElementById("citation");
      const status = document.getElementById("copy-status");
      try {
        await navigator.clipboard.writeText(field.value);
        status.textContent = "引用已复制。";
      } catch {
        field.focus();
        field.select();
        status.textContent = "浏览器未允许自动复制，请复制上方已选中的引用。";
      }
    });
  if (!finder && !calculator) return;
  const T = window.MCCatalog;
  let models;
  try {
    const response = await fetch(
      new URL(script.dataset.dataset, document.baseURI),
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    models = await response.json();
  } catch (error) {
    const status = document.getElementById(
      finder ? "finder-status" : "estimate",
    );
    status.textContent =
      "模型数据加载失败，请刷新重试；仍可通过模型索引查看静态资料。";
    console.error("Catalog data failed", error);
    return;
  }
  const labels = JSON.parse(
    document.getElementById("catalog-labels").textContent,
  );
  const params = new URLSearchParams(location.search);
  if (finder) {
    let selected = models;
    const status = document.getElementById("finder-status");
    const exportButton = document.getElementById("export-selection");
    const container = document.querySelector("#finder-results .model-list");
    const nodes = new Map(
      [...container.children].map((el) => [el.dataset.modelId, el]),
    );
    for (const name of [
      "q",
      "vendor",
      "modality",
      "context",
      "from",
      "to",
      "open",
    ]) {
      const field = finder.elements.namedItem(name);
      if (field.type === "checkbox") field.checked = params.get(name) === "1";
      else if (params.has(name)) field.value = params.get(name);
    }
    const update = () => {
      const data = new FormData(finder);
      const options = Object.fromEntries(data);
      const invalidRange =
        options.from && options.to && options.from > options.to;
      selected =
        finder.checkValidity() && !invalidRange
          ? T.filter(T.search(models, options.q, labels), options)
          : [];
      const visible = new Set(selected.map((m) => m.id));
      for (const [id, node] of nodes) node.hidden = !visible.has(id);
      for (const m of selected) container.append(nodes.get(m.id));
      status.textContent = invalidRange
        ? "开始日期不能晚于结束日期。"
        : `${selected.length} / ${models.length} 个型号符合条件。${selected.length ? "月份精度记录按与日期范围重叠处理。" : "可放宽筛选，未知规格不会被当作满足条件。"}`;
      exportButton.disabled = selected.length === 0;
      const query = new URLSearchParams(
        [...data]
          .filter(([, value]) => value !== "")
          .map(([key, value]) => [key, key === "open" ? "1" : value]),
      );
      history.replaceState(
        {},
        "",
        location.pathname + (query.size ? `?${query}` : "") + location.hash,
      );
    };
    finder.addEventListener("submit", (e) => e.preventDefault());
    finder.addEventListener("input", update);
    finder.addEventListener("reset", () => setTimeout(update, 0));
    exportButton.addEventListener("click", () =>
      T.download(selected, "model-selection.csv"),
    );
    update();
  }
  if (calculator) {
    const modelSelect = calculator.elements.namedItem("model");
    const priceSelect = calculator.elements.namedItem("price");
    const output = document.getElementById("estimate");
    const basis = document.getElementById("price-basis");
    const available = models.filter(
      (m) =>
        (m.specs.pricing.input_per_mtok != null &&
          m.specs.pricing.output_per_mtok != null) ||
        m.price_history?.length,
    );
    available.sort((a, b) => a.name.localeCompare(b.name));
    modelSelect.replaceChildren(
      ...available.map((m) => new Option(m.name, m.id)),
    );
    if (!available.length) {
      output.textContent = "暂无可试算的价格资料。";
      return;
    }
    modelSelect.disabled = false;
    priceSelect.disabled = false;
    if (available.some((m) => m.id === params.get("model")))
      modelSelect.value = params.get("model");
    for (const name of ["input", "output", "requests"])
      if (params.has(name))
        calculator.elements.namedItem(name).value = params.get(name);
    let choices;
    const setPrices = () => {
      const m = available.find((m) => m.id === modelSelect.value);
      choices = [];
      if (
        m.specs.pricing.input_per_mtok != null &&
        m.specs.pricing.output_per_mtok != null
      )
        choices.push({
          ...m.specs.pricing,
          key: "launch",
          label: `发布价 · ${m.dates.ga || m.dates.announced}（型号发布日期）`,
          sources: m.sources,
        });
      for (const p of m.price_history || [])
        choices.push({
          ...p,
          key: p.observed_at,
          label: `历史观测 · ${p.observed_at}`,
          sources: [p.source],
        });
      priceSelect.replaceChildren(
        ...choices.map((p) => new Option(p.label, p.key)),
      );
    };
    const update = () => {
      const p = choices.find((p) => p.key === priceSelect.value);
      const values = ["input", "output", "requests"].map(
        (name) => calculator.elements.namedItem(name).valueAsNumber,
      );
      const total = calculator.checkValidity()
        ? T.estimate(p, ...values)
        : null;
      output.textContent =
        total == null
          ? "请输入有效的非负整数用量。"
          : `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USD`;
      basis.replaceChildren(
        document.createTextNode(
          `${p.label}；输入 $${p.input_per_mtok} / 输出 $${p.output_per_mtok} 每百万 token。${p.note || ""} 来源：`,
        ),
      );
      p.sources.forEach((url, i) => {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = ` ${i + 1} `;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        basis.append(a);
      });
      const query = new URLSearchParams(new FormData(calculator));
      history.replaceState({}, "", `${location.pathname}?${query}`);
    };
    setPrices();
    if (choices.some((p) => p.key === params.get("price")))
      priceSelect.value = params.get("price");
    calculator.addEventListener("submit", (e) => e.preventDefault());
    calculator.addEventListener("input", (e) => {
      if (e.target === modelSelect) setPrices();
      update();
    });
    update();
  }
})();
