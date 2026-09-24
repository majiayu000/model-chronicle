import type { Model } from "../lib/schema";
import { VENDORS } from "../lib/constants";
import { buildLines } from "../lib/lines";
import { formatGap, gapBetween, medianDays, releaseDate, successions, todayISO, vendorCadence, byRelease } from "../lib/intervals";
import { TIER_LABEL, VENDOR_META } from "../lib/vendors";
import { GapBars } from "../components/GapBars";

export function Intervals({ models }: { models: Model[] }) {
  if (models.length === 0) return null;
  const today = todayISO();
  const lines = buildLines(models).filter((l) => l.models.length > 1);
  const all = successions(models);
  const maxDays = Math.max(1, ...all.map((s) => (s.gap.kind === "exact" ? s.gap.days : s.gap.months * 30)));

  return (
    <section>
      <h2>厂商发布节奏</h2>
      <div className="cards">
        {VENDORS.map((v) => {
          const vm = models.filter((m) => m.vendor === v).sort(byRelease);
          if (vm.length === 0) return null;
          const median = medianDays(vendorCadence(vm));
          const last = vm[vm.length - 1];
          return (
            <div key={v} className="card">
              <div className="card-title" style={{ color: VENDOR_META[v].color }}>{VENDOR_META[v].label}</div>
              <div className="metric">{median === null ? "—" : `${median} 天`}</div>
              <div className="muted">发布间隔中位数</div>
              <div className="muted">距上次发布（{last.name}）已 {formatGap(gapBetween(releaseDate(last), today))}</div>
            </div>
          );
        })}
      </div>

      <h2>同档位继任间隔</h2>
      {lines.length === 0 && <p className="muted">当前筛选下没有包含两个以上模型的继任线</p>}
      {lines.map((line) => {
        const ss = all.filter((s) => line.models.includes(s.to));
        const median = medianDays(ss.map((s) => s.gap));
        return (
          <div key={line.key} className="line-block">
            <div className="line-head">
              <span style={{ color: VENDOR_META[line.vendor].color }}>{VENDOR_META[line.vendor].label}</span>
              <span>{line.family} · {TIER_LABEL[line.tier]}</span>
              <span className="muted">中位数 {median === null ? "—" : `${median} 天`}</span>
            </div>
            <GapBars successions={ss} maxDays={maxDays} color={VENDOR_META[line.vendor].color} />
          </div>
        );
      })}
    </section>
  );
}
