class Component extends DCLogic {
  state = { ready: false };
  update(p) {
    const patch = { ...p };
    if (Object.hasOwn(patch, "hiddenModels")) {
      patch.hiddenModels = window.MC.visibility.normalize(patch.hiddenModels);
      try {
        patch.hiddenPersistent = window.MC.visibility.save(
          window.localStorage,
          patch.hiddenModels,
        );
      } catch {
        patch.hiddenPersistent = false;
      }
    }
    this.setState(patch, () => {
      if (Object.hasOwn(patch, "hiddenModels")) {
        document
          .querySelector(
            patch.hideUndo?.length
              ? "[data-hide-undo]"
              : "[data-hidden-manager]",
          )
          ?.focus();
      }
      const MC = window.MC;
      if (!MC?.route) return;
      const hash = MC.route.serialize(this.state);
      if (hash !== window.location.hash) {
        const major =
          p.view !== undefined ||
          p.id !== undefined ||
          p.cmp !== undefined ||
          p.window !== undefined ||
          p.history !== undefined ||
          p.archives !== undefined ||
          p.variants !== undefined ||
          p.vendors !== undefined;
        window.history[major ? "pushState" : "replaceState"]({}, "", hash);
      }
    });
  }
  componentDidMount() {
    let preference;
    try {
      preference = window.MC.visibility.load(window.localStorage);
    } catch {
      preference = { ids: [], persistent: false };
    }
    const tick = () =>
      window.MC &&
      window.MC.vm &&
      window.MC.ext &&
      window.MC.ext2 &&
      window.MC.route &&
      window.MC.models
        ? this.setState({
            ...window.MC.initState(),
            ...window.MC.route.parse(window.location.hash),
            hiddenModels: preference.ids,
            hiddenPersistent: preference.persistent,
            ready: true,
          })
        : setTimeout(tick, 30);
    tick();
    this._route = () =>
      this.setState({
        ...window.MC.initState(),
        ...window.MC.route.parse(window.location.hash),
        ready: true,
      });
    window.addEventListener("popstate", this._route);
    window.addEventListener("hashchange", this._route);
    this._key = (e) => {
      if (!this.state.ready) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        this.update({ pal: !this.state.pal, q: "" });
        return;
      }
      if (e.key === "Escape" && this.state.pal) {
        this.update({ pal: false });
        return;
      }
      if (
        this.state.pal ||
        /input|textarea|select/i.test((e.target && e.target.tagName) || "")
      )
        return;
      if (e.key === "/") {
        e.preventDefault();
        this.update({ pal: true, q: "" });
        return;
      }
      const map = {
        1: "timeline",
        2: "trends",
        3: "arch",
        4: "catchup",
        5: "cost",
        6: "life",
        7: "compare",
      };
      if (map[e.key]) this.update({ view: map[e.key], id: null, hover: null });
      else if (e.key === "Escape" && this.state.view === "detail")
        this.update({ view: "timeline", id: null });
    };
    window.addEventListener("keydown", this._key);
    this._resize = () => this.setState({ viewportWidth: window.innerWidth });
    window.addEventListener("resize", this._resize);
  }
  componentDidUpdate() {
    const key = `${this.state.view}/${this.state.window}`;
    if (key !== this._timelineViewportKey) {
      this._timelineViewportKey = key;
      const scroller = document.querySelector(".timeline-scroll");
      if (scroller) scroller.scrollLeft = 0;
    }
  }
  componentWillUnmount() {
    window.removeEventListener("keydown", this._key);
    window.removeEventListener("popstate", this._route);
    window.removeEventListener("hashchange", this._route);
    window.removeEventListener("resize", this._resize);
  }
  clockEl() {
    if (!this._Clock) {
      this._Clock = class extends React.Component {
        state = { t: new Date() };
        componentDidMount() {
          this.i = setInterval(() => this.setState({ t: new Date() }), 1000);
        }
        componentWillUnmount() {
          clearInterval(this.i);
        }
        render() {
          return React.createElement(
            "span",
            null,
            this.state.t.toISOString().slice(11, 19) + " UTC",
          );
        }
      };
    }
    return React.createElement(this._Clock);
  }
  linksEl(row, width) {
    const h = React.createElement;
    return h(
      "svg",
      {
        className: "series-link-svg",
        width,
        height: row.height,
        role: "img",
        "aria-label": `${row.family} 已记录的继任关系`,
      },
      ...row.links.map((link) => {
        const x1 = link.source.px + 8,
          x2 = link.target.px - 8,
          y = link.source.top;
        const sourceIndex = row.versions.indexOf(link.source),
          targetIndex = row.versions.indexOf(link.target);
        const branch = Math.abs(targetIndex - sourceIndex) > 1;
        const d = branch
          ? `M${x1},${y} Q${(x1 + x2) / 2},${y - 36} ${x2},${y}`
          : `M${x1},${y} H${x2}`;
        const showGap = link.gap && !branch && x2 - x1 >= 64;
        return h(
          "g",
          { key: link.key },
          h("title", null, link.title),
          h("path", {
            d,
            className: "series-link",
            fill: "none",
            stroke: row.color,
            strokeWidth: 2,
            "data-relations": link.pairs.length,
          }),
          h("path", {
            d,
            className: "series-link-hit",
            fill: "none",
            stroke: "transparent",
            strokeWidth: 12,
          }),
          showGap
            ? h(
                "text",
                {
                  x: (x1 + x2) / 2,
                  y: y - 9,
                  textAnchor: "middle",
                  className: "series-link-gap",
                },
                link.gap,
              )
            : null,
        );
      }),
    );
  }
  heatmap(models, today, range) {
    const cnt = {};
    models.forEach((m) => {
      const k = String(m.date).slice(0, 7);
      cnt[k] = (cnt[k] || 0) + 1;
    });
    const ys = models.map((m) => +String(m.date).slice(0, 4)).filter(Boolean);
    const y0 =
        range?.mode === "recent"
          ? Number(range.startDate.slice(0, 4))
          : Math.min(Number(today.slice(0, 4)), ...ys),
      y1 = Math.max(...ys, Number(today.slice(0, 4)));
    const nowK = today.slice(0, 7),
      rows = [];
    for (let y = y0; y <= y1; y++)
      rows.push({
        y,
        cells: Array.from({ length: 12 }, (_, i) => {
          const k = y + "-" + String(i + 1).padStart(2, "0"),
            n = cnt[k] || 0,
            future =
              k > nowK ||
              (range?.mode === "recent" && k < range.startDate.slice(0, 7));
          return {
            tip: k + (future ? " · 窗口外" : " · " + n),
            bg: future
              ? "transparent"
              : n === 0
                ? "#1c1d21"
                : n === 1
                  ? "rgba(212,245,60,.28)"
                  : n === 2
                    ? "rgba(212,245,60,.55)"
                    : "#d4f53c",
            ol:
              k === nowK
                ? "1px solid #ecebe6"
                : future
                  ? "1px dashed #26282d"
                  : "none",
          };
        }),
      });
    return rows;
  }
  renderVals() {
    const showHero = this.props.showHero ?? true;
    const base = { clock: this.clockEl() };
    if (!this.state.ready || !window.MC || !window.MC.vm)
      return {
        ...base,
        mode: "LOADING",
        total: "…",
        heroTotal: "…",
        coverageTotal: "…",
        statLabel: "收录模型",
        shown: "…",
        priceCount: "…",
        benchmarkCount: "…",
        vendorCount: "…",
        coverage: {
          ga: "…",
          pricing: "…",
          benchmark: "…",
          evaluation: "…",
          comparable: "…",
          architecture: "…",
          lifecycle: "…",
          stale: "…",
        },
        span: "",
        heat: [],
        nav: [],
        vendorChips: [],
        tierChips: [],
        capChips: [],
        showFilters: true,
        isTimeline: false,
        hero: showHero,
        filterGap: showHero ? 0 : 24,
      };
    const MC = window.MC,
      set = (p) => this.update(p);
    const v = MC.vm(this.state, set, {
      up: "#7ee081",
      down: "#ff6b5b",
      muted: "#858892",
    });
    Object.assign(v, base, MC.ext(this.state, set), MC.ext2(this.state, set));
    if (v.tl)
      for (const row of v.tl.rows) {
        if (row.isLine && row.links.length)
          row.linksEl = this.linksEl(row, v.tl.width);
      }
    // Native option text avoids the template runtime's interpolation spans inside <option>.
    const focus = v.vendorFocus;
    v.vendorSelect = React.createElement(
      "select",
      {
        id: "vendor-focus",
        "aria-label": "只看某个厂商",
        value: focus.value,
        onChange: focus.change,
      },
      React.createElement("option", { value: "all" }, "全部厂商"),
      focus.custom
        ? React.createElement(
            "option",
            { value: "custom", disabled: true },
            focus.customLabel,
          )
        : null,
      ...focus.options.map((option) =>
        React.createElement(
          "option",
          { key: option.id, value: option.id },
          option.label,
        ),
      ),
    );
    if (v.isCompare) v.showFilters = false;
    v.nav = v.nav.concat(
      [
        ["catchup", "开源追赶"],
        ["cost", "能力成本"],
        ["life", "在役状态"],
        ["compare", "对比"],
      ].map(([k, label]) => ({
        label,
        on: this.state.view === k,
        go: (e) => {
          e.preventDefault();
          set({ view: k, id: null, hover: null });
          window.scrollTo(0, 0);
        },
      })),
    );
    const TX = "#ecebe6",
      MU = "#9a9ca3",
      FA = "#858892",
      LN = "#26282d",
      ACC = "#d4f53c";
    v.mode =
      {
        timeline: "TIMELINE",
        trends: "TRENDS",
        arch: "ARCH",
        catchup: "CATCH-UP",
        cost: "COST",
        life: "LIFECYCLE",
        compare: "COMPARE",
        detail: "DETAIL",
      }[this.state.view] || "READY";
    v.hero = showHero && !v.isDetail;
    v.filterGap = v.hero ? 0 : 24;
    const stats = v.statsModels;
    v.heroTotal = stats.length;
    v.statLabel = v.isTimeline
      ? v.range.mode === "all"
        ? "历史模型 · 筛选后"
        : "窗口内模型 · 筛选后"
      : "收录模型";
    v.coverageTotal = stats.length;
    v.vendorCount = new Set(stats.map((m) => m.vendor)).size;
    v.priceCount = stats.filter(
      (m) =>
        m.specs.pricing.input_per_mtok != null &&
        m.specs.pricing.output_per_mtok != null,
    ).length;
    v.benchmarkCount = stats.filter((m) => m.benchmarks.length > 0).length;
    v.coverage = {
      ga: stats.filter((m) => !!m.dates.ga).length,
      pricing: v.priceCount,
      benchmark: v.benchmarkCount,
      evaluation: stats.filter((m) => m.benchmarks.some((b) => !!b.evaluation))
        .length,
      comparable: stats.filter((m) =>
        m.benchmarks.some((b) => b.comparison_group && b.evaluation),
      ).length,
      architecture: stats.filter((m) => !!m.arch).length,
      lifecycle: stats.filter((m) => !!m.dates.deprecated || !!m.dates.retired)
        .length,
      stale: stats.filter(
        (m) => (Date.now() - Date.parse(m.verified_at)) / 864e5 > 90,
      ).length,
    };
    v.heat = this.heatmap(stats, MC.today, v.isTimeline ? v.range : null);
    const ys = stats.map((m) => Number(m.date.slice(0, 4)));
    v.span =
      v.isTimeline && v.range.mode === "recent"
        ? v.range.startDate + " → " + v.range.endDate
        : ys.length
          ? Math.min(...ys) + " → " + Math.max(...ys)
          : "暂无匹配模型";
    v.nav.forEach((n, i) => {
      n.off = !n.on;
      n.key = i + 1;
    });
    v.vendorChips.forEach((c) => {
      c.fg = c.on ? TX : FA;
      c.bd = c.on ? "#33363c" : LN;
      c.bg = c.on ? "#1b1c20" : "transparent";
      c.dotOp = c.on ? 1 : 0.3;
    });
    v.tierChips.forEach((c) => {
      c.fg = c.on ? TX : FA;
      c.bd = c.on ? "#33363c" : LN;
      c.bg = c.on ? "#1b1c20" : "transparent";
    });
    v.capChips.forEach((c) => {
      c.fg = c.on ? "#0e0f11" : MU;
      c.bd = c.on ? ACC : LN;
      c.bg = c.on ? ACC : "transparent";
    });
    if (v.trend) {
      v.trend.tabs.forEach((t) => {
        t.bg = t.on ? TX : "transparent";
        t.fg = t.on ? "#0e0f11" : MU;
        t.bd = t.on ? TX : LN;
      });
      v.trend.points.forEach((p) => {
        p.fill = p.open ? "#141518" : p.color;
        p.tip = p.name + " · " + p.score + " · " + p.date;
      });
      v.trend.bestClosedAny = v.trend.bestAll;
    }
    for (const groupList of [
      v.trend?.groups,
      v.cu?.groups,
      v.co?.groups,
      ...(v.cp?.bench || []).map((r) => r.groups),
    ]) {
      if (groupList)
        groupList.forEach((g) => {
          g.bg = g.on ? "#d4f53c" : "#141518";
          g.fg = g.on ? "#0e0f11" : "#9a9ca3";
        });
    }
    if (v.trend) v.trend.noGroups = !v.trend.groups.length;
    if (v.cu) v.cu.noGroups = !v.cu.groups.length;
    if (v.co) v.co.noGroups = !v.co.groups.length;
    const tabStyle = (t) => {
      t.bg = t.on ? TX : "transparent";
      t.fg = t.on ? "#0e0f11" : MU;
      t.bd = t.on ? TX : LN;
    };
    if (v.cu) v.cu.tabs.forEach(tabStyle);
    if (v.co) v.co.tabs.forEach(tabStyle);
    if (v.li)
      v.li.modes.forEach((t) => {
        t.bg = t.on ? "#26282d" : "transparent";
        t.fg = t.on ? TX : MU;
      });
    if (v.arch)
      v.arch.points.forEach((p) => {
        p.dense = !p.moe;
        p.tip = p.name + " · " + p.params;
      });
    if (v.d) {
      const c = v.d.m.color;
      v.d.specRows.forEach((r, i) => {
        r.ln = i + 1;
      });
      v.d.life.forEach((l) => {
        l.dot = l.done ? ACC : "#33363c";
      });
      v.d.line.forEach((x) => {
        x.dot = x.cur ? c : "#33363c";
        x.weight = x.cur ? 600 : 400;
        x.fg = x.cur ? TX : MU;
      });
      if (v.d.diag && v.d.diag.experts)
        v.d.diag.experts.forEach((e) => {
          e.bg = e.active ? ACC : "transparent";
          e.bd = e.active ? ACC : "#33363c";
        });
      v.d.noSources = !v.d.hasSources;
    }
    v.goHome = (e) => {
      e.preventDefault();
      set({ view: "timeline", id: null });
    };
    return v;
  }
}
