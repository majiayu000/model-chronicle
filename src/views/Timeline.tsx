import { useState } from "react";
import type { Model } from "../lib/schema";
import { buildLines } from "../lib/lines";
import { releaseDate, toTime, todayISO } from "../lib/intervals";
import { VENDOR_META } from "../lib/vendors";
import { Lane } from "../components/Lane";

const YEAR_MS = 365.25 * 86_400_000;

export function Timeline({ models }: { models: Model[] }) {
  const [pxPerYear, setPxPerYear] = useState(320);
  if (models.length === 0) return null;

  const today = todayISO();
  const firstYear = Math.min(...models.map((m) => new Date(toTime(releaseDate(m))).getUTCFullYear()));
  const start = Date.UTC(firstYear, 0, 1);
  const end = toTime(today) + YEAR_MS / 6;
  const x = (t: number) => ((t - start) / YEAR_MS) * pxPerYear;
  const width = x(end);
  const years = Array.from({ length: new Date(end).getUTCFullYear() - firstYear + 1 }, (_, i) => firstYear + i);
  const lines = buildLines(models);

  return (
    <section>
      <div className="toolbar">
        <label>
          缩放
          <input
            type="range"
            min={160}
            max={1200}
            step={20}
            value={pxPerYear}
            onChange={(e) => setPxPerYear(Number(e.target.value))}
          />
        </label>
        <span className="hint">每条线是同一厂商、同一产品线、同一档位的继任关系；线上数字为距前代的间隔，末端虚线为距今天数</span>
      </div>
      <div className="timeline">
        <div className="row axis">
          <div className="lane-label" />
          <div className="track" style={{ width }}>
            {years.map((y) => (
              <span key={y} className="year" style={{ left: x(Date.UTC(y, 0, 1)) }}>{y}</span>
            ))}
            <span className="today" style={{ left: x(toTime(today)) }}>今天</span>
          </div>
        </div>
        {lines.map((line, i) => (
          <div key={line.key}>
            {(i === 0 || lines[i - 1].vendor !== line.vendor) && (
              <div className="row group">
                <div className="lane-label" style={{ color: VENDOR_META[line.vendor].color }}>
                  {VENDOR_META[line.vendor].label}
                </div>
                <div className="track" style={{ width }} />
              </div>
            )}
            <Lane line={line} x={x} width={width} today={today} years={years} />
          </div>
        ))}
      </div>
    </section>
  );
}
