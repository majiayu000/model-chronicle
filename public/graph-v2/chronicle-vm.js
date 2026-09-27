// 两个设计方向共用的视图模型：筛选、时间轴、趋势、架构、详情
(function init() {
  if (!window.MC || !window.MC.models) return setTimeout(init, 20);
  const MC = window.MC;
  const YEAR = 365.25 * 864e5;
  const CAP_KEYS = ["reasoning", "code", "vision", "long", "open"];
  const startYear = Math.min(2023, ...MC.models.map((m) => m.year)),
    endYear = Number(MC.today.slice(0, 4));
  const T0 = Date.UTC(startYear, 0, 1),
    T1 = Date.UTC(endYear + 1, 0, 1);
  const xTicks = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const y = startYear + i;
    return { y, left: ((Date.UTC(y, 0, 1) - T0) / (T1 - T0)) * 100 };
  });
  const pct = (t) => ((t - T0) / (T1 - T0)) * 100;
  const logTop = (v) => (1 - Math.log10(v) / Math.log10(3000)) * 100;

  function initState() {
    const bench =
      MC.BENCH.find((b) => MC.comparable(MC.models, b).models.length >= 2) ||
      "GPQA Diamond";
    return {
      view: "timeline",
      id: null,
      vendors: MC.VENDORS.slice(),
      tiers: MC.TIERS.slice(),
      caps: [],
      px: 840,
      autoScale: true,
      window: "recent",
      history: [],
      variants: [],
      archives: [],
      bench,
      hover: null,
      archMode: "total",
    };
  }

  function vm(s, set, opts) {
    opts = opts || {};
    const tog = (arr, v) =>
      arr.includes(v) ? arr.filter((x) => x !== v) : arr.concat(v);
    const pass = (m) =>
      s.vendors.includes(m.vendor) &&
      s.tiers.includes(m.tier) &&
      s.caps.every((c) => (c === "open" ? m.open_weights : m.caps.includes(c)));
    const range = MC.timeline.windowRange(s.window);
    const windowModels =
      s.view === "timeline"
        ? MC.models.filter((m) => MC.timeline.inWindow(m, range))
        : MC.models;
    const models = windowModels.filter(pass);
    const go = (view, id) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      set({ view, id: id || null, hover: null });
      window.scrollTo(0, 0);
    };
    const open = (id) => go("detail", id);

    const nav = [
      ["timeline", "时间轴"],
      ["trends", "能力趋势"],
      ["arch", "架构演进"],
    ].map(([k, label]) => ({
      label,
      on: s.view === k || (k === "timeline" && s.view === "detail"),
      go: go(k),
    }));
    const vendorChips = MC.VENDORS.map((v) => ({
      label: MC.V[v].label,
      color: MC.V[v].color,
      on: s.vendors.includes(v),
      n: windowModels.filter(
        (m) =>
          m.vendor === v &&
          s.tiers.includes(m.tier) &&
          s.caps.every((c) =>
            c === "open" ? m.open_weights : m.caps.includes(c),
          ),
      ).length,
      toggle: () => set({ vendors: tog(s.vendors, v) }),
    }));
    const allVendors = s.vendors.length === MC.VENDORS.length;
    const vendorFocus = {
      value: allVendors
        ? "all"
        : s.vendors.length === 1
          ? s.vendors[0]
          : "custom",
      custom: !allVendors && s.vendors.length !== 1,
      customLabel: s.vendors.length
        ? `已选 ${s.vendors.length} 家（多选）`
        : "未选择厂商",
      canReset: !allVendors,
      options: vendorChips.map((chip, i) => ({
        id: MC.VENDORS[i],
        label: `${chip.label} (${chip.n})`,
      })),
      change: (e) => {
        const vendor = e.target.value;
        if (vendor === "all") set({ vendors: MC.VENDORS.slice(), hover: null });
        else if (MC.VENDORS.includes(vendor))
          set({ vendors: [vendor], hover: null });
      },
      reset: () => set({ vendors: MC.VENDORS.slice(), hover: null }),
    };
    const tierChips = MC.TIERS.map((t) => ({
      label: MC.TIER_LABEL[t],
      on: s.tiers.includes(t),
      toggle: () => set({ tiers: tog(s.tiers, t) }),
    }));
    const capChips = CAP_KEYS.map((c) => ({
      label: MC.CAPS[c],
      on: s.caps.includes(c),
      toggle: () => set({ caps: tog(s.caps, c) }),
    }));

    const out = {
      nav,
      vendorChips,
      vendorFocus,
      tierChips,
      capChips,
      total: windowModels.length,
      catalogTotal: MC.models.length,
      statsModels: s.view === "timeline" ? models : MC.models,
      range,
      shown: models.length,
      priceCount: MC.models.filter(
        (m) =>
          m.specs.pricing.input_per_mtok != null &&
          m.specs.pricing.output_per_mtok != null,
      ).length,
      benchmarkCount: MC.models.filter((m) => m.benchmarks.length > 0).length,
      isTimeline: s.view === "timeline",
      isTrends: s.view === "trends",
      isArch: s.view === "arch",
      isDetail: s.view === "detail",
      showFilters: s.view !== "detail",
      empty: models.length === 0,
    };

    // —— 时间轴（横向泳道）
    if (s.view === "timeline") {
      const viewport = window.innerWidth || 1440;
      const available =
        Math.min(viewport, 1440) - (viewport <= 760 ? 32 + 164 : 64 + 232) - 72;
      const P =
          s.autoScale !== false && range.mode !== "all"
            ? Math.max(
                220,
                Math.min(840, Math.floor(available / (13 / 12) / 20) * 20),
              )
            : s.px,
        today = range.end,
        start = range.mode === "all" ? T0 : range.start,
        end = today + YEAR / 12;
      const x = (t) => 24 + ((t - start) / YEAR) * P;
      const fullModels = MC.models.filter(pass);
      const grouped = MC.timeline.partition(fullModels, range);
      const chip = (m) => ({
        id: m.id,
        name: m.name,
        date: m.date,
        label: m.dateLabel,
        open: open(m.id),
      });
      const changeWindow = (mode) => () =>
        set({
          window: mode,
          px: mode === "all" ? 420 : 840,
          autoScale: true,
          history: [],
          variants: [],
          archives: [],
          hover: null,
        });
      const pan = (direction) => (e) => {
        const scroller = e.currentTarget
          .closest("section")
          ?.querySelector(".timeline-scroll");
        if (!scroller) return;
        const move = () => {
          const target = document.querySelector(".timeline-scroll");
          if (target)
            target.scrollBy({
              left: direction * Math.max(320, target.clientWidth * 0.65),
              behavior: "smooth",
            });
        };
        if (scroller.scrollWidth <= scroller.clientWidth && P < 420) {
          set({ px: 420, autoScale: false });
          requestAnimationFrame(() => requestAnimationFrame(move));
        } else move();
      };
      const years = [];
      for (
        let y = new Date(start).getUTCFullYear();
        y <= new Date(end).getUTCFullYear();
        y++
      ) {
        const t = Date.UTC(y, 0, 1);
        if (t >= start) years.push({ y, px: x(t) });
      }
      if (range.mode !== "all")
        years.unshift({ y: range.startDate.slice(0, 7), px: 0 });
      const quarters = [];
      for (
        let y = new Date(start).getUTCFullYear();
        y <= new Date(end).getUTCFullYear();
        y++
      ) {
        for (const mo of [3, 6, 9]) {
          const t = Date.UTC(y, mo, 1);
          if (
            t >= start &&
            t < end &&
            Math.abs(x(t) - x(today)) >= 60 &&
            !years.some((tick) => Math.abs(tick.px - x(t)) < 80)
          )
            quarters.push({ label: "Q" + (mo / 3 + 1), px: x(t) });
        }
      }
      const rows = [];
      for (const vendor of MC.VENDORS.filter((v) => s.vendors.includes(v))) {
        const vendorRows = [];
        for (const l of grouped.rows.filter((row) => row.vendor === vendor)) {
          const visible = l.models.filter((m) =>
            MC.timeline.inWindow(m, range),
          );
          const earlier =
            range.mode === "all"
              ? []
              : l.models.filter(
                  (m) => MC.timeline.dateBounds(m.date)[1] < range.start,
                );
          const laneEnds = [];
          const pts = visible.map((m) => {
            const px = Math.max(24, x(m.t));
            const labelWidth = Math.min(170, Math.max(64, m.name.length * 7));
            let lane = 0;
            if (l.merged) {
              lane = laneEnds.findIndex((end) => end + 16 < px);
              if (lane < 0) lane = laneEnds.length;
              laneEnds[lane] = px + labelWidth;
            }
            return { m, px, top: 21 + lane * 44 };
          });
          const segs = l.merged
            ? []
            : pts.slice(1).flatMap((p, i) => {
                if (p.m.prev?.id !== pts[i].m.id) return [];
                const w = p.px - pts[i].px;
                return [
                  {
                    left: pts[i].px,
                    w,
                    mid: pts[i].px + w / 2,
                    showGap:
                      w >= 56 &&
                      pts[i].m.dateKind === "ga" &&
                      p.m.dateKind === "ga",
                    gap: MC.fmtGap(pts[i].m.date, p.m.date),
                  },
                ];
              });
          const last = pts.at(-1),
            tp = x(today);
          const pending =
            !l.merged &&
            !last.m.next &&
            last.m.dateKind === "ga" &&
            tp - last.px >= 56
              ? {
                  left: last.px,
                  w: tp - last.px,
                  mid: last.px + (tp - last.px) / 2,
                  gap: MC.fmtGap(last.m.date, MC.today),
                }
              : null;
          const historyOpen =
            earlier.length > 0 && (s.history || []).includes(l.id);
          vendorRows.push({
            key: l.id,
            isLine: true,
            archive: false,
            merged: l.merged,
            family: l.family,
            tier: l.isVariants ? "同代规格" : MC.TIER_LABEL[l.tier],
            isVariants: !!l.isVariants,
            variants: visible.map((m) => ({ ...chip(m), tier: m.tierLabel })),
            variantsOpen: (s.variants || []).includes(l.id),
            variantsId: l.id,
            variantLeft: pts[0].px,
            variantDate:
              visible[0].date === visible.at(-1).date
                ? visible[0].date
                : `${visible[0].date} — ${visible.at(-1).date}`,
            variantsAction: `${l.family}：${(s.variants || []).includes(l.id) ? "收起" : "展开"} ${visible.length} 个规格`,
            toggleVariants: () =>
              set({ variants: tog(s.variants || [], l.id), hover: null }),
            n: visible.length,
            segs,
            pending,
            height: l.isVariants
              ? 72
              : 56 + Math.max(0, laneEnds.length - 1) * 44,
            hasHistory: range.mode !== "all" && earlier.length > 0,
            historyOpen,
            historyLabel: historyOpen
              ? "收起历史"
              : `··· 前 ${earlier.length} ${l.isVariants ? "个规格" : "代"}`,
            historyAction: `${MC.V[vendor].label} ${l.family} ${l.isVariants ? "" : MC.TIER_LABEL[l.tier]}：${historyOpen ? "收起历史" : `展开前 ${earlier.length} ${l.isVariants ? "个规格" : "代"}`}`,
            historyId: `history-${l.id}`,
            history: earlier.map(chip),
            toggleHistory: () =>
              set({ history: tog(s.history || [], l.id), hover: null }),
            dots: l.isVariants
              ? []
              : pts.map((p) => ({
                  px: p.px,
                  top: p.top,
                  gen: l.merged ? p.m.name : p.m.generation,
                  id: p.m.id,
                  open: open(p.m.id),
                  announcedOnly: p.m.dateKind === "announced",
                  moe: p.m.archType === "moe",
                  dense: p.m.archType === "dense",
                  unknown: !p.m.archType,
                  reasoning: p.m.reasoning,
                  hollow: !p.m.open_weights,
                  enter: (e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    set({
                      hover: {
                        id: p.m.id,
                        x: Math.max(
                          8,
                          Math.min(r.left - 8, window.innerWidth - 308),
                        ),
                        y: r.bottom + 10,
                      },
                    });
                  },
                  leave: () => set({ hover: null }),
                })),
          });
        }
        const archived = grouped.archived.filter(
          (row) => row.vendor === vendor,
        );
        if (archived.length) {
          const count = archived.length;
          const archiveOpen = (s.archives || []).includes(vendor);
          vendorRows.push({
            key: `archive-${vendor}`,
            isLine: false,
            archive: true,
            dots: [],
            segs: [],
            archiveOpen,
            archiveId: `archive-${vendor}`,
            archiveLabel: `${archiveOpen ? "▾" : "▸"} 窗口外模型组 ${count} 组`,
            archiveModels: archived.reduce(
              (n, row) => n + row.models.length,
              0,
            ),
            archivedRows: archived.map((row) => ({
              key: row.id,
              family: row.family,
              tier: row.isVariants ? "同代规格" : MC.TIER_LABEL[row.tier],
              models: row.models.map(chip),
            })),
            toggleArchive: () =>
              set({ archives: tog(s.archives || [], vendor), hover: null }),
          });
        }
        vendorRows.forEach((row, i) =>
          rows.push({
            ...row,
            group: i === 0,
            vendorLabel: MC.V[vendor].label,
            color: MC.V[vendor].color,
            vendorCount: models.filter((m) => m.vendor === vendor).length,
            canFocusVendor: s.vendors.length !== 1 || s.vendors[0] !== vendor,
            focusLabel: `只看 ${MC.V[vendor].label}`,
            focusVendor: () => set({ vendors: [vendor], hover: null }),
          }),
        );
      }
      const h = s.hover && MC.byId[s.hover.id];
      out.tl = {
        width: x(end),
        years,
        quarters,
        todayPx: x(today),
        rows,
        recent: range.mode !== "all",
        all: range.mode === "all",
        rangeLabel:
          range.mode === "all"
            ? "全部历史"
            : `${range.startDate} — ${range.endDate}`,
        showRecent: changeWindow("recent"),
        showAll: changeWindow("all"),
        rowCount: grouped.rows.length,
        lineCount: grouped.lineCount,
        archiveCount: grouped.archivedLineCount,
        visibleCount: models.length,
        pxPerYear: P,
        onZoom: (e) => set({ px: +e.target.value, autoScale: false }),
        panLeft: pan(-1),
        panRight: pan(1),
      };
      out.hover = h
        ? {
            m: h,
            x: s.hover.x,
            y: s.hover.y,
            caps: h.capLabels,
            bench: h.benchmarks.slice(0, 3),
            hasBench: h.benchmarks.length > 0,
            hasCaps: h.caps.length > 0,
          }
        : null;

      // —— 年表（纵向矩阵）
      const cols = MC.VENDORS.filter((v) => s.vendors.includes(v));
      const byMonth = {};
      models.forEach((m) => {
        (byMonth[m.month] = byMonth[m.month] || []).push(m);
      });
      const months = Object.keys(byMonth).sort().reverse();
      let prevY = null;
      out.chron = {
        cols: cols.map((v) => ({
          label: MC.V[v].label,
          color: MC.V[v].color,
          n: models.filter((m) => m.vendor === v).length,
        })),
        colsTemplate: "96px repeat(" + cols.length + ", minmax(0,1fr))",
        rows: months.map((k) => {
          const y = k.slice(0, 4);
          const head = y !== prevY;
          prevY = y;
          const list = byMonth[k];
          return {
            key: k,
            head,
            year: y,
            yearCount: models.filter((m) => m.date.startsWith(y)).length,
            month: k.slice(5) + " 月",
            mo: +k.slice(5),
            cells: cols.map((v) => ({
              color: MC.V[v].color,
              models: list
                .filter((m) => m.vendor === v)
                .map((m) => ({
                  ...m,
                  open: open(m.id),
                  day: m.date.length === 10 ? m.date.slice(8) : "",
                  capsText: m.capLabels.join(" · "),
                  moe: m.archType === "moe",
                })),
            })),
          };
        }),
      };
    }

    // —— 能力趋势
    if (s.view === "trends") {
      const pts = models
        .filter((m) => MC.bench(m, s.bench) != null)
        .map((m) => ({ m, t: m.t, v: MC.bench(m, s.bench) }))
        .sort((a, b) => a.t - b.t || b.v - a.v);
      const comparable = MC.comparable(models, s.bench, s.groups?.[s.bench]);
      const groups = MC.comparisonGroups(models, s.bench).map(
        ([name, members]) => ({
          name,
          count: members.length,
          on: name === comparable.name,
          pick: () => set({ groups: { ...(s.groups || {}), [s.bench]: name } }),
        }),
      );
      const comparableIds = new Set(comparable.models.map((m) => m.id));
      const comparablePts = pts.filter((p) => comparableIds.has(p.m.id));
      const step = (list) => {
        const f = [];
        let best = -1;
        list.forEach((p) => {
          if (p.v > best) {
            best = p.v;
            f.push(p);
          }
        });
        return f;
      };
      const fAll = step(comparablePts),
        fOpen = step(comparablePts.filter((p) => p.m.open_weights));
      const segsOf = (f, endT) => {
        const segs = [];
        f.forEach((p, i) => {
          const nx = f[i + 1];
          const x2 = pct(nx ? nx.t : endT);
          segs.push({
            left: pct(p.t),
            top: 100 - p.v,
            w: Math.max(0, x2 - pct(p.t)),
          });
          if (nx)
            segs.push({ left: x2, top: 100 - nx.v, h: nx.v - p.v, v: true });
        });
        return segs;
      };
      const endT = pts.length ? pts[pts.length - 1].t : T1;
      const fset = new Set(fAll.map((p) => p.m.id)),
        oset = new Set(fOpen.map((p) => p.m.id));
      const bestClosed = Math.max(
          -1,
          ...comparablePts.filter((p) => !p.m.open_weights).map((p) => p.v),
        ),
        bestOpen = Math.max(
          -1,
          ...comparablePts.filter((p) => p.m.open_weights).map((p) => p.v),
        );
      out.trend = {
        bench: s.bench,
        groups,
        hasGroups: groups.length > 0,
        tabs: MC.BENCH.map((b) => ({
          label: b,
          on: b === s.bench,
          n: models.filter((m) => MC.bench(m, b) != null).length,
          pick: () => set({ bench: b }),
        })),
        points: pts.map((p) => ({
          left: pct(p.t),
          top: 100 - p.v,
          bottom: p.v,
          color: p.m.color,
          open: p.m.open_weights,
          name: p.m.name,
          score: p.v,
          date: p.m.date,
          frontier: fset.has(p.m.id),
          openFrontier: oset.has(p.m.id) && !fset.has(p.m.id),
          label: fset.has(p.m.id) || oset.has(p.m.id),
          go: open(p.m.id),
        })),
        hAll: segsOf(fAll, endT).filter((x) => !x.v),
        vAll: segsOf(fAll, endT).filter((x) => x.v),
        hOpen: segsOf(fOpen, endT).filter((x) => !x.v),
        vOpen: segsOf(fOpen, endT).filter((x) => x.v),
        yTicks: [0, 20, 40, 60, 80, 100].map((v) => ({ v, top: 100 - v })),
        xTicks,
        count: pts.length,
        comparisonGroup: comparable.name || "暂无同条件对照组",
        comparableCount: comparablePts.length,
        bestAll: fAll.length ? fAll[fAll.length - 1].v : "—",
        bestClosed: bestClosed < 0 ? "—" : bestClosed,
        bestOpen: bestOpen < 0 ? "—" : bestOpen,
        gap:
          bestClosed < 0 || bestOpen < 0
            ? "—"
            : (bestClosed - bestOpen).toFixed(1),
        leader: fAll.length ? fAll[fAll.length - 1].m.name : "—",
        openLeader: fOpen.length ? fOpen[fOpen.length - 1].m.name : "—",
      };
    }

    // —— 架构演进
    if (s.view === "arch") {
      const known = models
        .filter((m) => m.arch && m.arch.total)
        .sort((a, b) => a.t - b.t);
      const LABEL = new Set([
        "llama-65b",
        "llama-2-70b",
        "llama-3-1-405b",
        "llama-4-maverick",
        "llama-4-behemoth",
        "llama-4-scout",
        "deepseek-v2",
        "deepseek-v3",
        "qwen3-235b-a22b",
        "qwen3-coder-480b",
        "gpt-oss-120b",
        "gemma-3-27b",
        "llama-7b",
        "gpt-oss-20b",
      ]);
      out.arch = {
        points: known.map((m) => {
          const a = m.arch,
            moe = a.type === "moe" && !!a.active;
          return {
            left: pct(m.t),
            top: logTop(a.total),
            activeTop: moe ? logTop(a.active) : logTop(a.total),
            barH: moe ? logTop(a.active) - logTop(a.total) : 0,
            moe,
            color: m.color,
            name: m.name,
            label: LABEL.has(m.id),
            params: m.paramsLabel,
            go: open(m.id),
          };
        }),
        yTicks: [1, 3, 10, 30, 100, 300, 1000, 3000].map((v) => ({
          label: v >= 1000 ? v / 1000 + "T" : v + "B",
          top: logTop(v),
        })),
        xTicks,
        attn: ["MHA", "GQA", "MLA"].map((k) => ({
          k,
          name:
            k === "MHA" ? "多头注意力" : k === "GQA" ? "分组查询" : "多头潜在",
          dots: known
            .filter((m) => m.arch.attn === k)
            .map((m) => ({
              left: pct(m.t),
              color: m.color,
              title: m.name,
              go: open(m.id),
            })),
        })),
        moeCount: known.filter((m) => m.arch.type === "moe").length,
        denseCount: known.filter((m) => m.arch.type === "dense").length,
        closedCount: models.filter((m) => !m.arch).length,
        table: known
          .slice()
          .reverse()
          .map((m) => {
            const a = m.arch,
              moe = a.type === "moe";
            return {
              name: m.name,
              color: m.color,
              date: m.date,
              type: moe ? "MoE" : "Dense",
              moe,
              total: MC.fmtParams(a.total),
              active: moe ? MC.fmtParams(a.active) : "—",
              layers: a.layers || "—",
              attn: a.attn || "—",
              experts:
                moe && a.experts
                  ? a.experts +
                    (a.topk ? "/" + a.topk : "") +
                    (a.shared ? "+" + a.shared : "")
                  : "—",
              tokens: a.tokens ? a.tokens + "T" : "—",
              ctx: m.ctxLabel,
              go: open(m.id),
            };
          }),
      };
    }

    // —— 详情
    if (s.view === "detail" && s.id) {
      const m = MC.byId[s.id],
        p = m.prev,
        n = m.next;
      const lineModels = MC.models.filter(
        (x) =>
          x.vendor === m.vendor && x.family === m.family && x.tier === m.tier,
      );
      const num = (label, c, pv, f, hi) => {
        const value = c == null ? "未公开" : f(c);
        if (c == null || pv == null || pv === 0)
          return { label, value, delta: "", tone: "none" };
        if (c === pv) return { label, value, delta: "持平", tone: "none" };
        const r = c / pv;
        const delta =
          r >= 2 || r <= 0.5
            ? "×" + r.toFixed(r < 1 ? 2 : 1)
            : (r > 1 ? "+" : "") + Math.round((r - 1) * 100) + "%";
        return {
          label,
          value,
          delta,
          tone: (hi ? r > 1 : r < 1) ? "up" : "down",
        };
      };
      const ps = p && p.specs;
      const specRows = [
        num(
          "上下文窗口",
          m.specs.context_window,
          ps && ps.context_window,
          MC.fmtTokens,
          true,
        ),
        num(
          "输入价格 / 百万 token",
          m.specs.pricing.input_per_mtok,
          ps && ps.pricing.input_per_mtok,
          (v) => "$" + v,
          false,
        ),
        num(
          "输出价格 / 百万 token",
          m.specs.pricing.output_per_mtok,
          ps && ps.pricing.output_per_mtok,
          (v) => "$" + v,
          false,
        ),
        num("参数量", m.specs.params_b, ps && ps.params_b, MC.fmtParams, true),
        {
          label: "知识截止",
          value: m.specs.knowledge_cutoff || "未公开",
          delta: "",
          tone: "none",
        },
        {
          label: "输入模态",
          value: m.specs.modalities_in.join(" / "),
          delta: "",
          tone: "none",
        },
      ];
      specRows.forEach((r) => {
        r.color =
          r.tone === "up"
            ? opts.up || "#1d8a5f"
            : r.tone === "down"
              ? opts.down || "#c2463d"
              : opts.muted || "#7a7a74";
      });
      const benchRows = m.benchmarks.map((b) => {
        const prior = p ? MC.benchRecord(p, b.name) : null;
        const pb =
          prior &&
          b.comparison_group &&
          b.comparison_group === prior.comparison_group
            ? prior.score
            : null;
        const ev = b.evaluation,
          conditions = ev
            ? [
                ev.benchmark_version,
                ev.tools === undefined
                  ? null
                  : ev.tools
                    ? "用工具"
                    : "不用工具",
                ev.reasoning_effort ? "推理 " + ev.reasoning_effort : null,
                ev.harness || "评测框架未记录",
              ]
                .filter(Boolean)
                .join(" · ")
            : "评测条件未核实";
        return {
          name: b.name,
          score: b.score,
          w: b.score,
          prevW: pb == null ? 0 : pb,
          hasPrev: pb != null,
          prevScore: pb,
          delta:
            pb == null
              ? ""
              : (b.score >= pb ? "+" : "") + (b.score - pb).toFixed(1),
          color:
            pb == null
              ? opts.muted || "#7a7a74"
              : b.score >= pb
                ? opts.up || "#1d8a5f"
                : opts.down || "#c2463d",
          by: b.reported_by === "vendor" ? "厂商自报" : "第三方",
          evaluation: conditions,
        };
      });
      const diag = MC.archDiagram(m);
      const priceHistory = m.price_history || [];

      out.d = {
        m,
        diag,
        hasDiag: !!diag,
        noDiag: !diag,
        benchRows,
        hasBench: benchRows.length > 0,
        noBench: benchRows.length === 0,
        specRows,
        caps: m.capLabels,
        hasCaps: m.caps.length > 0,
        priceHistory: priceHistory.map((p) => ({
          ...p,
          inputLabel: "$" + p.input_per_mtok,
          outputLabel: "$" + p.output_per_mtok,
        })),
        hasPriceHistory: priceHistory.length > 0,
        facts: [
          [m.dateLabel, m.date],
          ["架构", m.archLabel],
          ["参数", m.paramsLabel],
          ["上下文", m.ctxLabel],
          [
            "发布价 入/出",
            m.specs.pricing.input_per_mtok == null
              ? "—"
              : "$" +
                m.specs.pricing.input_per_mtok +
                " / $" +
                m.specs.pricing.output_per_mtok,
          ],
        ].map(([k, v]) => ({ k, v })),
        prev: p
          ? {
              name: p.name,
              gap:
                p.dateKind === "ga" && m.dateKind === "ga"
                  ? MC.fmtGap(p.date, m.date)
                  : "日期口径不同，暂不计算",
              go: open(p.id),
            }
          : null,
        next: n
          ? {
              name: n.name,
              gap:
                m.dateKind === "ga" && n.dateKind === "ga"
                  ? MC.fmtGap(m.date, n.date)
                  : "日期口径不同，暂不计算",
              go: open(n.id),
            }
          : null,
        noPrev: !p,
        noNext: !n,
        cmp: p ? "对比 " + p.name : "",
        life: [
          ["announced", "宣布"],
          ["ga", "正式可用"],
          ["deprecated", "弃用"],
          ["retired", "下线"],
        ].map(([k, label]) => ({
          label,
          d: m.dates[k] || "—",
          done: !!m.dates[k],
        })),
        line: lineModels.map((x) => ({
          gen: x.generation,
          name: x.name,
          date: x.date,
          cur: x.id === m.id,
          go: open(x.id),
        })),
        lineLabel: m.family + " · " + m.tierLabel,
        sources: m.sources,
        hasSources: m.sources.length > 0,
        staticUrl: `./model/${m.id}.html`,
        back: go("timeline"),
      };
    }
    return out;
  }
  MC.initState = initState;
  MC.vm = vm;
})();
