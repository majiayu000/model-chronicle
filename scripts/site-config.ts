import config from "../site.config.json" with { type: "json" };

export function siteUrl(value = process.env.SITE_URL ?? config.url): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("SITE_URL 必须是无认证、查询和片段的 HTTP(S) 站点地址");
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

export const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export const repositoryUrl = config.repository;

export function socialMeta(title: string, description: string, url: string) {
  return `<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(siteUrl())}social-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="模型编年史：有来源的大模型发布时间线、规格与发布价格">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${escapeHtml(siteUrl())}social-card.png">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">`;
}
