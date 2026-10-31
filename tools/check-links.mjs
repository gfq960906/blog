// 站点内部链接检查：node tools/check-links.mjs [docs目录]
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || "docs";
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith(".html")) files.push(p);
  }
})(root);

let broken = 0;
let checked = 0;
for (const f of files) {
  // 去掉 <script> / <style> 里的内容：JS 模板串（如 href="' + esc(u) + '"）不是真实链接
  const html = fs
    .readFileSync(f, "utf8")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(u)) continue;
    u = u.split("#")[0].split("?")[0];
    if (!u) continue;
    const target = path.resolve(path.dirname(f), decodeURIComponent(u));
    checked++;
    if (!fs.existsSync(target)) {
      broken++;
      console.log("BROKEN", f, "->", u);
    }
  }
}
console.log(`pages: ${files.length}  links: ${checked}  broken: ${broken}`);
process.exitCode = broken ? 1 : 0;
