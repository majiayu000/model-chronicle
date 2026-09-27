import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it } from "vitest";

function render(history) {
  const window = { React: { createElement: (tag, props, ...children) => ({ tag, props, children }) } };
  runInContext(readFileSync(new URL("../public/graph-v2/price-chart.js", import.meta.url), "utf8"), createContext({ window }));
  return window.ChroniclePriceChart({ history });
}

describe("price history chart", () => {
  it("renders no chart for unknown prices", () => expect(render([])).toBeNull());
  it("renders two finite paths and four dots for two observations", () => {
    const chart = render([{ input_per_mtok: 5, output_per_mtok: 15 }, { input_per_mtok: 2.5, output_per_mtok: 10 }]);
    const paths = chart.children.filter(c => c.tag === "path");
    expect(paths.map(p => p.props.d)).toEqual(["M24.0,93.3 L376.0,111.7", "M24.0,20.0 L376.0,56.7"]);
    expect(chart.children.filter(c => c.tag === "circle")).toHaveLength(4);
  });
  it("centers a single zero-price observation without NaN", () => {
    const chart = render([{ input_per_mtok: 0, output_per_mtok: 0 }]);
    expect(chart.children.filter(c => c.tag === "circle").map(c => [c.props.cx, c.props.cy])).toEqual([[200, 130], [200, 130]]);
  });
  it("does not expose SVG numeric placeholders to the HTML parser", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    expect(html).not.toMatch(/\b(?:d|cx|cy)="\{\{/);
  });
});
