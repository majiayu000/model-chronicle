import { describe, expect, it } from "vitest";
import { gapBetween, medianDays, releaseDate, successions, vendorCadence, formatGap } from "../src/lib/intervals";
import { makeModel } from "./fixture";

describe("gapBetween", () => {
  it("两端都精确到天时返回天数", () => {
    expect(gapBetween("2024-03-04", "2024-06-20")).toEqual({ kind: "exact", days: 108 });
  });
  it("任一端只有月份时返回近似月数，不伪造天数", () => {
    expect(gapBetween("2023-07", "2024-03-04")).toEqual({ kind: "approx", months: 8 });
    expect(formatGap(gapBetween("2023-07", "2024-03-04"))).toBe("约 8 个月");
  });
});

describe("releaseDate", () => {
  it("优先 GA，缺失时回到 announced", () => {
    expect(releaseDate(makeModel({ dates: { announced: "2024-01-01", ga: "2024-02-01" } }))).toBe("2024-02-01");
    expect(releaseDate(makeModel({ dates: { announced: "2024-01-01", ga: null } }))).toBe("2024-01-01");
  });
  it("两个日期都缺失时抛错", () => {
    expect(() => releaseDate(makeModel({ dates: { announced: null, ga: null } }))).toThrow();
  });
});

describe("successions", () => {
  const a = makeModel({ id: "a", dates: { ga: "2024-01-01" } });
  const b = makeModel({ id: "b", predecessor: "a", dates: { ga: "2024-01-31" } });
  const c = makeModel({ id: "c", predecessor: "b", dates: { ga: "2024-03-01" } });

  it("按 predecessor 生成继任对并按时间排序", () => {
    const s = successions([c, a, b]);
    expect(s.map((x) => `${x.from.id}->${x.to.id}`)).toEqual(["a->b", "b->c"]);
    expect(s[0].gap).toEqual({ kind: "exact", days: 30 });
  });
  it("predecessor 缺失时抛错", () => {
    expect(() => successions([b])).toThrow(/不存在/);
  });
});

describe("vendorCadence / medianDays", () => {
  it("同日发布合并为一次", () => {
    const ms = [
      makeModel({ id: "x", dates: { ga: "2024-01-01" } }),
      makeModel({ id: "y", dates: { ga: "2024-01-01" } }),
      makeModel({ id: "z", dates: { ga: "2024-01-11" } }),
    ];
    expect(vendorCadence(ms)).toEqual([{ kind: "exact", days: 10 }]);
  });
  it("中位数只统计精确间隔；无数据返回 null", () => {
    expect(medianDays([{ kind: "exact", days: 10 }, { kind: "exact", days: 30 }, { kind: "approx", months: 99 }])).toBe(20);
    expect(medianDays([{ kind: "approx", months: 3 }])).toBeNull();
  });
});
