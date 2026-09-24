import type { Model } from "../lib/schema";
import { formatGap, gapBetween, releaseDate, successorOf } from "../lib/intervals";
import { benchRows, specRows } from "../lib/diff";
import { href } from "../lib/router";
import { TIER_LABEL, VENDOR_META } from "../lib/vendors";
import { Lifecycle } from "../components/Lifecycle";

export function ModelDetail({ id, models }: { id: string; models: Model[] }) {
  const m = models.find((x) => x.id === id);
  if (!m) return <p className="empty">找不到模型 “{id}”。<a href={href.timeline}>返回时间轴</a></p>;

  const prev = m.predecessor ? (models.find((x) => x.id === m.predecessor) ?? null) : null;
  const next = successorOf(m, models);
  const color = VENDOR_META[m.vendor].color;

  return (
    <article className="detail">
      <a className="back" href={href.timeline}>← 时间轴</a>
      <h1>{m.name}</h1>
      <div className="tags">
        <span className="tag" style={{ borderColor: color, color }}>{VENDOR_META[m.vendor].label}</span>
        <span className="tag">{m.family}</span>
        <span className="tag">{TIER_LABEL[m.tier]}</span>
        {m.open_weights && <span className="tag">开源权重</span>}
      </div>

      <div className="succession">
        <div>
          <div className="muted">同档前代</div>
          {prev ? (
            <a href={href.model(prev.id)}>
              {prev.name}（间隔 {formatGap(gapBetween(releaseDate(prev), releaseDate(m)))}）
            </a>
          ) : (
            <span>无（该线第一个模型）</span>
          )}
        </div>
        <div>
          <div className="muted">同档后继</div>
          {next ? (
            <a href={href.model(next.id)}>
              {next.name}（间隔 {formatGap(gapBetween(releaseDate(m), releaseDate(next)))}）
            </a>
          ) : (
            <span>暂无</span>
          )}
        </div>
      </div>

      <h2>生命周期</h2>
      <Lifecycle model={m} />

      {m.highlights.length > 0 && (
        <>
          <h2>关键变化</h2>
          <ul>{m.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        </>
      )}

      <h2>规格{prev && <span className="muted"> · 对比 {prev.name}</span>}</h2>
      <table>
        <tbody>
          {specRows(m, prev).map((r) => (
            <tr key={r.label}>
              <td className="muted">{r.label}</td>
              <td>{r.value}</td>
              <td className={r.better === null ? "muted" : r.better ? "up" : "down"}>{r.delta ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>基准测试</h2>
      {m.benchmarks.length === 0 ? (
        <p className="muted">暂无已核实的基准数据</p>
      ) : (
        <table>
          <tbody>
            {benchRows(m, prev).map((b) => (
              <tr key={`${b.name}-${b.reportedBy}`}>
                <td>{b.name}</td>
                <td>{b.score}</td>
                <td className={b.prevScore === null ? "muted" : b.score >= b.prevScore ? "up" : "down"}>
                  {b.prevScore === null ? "" : `${b.score >= b.prevScore ? "+" : ""}${(b.score - b.prevScore).toFixed(1)}`}
                </td>
                <td>
                  <a href={b.source} target="_blank" rel="noreferrer" className="muted">
                    {b.reportedBy === "vendor" ? "厂商自报" : "第三方"}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>来源</h2>
      <ul className="sources">
        {m.sources.map((s) => (
          <li key={s}><a href={s} target="_blank" rel="noreferrer">{s}</a></li>
        ))}
      </ul>
      <p className="muted">最后核实：{m.verified_at}</p>
    </article>
  );
}
