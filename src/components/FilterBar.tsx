import { TIERS, VENDORS } from "../lib/constants";
import { toggle, type Filters } from "../lib/filters";
import { TIER_LABEL, VENDOR_META } from "../lib/vendors";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterBar({ filters, onChange }: Props) {
  return (
    <div className="filters">
      <div className="chips">
        {VENDORS.map((v) => (
          <button
            key={v}
            className={`chip ${filters.vendors.has(v) ? "on" : ""}`}
            onClick={() => onChange({ ...filters, vendors: toggle(filters.vendors, v) })}
          >
            <span className="swatch" style={{ background: VENDOR_META[v].color }} />
            {VENDOR_META[v].label}
          </button>
        ))}
      </div>
      <div className="chips">
        {TIERS.map((t) => (
          <button
            key={t}
            className={`chip ${filters.tiers.has(t) ? "on" : ""}`}
            onClick={() => onChange({ ...filters, tiers: toggle(filters.tiers, t) })}
          >
            {TIER_LABEL[t]}
          </button>
        ))}
        <button
          className={`chip ${filters.openWeightsOnly ? "on" : ""}`}
          onClick={() => onChange({ ...filters, openWeightsOnly: !filters.openWeightsOnly })}
        >
          仅开源权重
        </button>
      </div>
    </div>
  );
}
