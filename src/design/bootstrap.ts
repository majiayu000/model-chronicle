import models from "../generated/models.json";

declare global {
  interface Window {
    __CHRONICLE_MODELS__: typeof models;
  }
}

window.__CHRONICLE_MODELS__ = models;

function loadScript(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}${path}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`无法加载界面脚本：${path}`));
    document.head.appendChild(script);
  });
}

async function boot() {
  // The exported design runtime targets React 18's UMD API.
  await loadScript("graph-v2/vendor/react.production.min.js");
  await loadScript("graph-v2/vendor/react-dom.production.min.js");
  await loadScript("graph-v2/chronicle.js");
  await loadScript("graph-v2/chronicle-vm.js");
  await loadScript("graph-v2/chronicle-ext.js");
  await loadScript("graph-v2/chronicle-ext2.js");
  await loadScript("graph-v2/support.js");
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement("p");
  message.textContent = "界面加载失败，请刷新页面重试。";
  message.style.cssText = "padding:32px;color:#ecebe6;font-family:sans-serif";
  document.body.appendChild(message);
});
