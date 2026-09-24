import { formatGap, type Succession } from "../lib/intervals";
import { href } from "../lib/router";

interface Props {
  successions: Succession[];
  maxDays: number;
  color: string;
}

export function GapBars({ successions, maxDays, color }: Props) {
  return (
    <div className="bars">
      {successions.map((s) => {
        const days = s.gap.kind === "exact" ? s.gap.days : s.gap.months * 30;
        return (
          <div key={s.to.id} className="bar-row">
            <a className="bar-label" href={href.model(s.to.id)}>
              {s.from.generation} → {s.to.generation}
            </a>
            <div className="bar-track">
              <span
                className={`bar ${s.gap.kind === "approx" ? "approx" : ""}`}
                style={{ width: `${(days / maxDays) * 100}%`, background: color }}
              />
            </div>
            <span className="bar-value">{formatGap(s.gap)}</span>
          </div>
        );
      })}
    </div>
  );
}
