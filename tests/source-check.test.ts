import { describe, expect, it, vi } from "vitest";
import { checkSource, classifyStatus } from "../src/lib/source-check";

describe("source audit", () => {
  it.each([
    [200, "reachable"], [204, "reachable"], [404, "review_link"], [410, "review_link"],
    [401, "blocked"], [403, "blocked"], [429, "blocked"], [500, "unavailable"], [302, "unavailable"],
  ])("classifies HTTP %i as %s", (status, result) => {
    expect(classifyStatus(Number(status))).toBe(result);
  });

  it.each([403, 405])("falls back from HEAD %i to GET and releases both response bodies", async status => {
    const head = new Response("head", { status }), get = new Response("get", { status: 200 });
    const headCancel = vi.spyOn(head.body!, "cancel"), getCancel = vi.spyOn(get.body!, "cancel");
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(head).mockResolvedValueOnce(get);
    expect(await checkSource("https://example.com", request)).toEqual({ status: 200, result: "reachable" });
    expect(request.mock.calls.map(([, init]) => init?.method)).toEqual(["HEAD", "GET"]);
    expect(headCancel).toHaveBeenCalledOnce(); expect(getCancel).toHaveBeenCalledOnce();
  });

  it("keeps denied GET requests distinct from missing links", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 403 })).mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect(await checkSource("https://example.com", request)).toEqual({ status: 403, result: "blocked" });
  });

  it("preserves an observed HTTP status if body cleanup fails", async () => {
    const response = new Response("body", { status: 404 });
    vi.spyOn(response.body!, "cancel").mockRejectedValue(new Error("closed stream"));
    const request = vi.fn<typeof fetch>().mockResolvedValue(response);
    expect(await checkSource("https://example.com", request)).toEqual({ status: 404, result: "review_link" });
  });

  it("reports network failure and failed fallback as uncertain, without throwing", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout"));
    expect(await checkSource("https://example.com", request)).toEqual({ status: null, result: "unavailable" });
    request.mockResolvedValueOnce(new Response(null, { status: 405 }));
    expect(await checkSource("https://example.com", request)).toEqual({ status: null, result: "unavailable" });
  });
});
