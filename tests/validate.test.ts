import { describe, expect, it } from "vitest";
import { validateModels } from "../src/lib/validate";
import { makeModel } from "./fixture";

const run = (...ms: object[]) => validateModels(ms.map((data, i) => ({ file: `f${i}.yaml`, data })));

describe("validateModels", () => {
  it("合法数据无错误", () => {
    const r = run(makeModel({ id: "a" }), makeModel({ id: "b", predecessor: "a", dates: { ga: "2024-06-01" } }));
    expect(r.errors).toEqual([]);
    expect(r.models).toHaveLength(2);
  });
  it("YAML 解析出的 Date 对象会被转成字符串", () => {
    const r = run({ ...makeModel(), dates: { announced: null, ga: new Date("2024-01-01"), deprecated: null, retired: null } });
    expect(r.errors).toEqual([]);
    expect(r.models[0].model.dates.ga).toBe("2024-01-01");
  });
  it("拒绝非法 family、未知字段、非白名单基准", () => {
    expect(run(makeModel({ family: "gpt" })).errors.join()).toMatch(/family/);
    expect(run({ ...makeModel(), extra: 1 }).errors).not.toEqual([]);
    const bad = makeModel({ benchmarks: [{ name: "Foo" as never, score: 1, reported_by: "vendor", source: "https://x.com" }] });
    expect(run(bad).errors).not.toEqual([]);
  });
  it("拒绝没有来源的模型", () => {
    expect(run(makeModel({ sources: [] })).errors).not.toEqual([]);
  });
  it("拒绝重复 id、缺失前代、跨档前代、前代晚于本模型、分叉", () => {
    expect(run(makeModel({ id: "a" }), makeModel({ id: "a" })).errors.join()).toMatch(/重复/);
    expect(run(makeModel({ predecessor: "nope" })).errors.join()).toMatch(/不存在/);
    const a = makeModel({ id: "a", tier: "flagship" });
    expect(run(a, makeModel({ id: "b", predecessor: "a" })).errors.join()).toMatch(/同一/);
    const late = makeModel({ id: "a", dates: { ga: "2025-01-01" } });
    expect(run(late, makeModel({ id: "b", predecessor: "a" })).errors.join()).toMatch(/晚于/);
    const root = makeModel({ id: "r" });
    const f1 = makeModel({ id: "f1", predecessor: "r", dates: { ga: "2024-05-01" } });
    const f2 = makeModel({ id: "f2", predecessor: "r", dates: { ga: "2024-06-01" } });
    expect(run(root, f1, f2).errors.join()).toMatch(/分叉/);
  });
});
