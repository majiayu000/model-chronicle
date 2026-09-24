import { describe, expect, it } from "vitest";
import { benchRows, specRows } from "../src/lib/diff";
import { makeModel } from "./fixture";

describe("specRows", () => {
  const prev = makeModel({ specs: { context_window: 200_000, pricing: { input_per_mtok: 15, output_per_mtok: 75 } } });
  const cur = makeModel({ specs: { context_window: 1_000_000, pricing: { input_per_mtok: 5, output_per_mtok: 75 } } });
  const rows = Object.fromEntries(specRows(cur, prev).map((r) => [r.label, r]));

  it("大幅变化用倍数表示，并按方向判断好坏", () => {
    expect(rows["上下文窗口"]).toMatchObject({ value: "1M", delta: "×5.0", better: true });
    expect(rows["输入价格 / 百万 token"]).toMatchObject({ value: "$5", delta: "×0.33", better: true });
  });
  it("相同值显示持平；缺数据显示未公开且不给差值", () => {
    expect(rows["输出价格 / 百万 token"].delta).toBe("持平");
    expect(rows["最大输出"]).toMatchObject({ value: "未公开", delta: null });
  });
  it("无前代时不给差值", () => {
    expect(specRows(cur, null).every((r) => r.delta === null)).toBe(true);
  });
});

describe("benchRows", () => {
  it("只和前代同名且同来源类型的分数比较", () => {
    const src = "https://example.com/b";
    const prev = makeModel({ benchmarks: [{ name: "MMLU", score: 80, reported_by: "third_party", source: src }] });
    const cur = makeModel({ benchmarks: [{ name: "MMLU", score: 85, reported_by: "vendor", source: src }] });
    expect(benchRows(cur, prev)[0].prevScore).toBeNull();
  });
});
