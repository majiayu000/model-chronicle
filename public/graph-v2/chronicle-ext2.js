// 扩展：任意模型对比 + ⌘K 搜索
(function init() {
  if (!window.MC || !window.MC.models) return setTimeout(init, 20);
  const MAX = 4;
  const defaults = () => {
    const MC = window.MC;
    const group = MC.BENCH.map((b) => MC.comparable(MC.models, b)).find(
      (g) => g.models.length >= 2,
    );
    return group ? group.models.slice(0, 3).map((m) => m.id) : [];
  };
  const cmpIds = (s) =>
    (s.cmp || defaults()).filter((id) => window.MC.byId[id]);

  function ext2(s, set) {
    const MC = window.MC,
      ids = cmpIds(s);
    const open = (id) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      set({ view: "detail", id, hover: null, pal: false });
      window.scrollTo(0, 0);
    };
    const add = (id) => (e) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (ids.includes(id) || ids.length >= MAX) return;
      set({
        cmp: ids.concat(id),
        view: "compare",
        id: null,
        pal: false,
        q: "",
      });
      window.scrollTo(0, 0);
    };
    const out = { isCompare: s.view === "compare" };

    if (out.isCompare) {
      const ms = ids.map((id) => MC.byId[id]);
      const n = ms.length;
      const cell = (vals, better, fmt) => {
        const nums = vals.filter((v) => v != null);
        const best =
          nums.length > 1 && better
            ? better === "hi"
              ? Math.max(...nums)
              : Math.min(...nums)
            : null;
        return vals.map((v) => ({
          v: v == null ? "—" : fmt ? fmt(v) : v,
          best: best != null && v === best && nums.some((x) => x !== best),
          fg:
            v == null
              ? "#858892"
              : best != null && v === best && nums.some((x) => x !== best)
                ? "#d4f53c"
                : "#ecebe6",
        }));
      };
      const row = (label, vals, better, fmt) => ({
        label,
        cells: cell(vals, better, fmt),
      });
      const specs = [
        row(
          "厂商",
          ms.map((m) => MC.V[m.vendor].label),
        ),
        row(
          "档位",
          ms.map((m) => m.tierLabel),
        ),
        row(
          "发布",
          ms.map((m) => m.date),
        ),
        row(
          "架构",
          ms.map((m) => m.archLabel),
        ),
        row(
          "参数",
          ms.map((m) => m.paramsLabel),
        ),
        row(
          "上下文窗口",
          ms.map((m) => m.specs.context_window),
          "hi",
          MC.fmtTokens,
        ),
        row(
          "最大输出",
          ms.map((m) => m.specs.max_output),
          "hi",
          MC.fmtTokens,
        ),
        row(
          "输入发布价 / 百万 token",
          ms.map((m) => m.specs.pricing.input_per_mtok),
          "lo",
          (v) => "$" + v,
        ),
        row(
          "输出发布价 / 百万 token",
          ms.map((m) => m.specs.pricing.output_per_mtok),
          "lo",
          (v) => "$" + v,
        ),
        row(
          "最近核实观测价 / 百万 token",
          ms.map((m) => {
            const p = m.price_history?.at(-1);
            return p
              ? `$${p.input_per_mtok} / $${p.output_per_mtok} · ${p.observed_at}`
              : "—";
          }),
        ),
        row(
          "知识截止",
          ms.map((m) => m.specs.knowledge_cutoff),
        ),
        row(
          "输入模态",
          ms.map((m) => m.specs.modalities_in.join(" / ")),
        ),
        row(
          "权重",
          ms.map((m) => (m.open_weights ? "开放权重" : "闭源")),
        ),
      ];
      const bench = MC.BENCH.filter((b) =>
        ms.some((m) => MC.bench(m, b) != null),
      ).map((b) => {
        const vals = ms.map((m) => MC.bench(m, b));
        const group = MC.comparable(ms, b, s.groups?.[b]),
          eligible = new Set(group.models.map((m) => m.id));
        const c = cell(vals, null),
          ranked = cell(
            ms.map((m, i) => (eligible.has(m.id) ? vals[i] : null)),
            "hi",
          );
        c.forEach((x, i) => {
          if (ranked[i].best) {
            x.best = true;
            x.fg = ranked[i].fg;
          }
        });
        return {
          label: b,
          group: group.name || "暂无同条件对照组",
          groups: MC.comparisonGroups(ms, b).map(([name, members]) => ({
            name,
            count: members.length,
            on: name === group.name,
            pick: () => set({ groups: { ...(s.groups || {}), [b]: name } }),
          })),
          cells: c.map((x, i) => ({
            ...x,
            w: vals[i] == null ? 0 : vals[i],
            has: vals[i] != null,
            bar: x.best ? "#d4f53c" : "#33363c",
          })),
        };
      });
      const wins = ms.map(
        (m, i) => bench.filter((r) => r.cells[i].best).length,
      );
      out.cp = {
        cols: "200px repeat(" + Math.max(1, n) + ", minmax(170px,1fr))",
        heads: ms.map((m, i) => ({
          name: m.name,
          color: m.color,
          sub: MC.V[m.vendor].label + " · " + m.date,
          wins: wins[i],
          go: open(m.id),
          remove: (e) => {
            e.preventDefault();
            e.stopPropagation();
            set({ cmp: ids.filter((x) => x !== m.id) });
          },
        })),
        specs: s.diffOnly
          ? specs.filter((r) => new Set(r.cells.map((c) => c.v)).size > 1)
          : specs,
        bench: s.diffOnly
          ? bench.filter((r) => new Set(r.cells.map((c) => c.v)).size > 1)
          : bench,
        diffOnly: !!s.diffOnly,
        toggleDiff: () => set({ diffOnly: !s.diffOnly }),
        exportCsv: () => window.MCCatalog.download(ms, "model-comparison.csv"),
        hasBench: bench.length > 0,
        noBench: bench.length === 0 && n > 0,
        n,
        empty: n === 0,
        canAdd: n < MAX,
        full: n >= MAX,
        slots: MAX - n,
        addOpen: (e) => {
          if (e && e.preventDefault) e.preventDefault();
          set({ pal: true, q: "", searchIndex: 0, searchAll: false });
        },
        clear: (e) => {
          e.preventDefault();
          set({ cmp: [] });
        },
        reset: (e) => {
          e.preventDefault();
          set({ cmp: null });
        },
      };
    }

    const matches = window.MCCatalog.search(
      MC.models,
      s.q,
      Object.fromEntries(
        Object.entries(MC.V).map(([id, v]) => [id, v.searchLabel || v.label]),
      ),
    );
    const hits = s.searchAll ? matches : matches.slice(0, 8);
    const active = Math.max(0, Math.min(s.searchIndex || 0, hits.length - 1));
    out.pal = {
      open: !!s.pal,
      q: s.q || "",
      count: matches.length,
      shown: hits.length,
      hasMore: matches.length > hits.length,
      showAll: () => set({ searchAll: true }),
      empty: hits.length === 0,
      onQ: (e) => set({ q: e.target.value, searchIndex: 0, searchAll: false }),
      onKey: (e) => {
        if (e.isComposing) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          set({
            searchIndex: Math.max(
              0,
              Math.min(
                hits.length - 1,
                active + (e.key === "ArrowDown" ? 1 : -1),
              ),
            ),
          });
        }
        if (e.key === "Enter" && hits[active]) {
          e.preventDefault();
          if (e.metaKey || e.ctrlKey) add(hits[active].id)(e);
          else open(hits[active].id)(e);
        }
        if (e.key === "Escape") set({ pal: false });
      },
      close: () => set({ pal: false }),
      stop: (e) => e.stopPropagation(),
      openPal: (e) => {
        if (e && e.preventDefault) e.preventDefault();
        set({ pal: true, q: "", searchIndex: 0, searchAll: false });
      },
      hits: hits.map((m, i) => {
        const inCmp = ids.includes(m.id);
        return {
          name: m.name,
          color: m.color,
          sub: MC.V[m.vendor].label + " · " + m.tierLabel + " · " + m.date,
          first: i === active,
          active: i === active,
          bg: i === active ? "#1b1c20" : "transparent",
          go: open(m.id),
          add: add(m.id),
          canAdd: !inCmp && ids.length < MAX,
          inCmp,
          cantAdd: !inCmp && ids.length >= MAX,
        };
      }),
    };
    return out;
  }
  window.MC.ext2 = ext2;
})();
