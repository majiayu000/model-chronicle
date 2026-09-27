export type SourceResult = "reachable" | "review_link" | "blocked" | "unavailable";

export function classifyStatus(status: number): SourceResult {
  if (status >= 200 && status < 300) return "reachable";
  if ([404, 410].includes(status)) return "review_link";
  if ([401, 403, 429].includes(status)) return "blocked";
  return "unavailable";
}

export async function checkSource(url: string, request: typeof fetch = fetch): Promise<{ status: number | null; result: SourceResult }> {
  let status: number | null = null;
  let result: SourceResult = "unavailable";
  try {
    let response = await request(url, { method: "HEAD", signal: AbortSignal.timeout(8000), redirect: "follow" });
    if ([403, 405].includes(response.status)) {
      await response.body?.cancel();
      response = await request(url, { method: "GET", signal: AbortSignal.timeout(8000), redirect: "follow" });
    }
    status = response.status;
    result = classifyStatus(status);
    await response.body?.cancel();
  } catch {
    // Network errors and timeouts do not prove a broken source link.
  }
  return { status, result };
}
