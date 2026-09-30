import models from "../generated/models.json";
import application from "./application.js?raw";

declare const __CHRONICLE_RUNTIME_VERSION__: string;

declare global {
  interface Window {
    __CHRONICLE_MODELS__: typeof models;
  }
}

window.__CHRONICLE_MODELS__ = models;
const logic = document.querySelector("script[data-dc-script]");
if (logic) logic.textContent = application;

function loadScript(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}${path}?v=${__CHRONICLE_RUNTIME_VERSION__}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`无法加载界面脚本：${path}`));
    document.head.appendChild(script);
  });
}

async function boot() {
  const paths = [
    "graph-v2/vendor/react.production.min.js", "graph-v2/vendor/react-dom.production.min.js",
    "graph-v2/catalog-tools.js", "graph-v2/chronicle.js", "graph-v2/chronicle-timeline.js",
    "graph-v2/chronicle-visibility.js", "graph-v2/chronicle-route.js", "graph-v2/chronicle-vm.js",
    "graph-v2/chronicle-ext.js", "graph-v2/chronicle-ext2.js", "graph-v2/price-chart.js", "graph-v2/support.js",
  ];
  // Download in parallel while retaining the runtime's execution order.
  for (const path of paths) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = `${import.meta.env.BASE_URL}${path}?v=${__CHRONICLE_RUNTIME_VERSION__}`;
    document.head.appendChild(link);
  }
  // The exported design runtime targets React 18's UMD API.
  for (const path of paths) await loadScript(path);
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement("p");
  message.textContent = "界面加载失败，请刷新页面重试。";
  message.style.cssText = "padding:32px;color:#ecebe6;font-family:sans-serif";
  document.body.appendChild(message);
});
