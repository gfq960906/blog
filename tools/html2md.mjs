// ============================================================
//  HTML 报告 → Markdown 转换器（零依赖，够用版）
//  用法：node tools/html2md.mjs <输入.html> [输出.md]
//  特点：保留标题层级、段落、列表、表格、引用、代码块、链接、粗斜体
//  会跳过：<nav class="toc">、<script>、<style>、页脚
// ============================================================

import fs from "node:fs";
import path from "node:path";

/* ---------------- 极简 HTML 解析 ---------------- */

const VOID = new Set(["br", "img", "hr", "meta", "link", "input", "source", "area", "base", "col", "embed", "param", "track", "wbr"]);

function decodeEntities(s) {
  const named = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    mdash: "—", ndash: "–", hellip: "…", times: "×", deg: "°",
    rarr: "→", larr: "←", le: "≤", ge: "≥", plusmn: "±", middot: "·",
    laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

function parse(html) {
  const root = { tag: "root", attrs: {}, children: [] };
  const stack = [root];
  const tagRe = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let last = 0;
  let m;

  const pushText = (t) => {
    if (!t) return;
    stack[stack.length - 1].children.push({ tag: "#text", text: decodeEntities(t) });
  };

  while ((m = tagRe.exec(html))) {
    pushText(html.slice(last, m.index));
    last = tagRe.lastIndex;
    if (m[0].startsWith("<!--") || m[0].startsWith("<![CDATA[")) continue;

    const raw = m[0];
    const tag = m[1].toLowerCase();
    const closing = raw[1] === "/";

    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
      continue;
    }

    const attrs = {};
    const attrStr = m[2] || "";
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let a;
    while ((a = attrRe.exec(attrStr))) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? "";

    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!VOID.has(tag) && !raw.endsWith("/>")) stack.push(node);
  }
  pushText(html.slice(last));
  return root;
}

/* ---------------- 渲染 ---------------- */

const SKIP_TAGS = new Set(["script", "style", "nav", "header", "footer", "svg", "noscript"]);
const INLINE_TAGS = new Set(["strong", "b", "em", "i", "code", "a", "span", "img", "br", "sup", "sub", "mark", "del", "u", "small"]);

function textOf(node) {
  if (node.tag === "#text") return node.text;
  if (SKIP_TAGS.has(node.tag)) return "";
  return node.children.map(textOf).join("");
}

