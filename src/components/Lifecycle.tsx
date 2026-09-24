import type { Model } from "../lib/schema";

const STAGES = [
  ["announced", "宣布"],
  ["ga", "正式可用"],
  ["deprecated", "弃用"],
  ["retired", "下线"],
] as const;

export function Lifecycle({ model }: { model: Model }) {
  return (
    <ol className="lifecycle">
      {STAGES.map(([key, label]) => {
        const d = model.dates[key];
        return (
          <li key={key} className={d ? "done" : ""}>
            <span className="stage">{label}</span>
            <span className="date">{d ?? "—"}</span>
          </li>
        );
      })}
    </ol>
  );
}
