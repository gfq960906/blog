// 把一份 HTML 报告转成博客文章（.md），自动加 frontmatter 和「文字版/报告版」互链
// 用法：node tools/make-post-from-report.mjs <html路径> <post-slug> [lab-slug]
//   post-slug：输出到 content/posts/<post-slug>.md
//   lab-slug ：可选，对应的专题页文件名（不含 .html），用于互相跳转
// 标题/摘要：优先读 HTML 里的 <!-- meta: {...} -->，没有就退化为 <title>

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [htmlPath, postSlug, labSlug] = process.argv.slice(2);

if (!htmlPath || !postSlug) {
  console.log("用法：node tools/make-post-from-report.mjs <html路径> <post-slug> [lab-slug]");
  process.exit(1);
}

const raw = fs.readFileSync(htmlPath, "utf8");
let meta = {};
const metaM = raw.match(/<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/);
if (metaM) {
  try { meta = JSON.parse(metaM[1]); } catch { /* ignore */ }
}
const titleM = raw.match(/<title>([^<]*)<\/title>/i);
const title = meta.title || (titleM ? titleM[1].trim() : postSlug);
const summary = meta.summary || "";
const date = meta.date || new Date().toISOString().slice(0, 10);
const tags = Array.isArray(meta.tags) && meta.tags.length
  ? meta.tags
  : [meta.group, meta.tag].filter(Boolean);

// 转换正文
const md = execFileSync(
  process.execPath,
  [path.join(ROOT, "tools", "html2md.mjs"), htmlPath],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
).replace(/^#\s+.*\n+/, "").trim();

const banner = labSlug
  ? `> 📄 这是**文字版**，方便检索与订阅。带图表和完整排版的报告见专题页：[《${meta.short || title}》](../labs/${labSlug}.html)。\n\n`
  : "";

const front = [
  "---",
  `title: ${title}`,
  `date: ${date}`,
  "category: research",
  `tags: [${tags.join(", ")}]`,
  `summary: ${summary}`,
  "---",
  "",
].join("\n");

const out = path.join(ROOT, "content", "posts", `${postSlug}.md`);
fs.writeFileSync(out, front + banner + md + "\n", "utf8");
console.log(`✓ ${postSlug}.md  ${(front.length + banner.length + md.length) / 1024 | 0} KB`);