function inline(node) {
  if (node.tag === "#text") return node.text.replace(/\s+/g, " ");
  switch (node.tag) {
    case "strong": case "b": {
      const t = node.children.map(inline).join("").trim();
      return t ? `**${t}**` : "";
    }
    case "em": case "i": {
      const t = node.children.map(inline).join("").trim();
      return t ? `*${t}*` : "";
    }
    case "code": {
      const t = node.children.map(inline).join("").trim();
      return t ? "`" + t.replace(/`/g, "'") + "`" : "";
    }
    case "a": {
      const t = node.children.map(inline).join("").trim();
      const href = node.attrs.href || "";
      if (!t) return "";
      if (!href || href.startsWith("#")) return t;
      return `[${t}](${href})`;
    }
    case "br": return "\n";
    case "sup": return node.children.map(inline).join("").trim();
    case "sub": return node.children.map(inline).join("").trim();
    case "span": return node.children.map(inline).join("");
    case "img": return "";
    default: {
      if (SKIP_TAGS.has(node.tag)) return "";
      return node.children.map(inline).join("");
    }
  }
}

function cleanInline(s) {
  return s.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
}

function table(node) {
  const rows = [];
  const walk = (n) => {
    if (n.tag === "tr") {
      rows.push(n.children.filter((c) => c.tag === "th" || c.tag === "td"));
      return;
    }
    if (n.tag === "table" || n.tag === "thead" || n.tag === "tbody" || n.tag === "tfoot") n.children.forEach(walk);
  };
  walk(node);
  if (!rows.length) return "";

  const cellText = (c) => cleanInline(inline(c)).replace(/\|/g, "\\|");
  const headerRow = rows[0];
  const hasHeader = headerRow.some((c) => c.tag === "th");
  const head = hasHeader ? headerRow : null;
  const body = hasHeader ? rows.slice(1) : rows;
  const cols = Math.max(...rows.map((r) => r.length));

  const fmt = (cells) => {
    const vals = cells.map(cellText);
    while (vals.length < cols) vals.push("");
    return "| " + vals.join(" | ") + " |";
  };

  const out = [];
  if (head) {
    out.push(fmt(head));
    out.push("| " + Array(cols).fill("---").join(" | ") + " |");
  } else if (body.length) {
    out.push("| " + Array(cols).fill("").join(" | ") + " |");
    out.push("| " + Array(cols).fill("---").join(" | ") + " |");
  }
  body.forEach((r) => out.push(fmt(r)));
  return out.join("\n");
}

function chartTable(node) {
  const rows = [];
  const walk = (n) => {
    const cls = (n.attrs && n.attrs.class) || "";
    if (cls.includes("bar-row")) {
      const kids = n.children || [];
      const labelNode = kids.find((c) => c.tag === "span" && !String((c.attrs && c.attrs.class) || "").includes("bar-val"));
      const valNode = kids.find((c) => String((c.attrs && c.attrs.class) || "").includes("bar-val"));
      const label = labelNode ? cleanInline(inline(labelNode)) : "";
      const val = valNode ? cleanInline(inline(valNode)) : "";
      if (label || val) rows.push([label, val]);
      return;
    }
    (n.children || []).forEach(walk);
  };
  walk(node);
  if (!rows.length) return "";
  const out = ["| 工作 | 数值 |", "| --- | --- |"];
  rows.forEach(([a, b]) => out.push(`| ${a.replace(/\|/g, "\\|")} | ${b} |`));
  return out.join("\n");
}

function blocks(children, ctx = {}) {
  const out = [];
  let buf = [];

  const flush = () => {
    if (!buf.length) return;
    const t = cleanInline(buf.map(inline).join(""));
    if (t) out.push(t);
    buf = [];
  };
  const push = (s) => { if (s && s.trim()) out.push(s); };
  const asQuote = (inner) =>
    inner.split("\n").map((l) => (l.trim() ? "> " + l : ">")).join("\n");

  for (const n of children) {
    if (n.tag === "#text" || INLINE_TAGS.has(n.tag)) {
      buf.push(n);
      continue;
    }
    if (SKIP_TAGS.has(n.tag)) { flush(); continue; }

    flush();

    switch (n.tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
        const level = Number(n.tag[1]);
        let t = cleanInline(inline(n));
        const first = n.children.find((c) => !(c.tag === "#text" && !c.text.trim()));
        const firstCls = String((first && first.attrs && first.attrs.class) || "");
        if (first && first.tag === "span" && /(^|\s)(no|num)(\s|$)/.test(firstCls)) {
          const prefix = cleanInline(inline(first));
          if (prefix && t.startsWith(prefix) && t.length > prefix.length) {
            t = prefix + " · " + t.slice(prefix.length);
          }
        }
        if (t) push("#".repeat(Math.min(level, 6)) + " " + t);
        break;
      }
      case "p": {
        const kids = n.children.filter((c) => !(c.tag === "#text" && !c.text.trim()));
        if (kids.length > 1 && kids.every((c) => c.tag === "span")) {
          push(kids.map((c) => cleanInline(inline(c))).filter(Boolean).join(" · "));
          break;
        }
        const t = cleanInline(n.children.map(inline).join(""));
        if (t) push(t);
        break;
      }
      case "div": case "section": case "article": case "main": case "figure": {
        const cls = (n.attrs.class || "").toLowerCase();
        if (cls.includes("chart")) {
          const t = chartTable(n);
          if (t) push(t);
          break;
        }
        const inner = blocks(n.children, ctx);
        if (cls.includes("key") || cls.includes("callout") || cls.includes("note")) {
          if (inner.length) push(asQuote(inner.join("\n\n")));
        } else {
          inner.forEach(push);
        }
        break;
      }
      case "blockquote": {
        const inner = blocks(n.children, ctx);
        if (inner.length) push(asQuote(inner.join("\n\n")));
        break;
      }
      case "ul": case "ol": {
        const items = n.children.filter((c) => c.tag === "li");
        const lines = [];
        items.forEach((li, i) => {
          const marker = n.tag === "ol" ? `${i + 1}. ` : "- ";
          const inner = blocks(li.children, ctx);
          if (!inner.length) return;
          lines.push(marker + inner[0].replace(/\n+/g, " "));
          for (const rest of inner.slice(1)) {
            lines.push("  " + rest.replace(/\n/g, "\n  "));
          }
        });
        if (lines.length) push(lines.join("\n"));
        break;
      }
      case "table": {
        const t = table(n);
        if (t) push(t);
        break;
      }
      case "pre": {
        const code = textOf(n);
        if (code.trim()) push("```\n" + code.replace(/\n+$/, "") + "\n```");
        break;
      }
      case "hr": push("---"); break;
      case "br": break;
      default: {
        blocks(n.children, ctx).forEach(push);
      }
    }
  }
  flush();
  return out;
}

/* ---------------- 主流程 ---------------- */

const [, , inFile, outFile] = process.argv;
if (!inFile) {
  console.log("用法：node tools/html2md.mjs <输入.html> [输出.md]");
  process.exit(1);
}

const html = fs.readFileSync(inFile, "utf8");

// 只取 <body>
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const body = bodyMatch ? bodyMatch[1] : html;

// 去掉目录导航、页头（标题另行处理）、页脚
const cleaned = body
  .replace(/<nav[^>]*class="[^"]*toc[^"]*"[\s\S]*?<\/nav>/gi, "")
  .replace(/<button[\s\S]*?<\/button>/gi, "");

const tree = parse(cleaned);
const md = blocks(tree.children)
  .join("\n\n")
  .replace(/\n{3,}/g, "\n\n")
  .replace(/[ \t]+\n/g, "\n")
  .trim();

if (outFile) {
  fs.writeFileSync(outFile, md + "\n", "utf8");
  console.log(`✓ ${path.basename(inFile)} → ${outFile}（${md.length} 字符）`);
} else {
  process.stdout.write(md + "\n");
}
