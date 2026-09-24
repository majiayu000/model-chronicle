import { useState } from "react";
import { MODELS } from "./lib/data";
import { TIERS, VENDORS } from "./lib/constants";
import { applyFilters, type Filters } from "./lib/filters";
import { href, useRoute } from "./lib/router";
import { FilterBar } from "./components/FilterBar";
import { Timeline } from "./views/Timeline";
import { Intervals } from "./views/Intervals";
import { ModelDetail } from "./views/ModelDetail";

export function App() {
  const route = useRoute();
  const [filters, setFilters] = useState<Filters>({
    vendors: new Set(VENDORS),
    tiers: new Set(TIERS),
    openWeightsOnly: false,
  });
  const visible = applyFilters(MODELS, filters);

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href={href.timeline}>模型编年史</a>
        <nav>
          <a className={route.name === "timeline" ? "on" : ""} href={href.timeline}>时间轴</a>
          <a className={route.name === "intervals" ? "on" : ""} href={href.intervals}>间隔分析</a>
        </nav>
        <span className="count">收录 {MODELS.length} 个模型</span>
      </header>
      {route.name !== "model" && <FilterBar filters={filters} onChange={setFilters} />}
      <main>
        {MODELS.length === 0 && <p className="empty">暂无数据。向 data/models/ 添加 YAML 后重新运行 bun run data。</p>}
        {route.name === "timeline" && <Timeline models={visible} />}
        {route.name === "intervals" && <Intervals models={visible} />}
        {route.name === "model" && <ModelDetail id={route.id} models={MODELS} />}
      </main>
    </div>
  );
}
