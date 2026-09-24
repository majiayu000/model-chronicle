import type { Line } from "../lib/lines";
import { formatGap, gapBetween, releaseDate, toTime } from "../lib/intervals";
import { href } from "../lib/router";
import { TIER_LABEL, VENDOR_META } from "../lib/vendors";

interface Props {
  line: Line;
  x: (t: number) => number;
  width: number;
  today: string;
  years: number[];
}

const MIN_LABEL_PX = 44;

export function Lane({ line, x, width, today, years }: Props) {
  const color = VENDOR_META[line.vendor].color;
  const pts = line.models.map((m) => ({ m, date: releaseDate(m), px: x(toTime(releaseDate(m))) }));
  const last = pts[pts.length - 1];
  const todayPx = x(toTime(today));
  const retired = last.m.dates.retired !== null;

  return (
    <div className="row lane">
      <div className="lane-label">
        {line.family} · {TIER_LABEL[line.tier]}
      </div>
      <div className="track" style={{ width }}>
        {years.map((y) => (
          <span key={y} className="grid" style={{ left: x(Date.UTC(y, 0, 1)) }} />
        ))}
        {pts.slice(1).map((p, i) => {
          const prev = pts[i];
          const w = p.px - prev.px;
          return (
            <div key={p.m.id}>
              <span className="seg" style={{ left: prev.px, width: w, background: color }} />
              {w >= MIN_LABEL_PX && (
                <span className="gap" style={{ left: prev.px + w / 2 }}>
                  {formatGap(gapBetween(prev.date, p.date))}
                </span>
              )}
            </div>
          );
        })}
        {!retired && todayPx - last.px >= MIN_LABEL_PX && (
          <>
            <span className="seg pending" style={{ left: last.px, width: todayPx - last.px, borderColor: color }} />
            <span className="gap pending" style={{ left: last.px + (todayPx - last.px) / 2 }}>
              已 {formatGap(gapBetween(last.date, today))}
            </span>
          </>
        )}
        {pts.map((p) => (
          <a
            key={p.m.id}
            className={`dot ${p.m.dates.retired ? "retired" : ""}`}
            href={href.model(p.m.id)}
            style={{ left: p.px, background: color }}
            title={`${p.m.name}\n${p.date}`}
          >
            <span className="dot-label">{p.m.generation}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
