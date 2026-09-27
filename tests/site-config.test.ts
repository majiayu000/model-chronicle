import { describe, expect, it } from "vitest";
import { siteUrl, socialMeta } from "../scripts/site-config";

describe("deployment metadata", () => {
  it("normalizes both root deployments and subpaths", () => {
    expect(siteUrl("https://example.com")).toBe("https://example.com/");
    expect(siteUrl("https://example.com/catalog")).toBe("https://example.com/catalog/");
  });
  it.each(["javascript:alert(1)", "https://user:password@example.com", "https://example.com/?q=x", "https://example.com/#home"])("rejects unsafe or ambiguous site URL %s", url => {
    expect(() => siteUrl(url)).toThrow();
  });
  it("escapes social metadata attributes", () => {
    expect(socialMeta('A "model"', '<description>', "https://example.com/")).toContain('content="A &quot;model&quot;"');
    expect(socialMeta("title", "<description>", "https://example.com/")).toContain("&lt;description&gt;");
  });
});
