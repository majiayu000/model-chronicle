import { defineConfig } from "vite";
import { siteUrl, escapeHtml, socialMeta } from "./scripts/site-config.ts";

export default defineConfig({
  base: "./",
  plugins: [{
    name: "site-metadata",
    transformIndexHtml(html) {
      const url = siteUrl();
      const dataset = {
        "@context": "https://schema.org", "@type": "Dataset", name: "模型编年史",
        description: "带来源的大模型发布时间、规格、发布价与基准观测数据集；缺失字段不代表零。",
        url, creator: { "@type": "Organization", name: "Model Chronicle（majiayu000）" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        distribution: [
          { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${url}dataset/models.json` },
          { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${url}dataset/models.csv` },
        ],
      };
      return html.replace("<!-- SITE_METADATA -->", `<link rel="canonical" href="${escapeHtml(url)}">\n${socialMeta("模型编年史", dataset.description, url)}\n<script type="application/ld+json">${JSON.stringify(dataset).replaceAll("<", "\\u003c")}</script>`);
    },
  }],
});
