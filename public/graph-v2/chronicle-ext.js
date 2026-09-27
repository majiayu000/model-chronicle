// 扩展视图：开源追赶、能力成本、在役状态
(function init() {
  if (!window.MC || !window.MC.models) return setTimeout(init, 20);
  const MC = window.MC,
    DAY = 864e5;
  const startYear = Math.min(2023, ...MC.models.map((m) => m.year)),
    endYear = Number(MC.today.slice(0, 4));
  const T0 = Date.UTC(startYear, 0, 1),
    T1 = Date.UTC(endYear + 1, 0, 1);
  const pct = (t) => Math.max(0, Math.min(100, ((t - T0) / (T1 - T0)) * 100));
  const TODAY = MC.toTime(MC.today),
    todayPct = pct(TODAY);
  const days = (a, b) => Math.round((b - a) / DAY);
  const median = (a) => {
    if (!a.length) return null;
    const s = a.slice().sort((x, y) => x - y),
      h = s.length >> 1;
    return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2);
  };
  const xTicks = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const y = startYear + i;
    return { y, left: pct(Date.UTC(y, 0, 1)) };
  });

  const DEF_THR = {
    "GPQA Diamond": 60,
    MMLU: 80,
    "MMLU-Pro": 70,
    "SWE-bench Verified": 50,
    "AIME 2024": 70,
    "AIME 2025": 80,
    MMMU: 60,
    HumanEval: 85,
  };
  const blend = (m) => {
    const p = m.specs.pricing;
    return p.input_per_mtok == null || p.output_per_mtok == null
      ? null
      : (3 * p.input_per_mtok + p.output_per_mtok) / 4;
  };
  const fmt$ = (p) =>
    p == null
      ? "—"
      : "$" +
        (p < 0.1
          ? p.toFixed(3)
          : p < 10
            ? p.toFixed(2)
            : Math.round(p * 10) / 10);
  const logTop = (p) =>
    Math.max(0, Math.min(100, (1 - (Math.log10(p) + 2) / 4) * 100));

  function ext(s, set) {
    const MC = window.MC;
    const pass = (m) =>
      s.vendors.includes(m.vendor) &&
      s.tiers.includes(m.tier) &&
      s.caps.every((c) => (c === "open" ? m.open_weights : m.caps.includes(c)));
    const models = MC.models.filter(pass);
    const open = (id) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      set({ view: "detail", id, hover: null });
      window.scrollTo(0, 0);
    };
    const tabs = () =>
      MC.BENCH.map((b) => ({
        label: b,
        on: b === s.bench,
        n: models.filter((m) => MC.bench(m, b) != null).length,
        pick: () => set({ bench: b }),
      }));
    const groupTabs = () =>
      MC.comparisonGroups(models, s.bench).map(([name, members]) => ({
        name,
        count: members.length,
        on: name === MC.comparable(models, s.bench, s.groups?.[s.bench]).name,
        pick: () => set({ groups: { ...(s.groups || {}), [s.bench]: name } }),
      }));
    const out = {
      isCatchup: s.view === "catchup",
      isCost: s.view === "cost",
      isLife: s.view === "life",
    };

    if (out.isCatchup) {
      const comparable = MC.comparable(models, s.bench, s.groups?.[s.bench]);
      const pts = comparable.models
        .map((m) => ({ m, t: m.t, v: MC.bench(m, s.bench) }))
        .sort((a, b) => a.t - b.t || b.v - a.v);
      const openPts = pts.filter((p) => p.m.open_weights),
        fr = [];
      let best = -1;
      pts
        .filter((p) => !p.m.open_weights)
        .forEach((p) => {
          if (p.v > best) {
            best = p.v;
            fr.push(p);
          }
        });
      const rows = fr.map((c) => {
        const o = openPts.find((p) => p.v >= c.v),
          led = !!o && o.t <= c.t,
          matched = !!o && !led;
        const L = pct(c.t),
          R = matched ? pct(o.t) : o ? L : todayPct,
          lag = matched ? days(c.t, o.t) : days(c.t, TODAY);
        return {
          name: c.m.name,
          color: c.m.color,
          date: c.m.date,
          score: c.v,
          left: L,
          right: R,
          w: R - L,
          mid: (L + R) / 2,
          matched,
          led,
          pending: !o,
          lag,
          oT: o ? o.t : 0,
          lagLabel: matched ? lag + " 天" : "已 " + lag + " 天",
          openName: o ? o.m.name : "",
          openScore: o ? o.v : "",
          nameTf: R > 70 ? "translateX(-100%)" : "none",
          go: open(c.m.id),
          goOpen: o ? open(o.m.id) : null,
        };
      });
      const m = rows.filter((r) => r.matched),
        latest = m.slice().sort((a, b) => b.oT - a.oT)[0],
        pend = rows.find((r) => r.pending);
      const med = median(m.map((r) => r.lag));
      const bestOpen = Math.max(-1, ...openPts.map((p) => p.v));
      out.cu = {
        tabs: tabs(),
        groups: groupTabs(),
        bench: s.bench,
        rows,
        xTicks,
        todayPct,
        count: rows.length,
        empty: rows.length === 0,
        comparisonGroup: comparable.name || "暂无同条件对照组",
        median: med == null ? "—" : med + " 天",
        medianSub: m.length + " 次追平闭源纪录",
        latest: latest ? latest.lag + " 天" : "—",
        latestSub: latest ? latest.openName + " 追平 " + latest.name : "暂无",
        pendingDays: pend ? pend.lag + " 天" : comparable.name ? "0" : "—",
        pendingSub: pend
          ? "自 " +
            pend.name +
            "（" +
            pend.score +
            "）起，开源最高 " +
            (bestOpen < 0 ? "—" : bestOpen)
          : comparable.name
            ? "开源已追平全部闭源纪录"
            : "缺少可比评测条件",
      };
    }

    if (out.isCost) {
      const thr = (s.thr && s.thr[s.bench]) ?? DEF_THR[s.bench];
      const comparable = MC.comparable(models, s.bench, s.groups?.[s.bench]);
      const scored = comparable.models;
      const pts = scored
        .filter((m) => blend(m) != null)
        .map((m) => ({ m, t: m.t, v: MC.bench(m, s.bench), p: blend(m) }))
        .sort((a, b) => a.t - b.t || a.p - b.p);
      const q = pts.filter((x) => x.v >= thr),
        fr = [];
      let min = Infinity;
      q.forEach((x) => {
        if (x.p < min) {
          min = x.p;
          fr.push(x);
        }
      });
      const frSet = new Set(fr.map((x) => x.m.id));
      const hSeg = fr.map((x, i) => {
        const t2 = fr[i + 1] ? fr[i + 1].t : TODAY;
        return { left: pct(x.t), top: logTop(x.p), w: pct(t2) - pct(x.t) };
      });
      const vSeg = fr.slice(1).map((x, i) => ({
        left: pct(x.t),
        top: logTop(fr[i].p),
        h: logTop(x.p) - logTop(fr[i].p),
      }));
      const first = fr[0],
        last = fr[fr.length - 1],
        drop = first && last ? first.p / last.p : null;
      out.co = {
        tabs: tabs(),
        groups: groupTabs(),
        bench: s.bench,
        thr,
        min: 20,
        max: 95,
        comparisonGroup: comparable.name || "暂无同条件对照组",
        onThr: (e) =>
          set({ thr: { ...(s.thr || {}), [s.bench]: +e.target.value } }),
        points: pts.map((x) => {
          const ok = x.v >= thr,
            f = frSet.has(x.m.id);
          return {
            left: pct(x.t),
            top: logTop(x.p),
            fill: ok ? x.m.color : "transparent",
            bd: ok ? x.m.color : "#33363c",
            size: f ? 13 : 9,
            z: f ? 3 : ok ? 2 : 1,
            label: f,
            name: x.m.name,
            price: fmt$(x.p),
            tip: x.m.name + " · " + x.v + " · " + fmt$(x.p),
            go: open(x.m.id),
          };
        }),
        hSeg,
        vSeg,
        xTicks,
        todayPct,
        yTicks: [100, 10, 1, 0.1, 0.01].map((v) => ({
          label: "$" + v,
          top: logTop(v),
        })),
        count: pts.length,
        qCount: q.length,
        empty: q.length === 0,
        firstPrice: first ? fmt$(first.p) : "—",
        firstSub: first
          ? first.m.name + " · " + first.m.date
          : "暂无可比且有价格的达标模型",
        bestPrice: last ? fmt$(last.p) : "—",
        bestSub: last ? last.m.name + " · " + last.m.date : "—",
        drop:
          drop && drop > 1
            ? "×" + (drop >= 10 ? Math.round(drop) : drop.toFixed(1))
            : "—",
        dropSub:
          drop && drop > 1
            ? "用时 " + days(first.t, last.t) + " 天"
            : first
              ? "尚无更便宜的达标模型"
              : "暂无可比降幅",
        table: q
          .slice()
          .sort((a, b) => a.p - b.p)
          .slice(0, 10)
          .map((x) => ({
            name: x.m.name,
            color: x.m.color,
            date: x.m.date,
            score: x.v,
            pin: fmt$(x.m.specs.pricing.input_per_mtok),
            pout: fmt$(x.m.specs.pricing.output_per_mtok),
            blend: fmt$(x.p),
            fg: frSet.has(x.m.id) ? "#d4f53c" : "#ecebe6",
            go: open(x.m.id),
          })),
        excluded:
          models.filter((m) => MC.bench(m, s.bench) != null).length -
          pts.length,
      };
    }

    if (out.isLife) {
      const T = (d) => (d ? MC.toTime(d) : null);
      const st = (m) => {
        const r = T(m.dates.retired),
          d = T(m.dates.deprecated);
        return r != null && r <= TODAY
          ? "retired"
          : d != null && d <= TODAY
            ? "deprecated"
            : "unknown";
      };
      const ST = {
        unknown: ["状态未核实", "#9a9ca3"],
        deprecated: ["弃用中", "#ff6b5b"],
        retired: ["已下线", "#858892"],
      };
      const mode = s.lifeMode || "all";
      const counts = {
        all: models.length,
        unknown: 0,
        deprecated: 0,
        retired: 0,
      };
      models.forEach((m) => counts[st(m)]++);
      const served = models
        .filter((m) => st(m) === "retired")
        .map((m) => days(m.t, T(m.dates.retired)));
      const rows = [];
      let lastV = null;
      MC.VENDORS.forEach((v) =>
        models
          .filter((m) => m.vendor === v && (mode === "all" || st(m) === mode))
          .sort((a, b) => a.t - b.t)
          .forEach((m) => {
            const k = st(m),
              r = T(m.dates.retired),
              d = T(m.dates.deprecated),
              end = k === "retired" ? r : k === "unknown" ? m.t : TODAY;
            const depStart = d != null && d <= TODAY ? d : null,
              liveEnd = depStart ?? end;
            rows.push({
              group: v !== lastV,
              vendorLabel: MC.V[v].label,
              vendorCount: models.filter((x) => x.vendor === v).length,
              color: m.color,
              name: m.name,
              stLabel: ST[k][0],
              stColor: ST[k][1],
              left: pct(m.t),
              liveW: Math.max(0.3, pct(liveEnd) - pct(m.t)),
              liveBg: k === "unknown" || k === "retired" ? "#858892" : m.color,
              hasDep: depStart != null,
              depLeft: pct(depStart || 0),
              depW: pct(end) - pct(depStart || 0),
              isRetired: k === "retired",
              endLeft: pct(end),
              hasSched: r != null && r > TODAY,
              schedLeft: todayPct,
              schedW: pct(r || 0) - todayPct,
              schedAt: pct(r || 0),
              go: open(m.id),
            });
            lastV = v;
          }),
      );
      const upcoming = models
        .filter((m) => T(m.dates.retired) > TODAY)
        .sort((a, b) => T(a.dates.retired) - T(b.dates.retired))
        .map((m) => ({
          name: m.name,
          color: m.color,
          dep: m.dates.deprecated || "—",
          ret: m.dates.retired,
          left: days(TODAY, T(m.dates.retired)) + " 天",
          hasNext: !!m.next,
          noNext: !m.next,
          nextName: m.next ? m.next.name : "",
          goNext: m.next ? open(m.next.id) : null,
          go: open(m.id),
        }));
      out.li = {
        rows,
        upcoming,
        hasUpcoming: upcoming.length > 0,
        noUpcoming: upcoming.length === 0,
        xTicks,
        todayPct,
        empty: rows.length === 0,
        unknown: counts.unknown,
        deprecated: counts.deprecated,
        retired: counts.retired,
        served: served.length ? median(served) + " 天" : "—",
        servedSub: served.length + " 个已下线模型，发布到下线的中位数",
        modes: [
          ["all", "全部"],
          ["unknown", "未核实"],
          ["deprecated", "弃用中"],
          ["retired", "已下线"],
        ].map(([k, label]) => ({
          label,
          n: counts[k],
          on: mode === k,
          pick: () => set({ lifeMode: k }),
        })),
      };
    }
    return out;
  }
  MC.ext = ext;
})();
