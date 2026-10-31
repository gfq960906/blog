// ============================================================
//  本地预览服务器 —— 零依赖
//  用法：node serve.mjs          （默认 4310 端口，自动监听内容变化并重建）
//        node serve.mjs --no-watch
// ============================================================

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "./build.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, process.env.OUT_DIR || "docs");
const watch = !process.argv.includes("--no-watch");
let PORT = Number(process.env.PORT || 4321);
const DEFAULT_PORT = PORT;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p === "/") p = "/index.html";
  let full = path.join(DIST, p);
  if (!full.startsWith(DIST)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) full = path.join(full, "index.html");
  // 允许 /posts/xxx 这种省略 .html 的访问
  if (!fs.existsSync(full) && !path.extname(full) && fs.existsSync(full + ".html")) {
    full += ".html";
  }
  return fs.existsSync(full) && fs.statSync(full).isFile() ? full : null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    const notFound = path.join(DIST, "404.html");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : "404 Not Found");
    return;
  }
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
  fs.createReadStream(file).pipe(res);
});

function start() {
  server.listen(PORT, "127.0.0.1", () => {
    console.log("");
    if (PORT !== DEFAULT_PORT) console.log(`  （端口 ${DEFAULT_PORT} 被占用，自动换到 ${PORT}）`);
    console.log("  预览地址 →  http://localhost:" + PORT);
    console.log("  内容目录 →  content/posts/ , content/labs/");
    console.log("  按 Ctrl+C 停止");
    console.log("");
  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`端口 ${PORT} 被占用，尝试 ${PORT + 1} …`);
    PORT += 1;
    start();
  } else {
    throw err;
  }
});

build();

if (watch) {
  let timer = null;
  const dirs = [path.join(ROOT, "content"), path.join(ROOT, "assets")].filter((d) => fs.existsSync(d));
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build({ quiet: true });
        console.log("  ✓ 内容已更新（刷新页面即可）");
      } catch (e) {
        console.error("  构建出错:", e.message);
      }
    }, 180);
  };
  for (const d of dirs) {
    try {
      fs.watch(d, { recursive: true }, rebuild);
    } catch {
      fs.watch(d, rebuild);
    }
  }
}

start();
