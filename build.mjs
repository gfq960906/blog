// ============================================================
//  静态博客构建脚本 —— 纯 Node，零依赖
//  用法：node build.mjs
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { site, categories, labGroups } from "./site.config.mjs";
import { composePage } from "./tools/compose-page.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
// 构建产物目录。用 GitHub Pages「分支 + /docs」方式发布时必须是 docs；
// 想用 dist（比如拖到 Netlify Drop）就设置环境变量 OUT_DIR=dist
const DIST = path.join(ROOT, process.env.OUT_DIR || "docs");

/* ---------------------------------------------------------- */
/*  工具函数                                                   */
/* ---------------------------------------------------------- */

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const escAttr = esc;

function fmtDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function isoDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readingMinutes(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.round(cjk / 380 + words / 210));
}

function encodeUrlPath(s) {
  return s.split("/").map(encodeURIComponent).join("/");
}

function tagSlug(tag) {
  // 普通中文标签保留原有网址，短小写名称可直接跨平台用作文件名。
  const portable = /^[a-z0-9\u4e00-\u9fff-]+$/.test(tag) && Buffer.byteLength(tag) <= 120;
  const reserved = /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(tag);
  if (portable && !reserved) return tag;
  const stem = tag.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").slice(0, 20).replace(/^-+|-+$/g, "");
  const digest = createHash("sha256").update(tag).digest("hex").slice(0, 24);
  return `${stem || "tag"}~${digest}`;
}

function catInfo(key) {
  return Object.hasOwn(categories, key) ? categories[key] : { name: key || "未分类", color: "#6b7280" };
}

function categoryPath(key) {
  // Keep ordinary category URLs readable and map arbitrary keys to portable filenames.
  const standard = /^[a-z][a-z0-9-]*$/.test(key) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(key);
  return `categories/${standard ? key : "_" + Buffer.from(String(key)).toString("hex")}.html`;
}

const iconPaths = {
  book: '<path d="M3 4.5c3.2-.9 6.1-.4 9 1.4 2.9-1.8 5.8-2.3 9-1.4v14c-3.2-.9-6.1-.4-9 1.4-2.9-1.8-5.8-2.3-9-1.4zM12 6v14"/>',
  research: '<circle cx="12" cy="12" r="1.3"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-35 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(55 12 12)"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12c5 3 13 3 18 0M10 13h4"/>',
  life: '<path d="M21 3c0 9-2 15-9 16-5 .8-9-2.5-8-7.4C5.4 5.3 13.6 6.3 21 3ZM3 21l12-12"/>',
  essay: '<path d="m4 17 12-12a2.2 2.2 0 0 1 3 3L7 20l-4 1zM14 7l3 3"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
};

function icon(key) {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${Object.hasOwn(iconPaths, key) ? iconPaths[key] : iconPaths.folder}</svg>`;
}

/* ---------------------------------------------------------- */
/*  Frontmatter 解析                                           */
/* ---------------------------------------------------------- */

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val === "") { data[key] = ""; continue; }
    // 编辑器以 JSON 兼容的 YAML 标量和数组保存引号、反斜杠等字符。
    if (val.startsWith('"') || /^\[\s*"/.test(val)) {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === "string" || (Array.isArray(parsed) && parsed.every(item => typeof item === "string"))) {
          data[key] = parsed;
          continue;
        }
      } catch { /* 手写的标签列表和引号沿用下方解析方式。 */ }
    }
    if (/^\[.*\]$/.test(val)) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (/^(true|false)$/i.test(val)) {
      data[key] = /^true$/i.test(val);
    } else {
      data[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body: raw.slice(m[0].length) };
}

/* ---------------------------------------------------------- */
/*  Markdown 渲染（够用版：标题/列表/表格/代码/引用/链接/图片） */
/* ---------------------------------------------------------- */

function inline(text) {
  const codes = [];
  let t = text.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(c);
    return `\u0000C${codes.length - 1}\u0000`;
  });

  t = esc(t);

  // 图片
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, src, title) => {
    return `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ""} loading="lazy">`;
  });

  // 链接（外链自动加 target=_blank）
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, label, href, title) => {
    const external = /^https?:\/\//i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${href}"${title ? ` title="${title}"` : ""}${attrs}>${label}</a>`;
  });

  // 粗体 / 斜体 / 删除线
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  t = t.replace(/==([^=]+)==/g, "<mark>$1</mark>");

  // 行内代码还原
  t = t.replace(/\u0000C(\d+)\u0000/g, (_m, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return t;
}

function slugifyHeading(text, used) {
  let base = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (!base) base = "section";
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function mdToHtml(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const toc = [];
  const usedIds = new Set();
  let i = 0;

  const isBlank = (l) => l.trim() === "";
  const openingFence = /^ {0,3}(`{3,})([^`]*)$/;

  while (i < lines.length) {
    const line = lines[i];

    // ---- 代码块 ----
    const fence = line.match(openingFence);
    if (fence) {
      const lang = fence[2].trim().split(/\s+/, 1)[0];
      const closingFence = new RegExp("^ {0,3}`{" + fence[1].length + ",}\\s*$");
      const buf = [];
      i++;
      while (i < lines.length && !closingFence.test(lines[i])) buf.push(lines[i++]);
      if (i < lines.length) i++;
      out.push(
        `<pre><code${lang ? ` class="language-${escAttr(lang)}"` : ""}>${esc(buf.join("\n"))}</code></pre>`
      );
      continue;
    }

    // ---- 标题 ----
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugifyHeading(text.replace(/[*`_]/g, ""), usedIds);
      if (level === 2 || level === 3) toc.push({ level, text: text.replace(/[*`_]/g, ""), id });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // ---- 分隔线 ----
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // ---- 表格 ----
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const parseRow = (l) =>
        l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const headCells = parseRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && !isBlank(lines[i])) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      let html = "<div class=\"table-wrap\"><table><thead><tr>";
      html += headCells.map((c) => `<th>${inline(c)}</th>`).join("");
      html += "</tr></thead><tbody>";
      for (const r of rows) {
        html += "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table></div>";
      out.push(html);
      continue;
    }

    // ---- 引用块 ----
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${mdToHtml(buf.join("\n")).html}</blockquote>`);
      continue;
    }

    // ---- 列表 ----
    const ulm = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const olm = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (ulm || olm) {
      const ordered = Boolean(olm);
      const items = [];
      const baseIndent = (ordered ? olm[1] : ulm[1]).length;
      while (i < lines.length) {
        const l = lines[i];
        const um = l.match(/^(\s*)([-*+])\s+(.*)$/);
        const om = l.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
        const m2 = ordered ? om : um;
        if (!m2) break;
        const indent = m2[1].length;
        if (indent > baseIndent + 1) {
          // 嵌套一层
          const sub = [];
          while (i < lines.length) {
            const s = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
            if (!s || s[1].length <= baseIndent) break;
            sub.push(lines[i]);
            i++;
          }
          const subHtml = mdToHtml(sub.map((s) => s.trim()).join("\n")).html;
          if (items.length) items[items.length - 1].children = subHtml;
          else items.push({ text: "", children: subHtml });
          continue;
        }
        items.push({ text: m2[3] });
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      let html = `<${tag}>`;
      for (const it of items) {
        html += `<li>${inline(it.text || "")}${it.children ? it.children : ""}</li>`;
      }
      html += `</${tag}>`;
      out.push(html);
      continue;
    }

    // ---- 原始 HTML 块 ----
    if (/^\s*</.test(line)) {
      const buf = [];
      while (i < lines.length && !isBlank(lines[i])) buf.push(lines[i++]);
      out.push(buf.join("\n"));
      continue;
    }

    // ---- 段落 ----
    if (!isBlank(line)) {
      const buf = [];
      while (i < lines.length && !isBlank(lines[i])) {
        const l = lines[i];
        if (/^(#{1,6})\s/.test(l) || openingFence.test(l) || /^>\s?/.test(l) || /^\s*([-*+]|\d+[.)])\s+/.test(l)) break;
        buf.push(l);
        i++;
      }
      if (buf.length) out.push(`<p>${inline(buf.join("\n").replace(/\n/g, " "))}</p>`);
      continue;
    }

    i++;
  }

  return { html: out.join("\n"), toc };
}

/* ---------------------------------------------------------- */
/*  内容加载                                                    */
/* ---------------------------------------------------------- */

function readPosts() {
  const dir = path.join(CONTENT, "posts");
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true || data.draft === "true") continue;
    const slug = data.slug || f.replace(/\.md$/, "");
    const date = data.date ? new Date(String(data.date).replace(/\//g, "-")) : new Date();
    const { html, toc } = mdToHtml(body);
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
    posts.push({
      slug,
      title: data.title || slug,
      date: isNaN(date) ? new Date() : date,
      category: data.category || "essay",
      tags: [...new Set(tags.map(tag => String(tag).trim()).filter(Boolean))],
      summary: data.summary || "",
      cover: data.cover || "",
      body,
      html,
      toc,
      minutes: readingMinutes(body),
    });
  }
  posts.sort((a, b) => b.date - a.date);
  return posts;
}

// 索引阅读时可见的文字。保留表格单元和段落之间的空格，行内强调不拆词。
function searchText(html) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return html
    .replace(/<(script|style|head)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/?(?:p|div|section|h[1-6]|li|th|td|br|hr|pre|blockquote|dt|dd)\b[^>]*>/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi, (match, ref) => {
      if (!ref.startsWith("#")) return entities[ref.toLowerCase()];
      const code = /^#x/i.test(ref) ? parseInt(ref.slice(2), 16) : Number(ref.slice(1));
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function readLabs() {
  const dir = path.join(CONTENT, "labs");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((x) => x.endsWith(".html"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const name = f.replace(/\.html$/, "");
      const titleM = raw.match(/<title>([^<]*)<\/title>/i);
      const metaM = raw.match(/<!--\s*meta:\s*(\{[\s\S]*?\})\s*-->/);
      let meta = {};
      if (metaM) {
        try { meta = JSON.parse(metaM[1]); } catch { /* ignore */ }
      }
      const descM = raw.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      // 交互式综述把公开的文献卡片放在 rawdata 中，由浏览器排版。
      const rawData = raw.match(/<script\b(?=[^>]*\bid=["']rawdata["'])(?=[^>]*\btype=["']application\/json["'])[^>]*>([\s\S]*?)<\/script>/i);
      let bibliography = "";
      if (rawData) {
        try {
          const entries = JSON.parse(rawData[1]);
          if (Array.isArray(entries)) {
            bibliography = entries.filter(Boolean).map((row) =>
              [row.t, row.au, row.j, row.y, row.ai].flat().filter(Boolean).join(" ")
            ).join(" ");
          }
        } catch { /* HTML 报告仍可按可见正文检索。 */ }
      }
      return {
        name,
        title: meta.title || (titleM ? titleM[1].trim() : name),
        date: meta.date ? new Date(meta.date) : null,
        summary: meta.summary || (descM ? descM[1] : ""),
        tag: meta.tag || "专题",
        group: meta.group || "其他",
        short: meta.short || meta.title || (titleM ? titleM[1].trim() : name),
        post: meta.post || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        text: [searchText(raw), bibliography].filter(Boolean).join(" "),
      };
    })
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}

/* ---------------------------------------------------------- */
/*  页面模板                                                    */
/* ---------------------------------------------------------- */

function nav(rel, active) {
  const items = [
    ["index.html", "首页"],
    ["posts.html", "文章"],
    ["labs.html", "专题"],
    ["tags.html", "标签"],
    ["about.html", "关于"],
  ];
  return items
    .map(([href, label]) => {
      const isActive = active === href ? ' class="active" aria-current="page"' : "";
      return `<a href="${rel}${href}"${isActive}>${label}</a>`;
    })
    .join("");
}

function renderPage(assets, { title, desc, body, rel = "", active = "", head = "", bodyClass = "" }) {
  const fullTitle = title ? `${title} · ${site.title}` : `${site.title} · ${site.description}`;
  const description = desc || site.description;
  const favicon =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%231b2a4a'/%3E%3Ctext x='50' y='70' font-size='56' text-anchor='middle' fill='%23f4f1ea' font-family='Georgia,serif'%3E%E5%8D%9A%3C/text%3E%3C/svg%3E";
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escAttr(fullTitle)}</title>
<meta name="description" content="${escAttr(description)}">
<meta name="author" content="${escAttr(site.author)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escAttr(fullTitle)}">
<meta property="og:description" content="${escAttr(description)}">
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="${rel}${assets["style.css"]}">
<link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)}" href="${rel}feed.xml">
<script>(function(){try{var t=localStorage.getItem("blog-theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
${head}
</head>
<body class="${bodyClass}">
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${rel}index.html" aria-label="${escAttr(site.title)}首页">
      <span class="brand-mark">${icon("book")}</span>
      <span class="brand-text">${esc(site.title)}</span>
    </a>
    <nav class="site-nav" aria-label="主导航">${nav(rel, active)}</nav>
    <div class="header-tools">
      <a class="search-link" href="${rel}search.html" title="搜索" aria-label="搜索">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </a>
      <button id="theme-toggle" class="theme-toggle" title="切换深浅色" aria-label="切换深浅色">
        <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>
      </button>
      <a class="write-link" href="${rel}compose.html" aria-label="写笔记">${icon("essay")}<span>写笔记</span></a>
    </div>
  </div>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(site.author)}</span>
    <span class="dot">·</span>
    <a href="${rel}feed.xml">RSS</a>
    <span class="dot">·</span>
    <a href="${rel}posts.html">归档</a>
  </div>
</footer>
<script src="${rel}${assets["site.js"]}" defer></script>
</body>
</html>`;
}

function postCard(p, rel) {
  const cat = catInfo(p.category);
  return `<article class="post-card" data-cat="${escAttr(p.category)}">
  <div class="card-meta">
    <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time>
    <span class="cat-dot" style="--c:${cat.color}"></span>
    <a class="cat-name" href="${rel}${categoryPath(p.category)}">${esc(cat.name)}</a>
    <span class="read-time">${p.minutes} 分钟</span>
  </div>
  <h2 class="card-title"><a href="${rel}posts/${encodeURIComponent(p.slug)}.html">${esc(p.title)}</a></h2>
  ${p.summary ? `<p class="card-summary">${esc(p.summary)}</p>` : ""}
  ${p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<a class="tag" href="${rel}tags/${encodeURIComponent(tagSlug(t))}.html">#${esc(t)}</a>`).join(" ")}</div>` : ""}
</article>`;
}

/* ---------------------------------------------------------- */
/*  构建                                                        */
/* ---------------------------------------------------------- */

function writeFile(rel, content) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function prepareAssets() {
  const destination = path.join(DIST, "assets");
  copyDir(path.join(ROOT, "assets"), destination);
  const versioned = (name) => {
    const bytes = fs.readFileSync(path.join(destination, name));
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    return `${name}?v=${hash}`;
  };

  // Include the cover URL in the generated stylesheet before hashing the stylesheet itself.
  const cssPath = path.join(destination, "style.css");
  const css = fs.readFileSync(cssPath, "utf8");
  fs.writeFileSync(cssPath, css.replaceAll('url("optics-cover.webp")', `url("${versioned("optics-cover.webp")}")`));

  const files = ["style.css", "site.js", "search.css", "compose.css", "compose.js"];
  return Object.fromEntries(files.map((name) => [name, `assets/${versioned(name)}`]));
}

export function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const t0 = Date.now();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const assets = prepareAssets();
  const layout = (options) => renderPage(assets, options);
  const posts = readPosts();
  const labs = readLabs();
  const tagMap = new Map();
  for (const p of posts) for (const t of p.tags) {
    const k = tagSlug(t);
    if (!tagMap.has(k)) tagMap.set(k, { name: t, posts: [] });
    tagMap.get(k).posts.push(p);
  }

  const collections = [...new Set([...Object.keys(categories), ...posts.map((p) => p.category)])]
    .map((key) => ({ key, ...catInfo(key), items: posts.filter((p) => p.category === key) }))
    .filter((collection) => collection.items.length)
    .sort((a, b) => b.items.length - a.items.length);
  const tagsSorted = [...tagMap.entries()].sort((a, b) => b[1].posts.length - a[1].posts.length);

  /* ---- 首页 ---- */
  const homeBody = `
<section class="notebook-hero">
  <h1>学习笔记</h1>
  <p>${esc(site.description)}</p>
  <form class="home-search" role="search" action="search.html" method="get">
    ${icon("search")}
    <input type="search" name="q" aria-label="搜索笔记和专题" placeholder="搜索笔记、标签或正文关键词" required>
    <button type="submit">搜索</button>
  </form>
</section>
${collections.length ? `<section class="shelf">
  <div class="home-heading"><h2>笔记分类</h2><span>${posts.length} 篇记录</span></div>
  <div class="collection-grid">${collections.map((c) => `
    <a class="collection-card" href="${categoryPath(c.key)}" style="--collection-color:${escAttr(c.color)}">
      <span class="collection-icon">${icon(c.key)}</span><span><strong>${esc(c.name)}</strong><small>${c.items.length} 篇记录</small></span>
    </a>`).join("")}
  </div>
</section>` : ""}
<div class="home-columns">
  <section class="recent-notes">
    <div class="home-heading"><h2>最近更新</h2><a href="posts.html">全部文章</a></div>
    <div class="post-list">${posts.slice(0, 6).map((p) => postCard(p, "")).join("\n") || '<p class="empty">还没有已发布的笔记。</p>'}</div>
  </section>
  <aside class="home-aside">
    ${labs.length ? `<section class="aside-panel">
      <div class="home-heading"><h2>专题与报告</h2><a href="labs.html">全部专题</a></div>
      <ul class="report-index">${labs.slice(0, 4).map((l) => `<li><a href="labs/${encodeURIComponent(l.name)}.html">
        <small>${esc(l.group)}</small><strong>${esc(l.short)}</strong></a></li>`).join("")}</ul>
    </section>` : ""}
    ${tagsSorted.length ? `<section class="aside-panel">
      <div class="home-heading"><h2>常用标签</h2><a href="tags.html">全部标签</a></div>
      <div class="quick-tags">${tagsSorted.slice(0, 8).map(([slug, tag]) => `<a href="tags/${encodeURIComponent(slug)}.html"># ${esc(tag.name)}</a>`).join("")}</div>
    </section>` : ""}
  </aside>
</div>`;
  writeFile("index.html", layout({ body: homeBody, active: "index.html", bodyClass: "page-home" }));

  /* ---- 文章列表和分类归档 ---- */
  function archiveBody(collection) {
    const rel = collection ? "../" : "";
    const entries = collection ? collection.items : posts;
    const current = ' class="chip active" aria-current="page"';
    return `<section class="page-head">
      <h1>${collection ? esc(collection.name) : "全部文章"}</h1>
      <p class="page-sub">${entries.length} 篇记录 · 按日期排列</p>
    </section>
    <nav class="filters archive-filters" aria-label="按分类浏览">
      <a href="${rel}posts.html"${collection ? ' class="chip"' : current}>全部</a>
      ${collections.map((c) => `<a href="${rel}${categoryPath(c.key)}"${c === collection ? current : ' class="chip"'}>${esc(c.name)} <span>${c.items.length}</span></a>`).join("")}
    </nav>
    <div class="post-list">${entries.map((p) => postCard(p, rel)).join("\n") || '<p class="empty">还没有已发布的笔记。</p>'}</div>`;
  }
  writeFile("posts.html", layout({ title: "全部文章", body: archiveBody(), active: "posts.html" }));
  for (const c of collections) {
    writeFile(categoryPath(c.key), layout({ title: c.name, body: archiveBody(c), rel: "../", active: "posts.html" }));
  }
  writeFile("compose.html", layout({ title: "写笔记", body: composePage(categories, assets) }));

  /* ---- 文章详情 ---- */
  posts.forEach((p, idx) => {
    const cat = catInfo(p.category);
    const prev = posts[idx + 1]; // 更早
    const next = posts[idx - 1]; // 更新
    const tocLinks = p.toc.map((t) => `<a class="toc-${t.level}" href="#${t.id}">${esc(t.text)}</a>`).join("\n");

    const body = `
<article class="post">
  <div class="post-head">
    <div class="post-kicker">
      <a class="cat-pill" href="../${categoryPath(p.category)}" style="--c:${cat.color}">${esc(cat.name)}</a>
      <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time>
      <span>${p.minutes} 分钟阅读</span>
    </div>
    <h1 class="post-title">${esc(p.title)}</h1>
    ${p.summary ? `<p class="post-lede">${esc(p.summary)}</p>` : ""}
    ${p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<a class="tag" href="../tags/${encodeURIComponent(tagSlug(t))}.html">#${esc(t)}</a>`).join(" ")}</div>` : ""}
  </div>
  <div class="post-body${p.toc.length ? " with-toc" : ""}">
    ${tocLinks ? `<details class="toc-inline"><summary>文章目录 · ${p.toc.length} 节</summary><nav aria-label="文章目录">${tocLinks}</nav></details>` : ""}
    <div class="prose">${p.html}</div>
    ${tocLinks ? `<nav class="toc" aria-label="目录"><div class="toc-title">目录</div>${tocLinks}</nav>` : ""}
  </div>
  <nav class="post-nav">
    ${next ? `<a class="pn prev" href="${encodeURIComponent(next.slug)}.html"><span>← 更新的一篇</span><strong>${esc(next.title)}</strong></a>` : "<span></span>"}
    ${prev ? `<a class="pn next" href="${encodeURIComponent(prev.slug)}.html"><span>更早的一篇 →</span><strong>${esc(prev.title)}</strong></a>` : "<span></span>"}
  </nav>
  <p class="back"><a href="../posts.html">← 返回文章列表</a></p>
</article>
<div class="progress" aria-hidden="true"><div class="progress-bar" id="progress-bar"></div></div>
`;
    writeFile(
      path.join("posts", `${p.slug}.html`),
      layout({
        title: p.title,
        desc: p.summary || p.title,
        body,
        rel: "../",
        active: "posts.html",
        bodyClass: "page-post",
      })
    );
  });

  /* ---- 标签 ---- */
  const tagsBody = `
<section class="page-head">
  <h1>标签</h1>
  <p class="page-sub">共 ${tagMap.size} 个</p>
</section>
<div class="tag-cloud">
${tagsSorted
  .map(
    ([slug, v]) =>
      `<a class="tag tag-lg" href="tags/${encodeURIComponent(slug)}.html">#${esc(v.name)}<span class="count">${v.posts.length}</span></a>`
  )
  .join("\n")}
</div>
`;
  writeFile("tags.html", layout({ title: "标签", body: tagsBody, active: "tags.html" }));

  for (const [slug, v] of tagMap) {
    const body = `
<section class="page-head">
  <h1>#${esc(v.name)}</h1>
  <p class="page-sub">${v.posts.length} 篇</p>
</section>
<div class="post-list">
${v.posts.map((p) => postCard(p, "../")).join("\n")}
</div>
`;
    writeFile(
      path.join("tags", `${slug}.html`),
      layout({ title: `#${v.name}`, body, rel: "../", active: "tags.html" })
    );
  }

  /* ---- 专题（富 HTML 页面） ---- */
  const labCard = (l) => `<a class="lab-card" href="labs/${encodeURIComponent(l.name)}.html">
      <span class="lab-tag">${esc(l.tag)}</span>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.summary)}</p>
      ${l.date ? `<time>${fmtDate(l.date)}</time>` : ""}
    </a>`;

  const groupOrder = [...labGroups];
  for (const l of labs) if (!groupOrder.includes(l.group)) groupOrder.push(l.group);
  const grouped = groupOrder
    .map((g) => ({ group: g, items: labs.filter((l) => l.group === g) }))
    .filter((g) => g.items.length);

  const labsBody = `
<section class="page-head">
  <h1>专题与报告</h1>
  <p class="page-sub">整理好的调研、报告、可视化页面，独立成页</p>
</section>
${
  grouped.length
    ? grouped
        .map(
          (g) => `<section class="lab-group">
  <h2 class="lab-group-title">${esc(g.group)}<span class="lab-group-count">${g.items.length}</span></h2>
  <div class="lab-grid">
${g.items.map(labCard).join("\n")}
  </div>
</section>`
        )
        .join("\n")
    : '<p class="empty">还没有专题页。把 HTML 文件放进 <code>content/labs/</code> 即可自动出现在这里。</p>'
}
`;
  writeFile("labs.html", layout({ title: "专题", body: labsBody, active: "labs.html" }));

  // 原样复制 labs 页面，并在页头插入「相关」导航条（专题之间互相跳转）
  const labsDir = path.join(CONTENT, "labs");
  if (fs.existsSync(labsDir)) {
    const xnavCss = `<style>
.blog-xnav{position:sticky;top:0;z-index:9998;display:flex;flex-wrap:wrap;align-items:center;gap:8px;
  padding:10px 20px;font:13px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
  background:rgba(251,250,247,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(0,0,0,.07);color:#77808c}
.blog-xnav-t{opacity:.7;margin-right:2px}
.blog-xnav a{color:#24456e;text-decoration:none;padding:4px 11px;border-radius:999px;
  background:rgba(36,69,110,.07);transition:background .15s}
.blog-xnav a:hover{background:rgba(36,69,110,.15)}
.blog-xnav .blog-xnav-all{margin-left:auto;background:none;border:1px solid rgba(0,0,0,.14);color:#3d444d}
@media (max-width:640px){.blog-xnav{padding:8px 12px;font-size:12px}.blog-xnav .blog-xnav-all{margin-left:0}}
</style>`;

    for (const l of labs) {
      let raw = fs.readFileSync(path.join(labsDir, `${l.name}.html`), "utf8");
      const others = labs.filter((x) => x.name !== l.name);
      const links = others
        .map((o) => `<a href="./${encodeURIComponent(o.name)}.html">${esc(o.short)}</a>`)
        .join("");
      const postLink = l.post && posts.some((p) => p.slug === l.post)
        ? `<a class="blog-xnav-post" href="../posts/${encodeURIComponent(l.post)}.html">读文字版</a>`
        : "";
      const bar = `<div class="blog-xnav"><span class="blog-xnav-t">相关</span>${links}${postLink}<a class="blog-xnav-all" href="../labs.html">全部专题 →</a></div>${xnavCss}`;
      raw = /<body[^>]*>/i.test(raw) ? raw.replace(/<body[^>]*>/i, (m) => `${m}\n${bar}`) : bar + raw;
      writeFile(path.join("labs", `${l.name}.html`), raw);
    }
  }

  /* ---- 关于 ---- */
  const aboutFile = path.join(CONTENT, "about.md");
  let aboutHtml = "<p>这个人很懒，还没有写自我介绍。</p>";
  if (fs.existsSync(aboutFile)) {
    const { data, body: ab } = parseFrontmatter(fs.readFileSync(aboutFile, "utf8"));
    aboutHtml = mdToHtml(ab).html;
  }
  const aboutBody = `
<section class="page-head">
  <h1>关于</h1>
</section>
<article class="prose about-prose">${aboutHtml}</article>
`;
  writeFile("about.html", layout({ title: "关于", body: aboutBody, active: "about.html" }));

  /* ---- 搜索 ---- */
  const index = [
    ...posts.map((p) => ({
      href: `posts/${encodeURIComponent(p.slug)}.html`,
      kind: "article",
      title: p.title,
      date: isoDate(p.date),
      dateText: fmtDate(p.date),
      scope: `category:${p.category}`,
      cat: catInfo(p.category).name,
      tags: p.tags,
      summary: p.summary,
      text: searchText(p.html),
    })),
    ...labs.map((l) => ({
      href: `labs/${encodeURIComponent(l.name)}.html`,
      kind: "lab",
      title: l.title,
      date: l.date ? isoDate(l.date) : "",
      dateText: l.date ? fmtDate(l.date) : "",
      scope: `group:${l.group}`,
      cat: l.group,
      tags: [...new Set([l.tag, ...l.tags].filter(Boolean))],
      summary: l.summary,
      text: l.text || "",
    })),
  ];
  const searchData = JSON.stringify(index);
  writeFile("search-index.json", searchData);
  const scopeGroup = (kind, label) => {
    const entries = index.filter((entry) => entry.kind === kind);
    if (!entries.length) return "";
    const choices = new Map(entries.map((entry) => [entry.scope, entry.cat]));
    return `<optgroup label="${label}"><option value="${kind}">全部${label}</option>${
      Array.from(choices, ([key, name]) => `<option value="${escAttr(key)}">${esc(name)}</option>`).join("")
    }</optgroup>`;
  };
  const searchBody = `
<section class="page-head">
  <h1>站内搜索</h1>
  <p class="page-sub">搜索 ${posts.length} 篇文章与 ${labs.length} 个专题的标题、标签和正文。</p>
</section>
<form id="search-form" class="search-box" action="search.html" method="get" role="search">
  <label for="search-input">关键词</label>
  <input id="search-input" name="q" type="search" placeholder="例如：里德堡、量子门" autocomplete="off">
  <label for="search-scope">搜索范围</label>
  <select id="search-scope" name="scope"><option value="">全部内容</option>${scopeGroup("article", "文章")}${scopeGroup("lab", "专题")}</select>
</form>
<noscript><p>启用 JavaScript 后可搜索正文，也可以浏览<a href="posts.html">所有文章</a>或<a href="labs.html">专题报告</a>。</p></noscript>
<p id="search-status" role="status" aria-live="polite"></p>
<div id="search-results" class="post-list"></div>
<script id="search-data" type="application/json">${searchData.replace(/</g, "\\u003c")}</script>`;
  writeFile("search.html", layout({
    title: "站内搜索",
    body: searchBody,
    head: `<link rel="stylesheet" href="${assets["search.css"]}">`,
  }));

  /* ---- 404 ---- */
  writeFile(
    "404.html",
    layout({
      title: "页面不存在",
      body: `<section class="page-head"><h1>404</h1><p class="page-sub">这个页面不存在或已被移动。</p><p><a class="btn-ghost" href="index.html">回首页 →</a></p></section>`,
    })
  );

  /* ---- RSS ---- */
  if (site.url) {
    const base = site.url.replace(/\/$/, "");
    const items = posts
      .slice(0, 20)
      .map(
        (p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${base}/posts/${encodeURIComponent(p.slug)}.html</link>
    <guid>${base}/posts/${encodeURIComponent(p.slug)}.html</guid>
    <pubDate>${p.date.toUTCString()}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`
      )
      .join("\n");
    writeFile(
      "feed.xml",
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${esc(site.title)}</title>
  <link>${base}</link>
  <description>${esc(site.description)}</description>
  <language>zh-CN</language>
${items}
</channel></rss>`
    );
  } else {
    writeFile(
      "feed.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<!-- 在 site.config.mjs 里填写 site.url 后重新构建即可生成完整 RSS -->\n<rss version="2.0"><channel><title>${esc(site.title)}</title><link>/</link><description>${esc(site.description)}</description></channel></rss>`
    );
  }

  /* ---- sitemap ---- */
  if (site.url) {
    const base = site.url.replace(/\/$/, "");
    const urls = [
      `${base}/`,
      `${base}/posts.html`,
      `${base}/labs.html`,
      `${base}/tags.html`,
      `${base}/about.html`,
      ...collections.map((c) => `${base}/${categoryPath(c.key)}`),
      ...tagsSorted.map(([slug]) => `${base}/tags/${encodeURIComponent(slug)}.html`),
      ...posts.map((p) => `${base}/posts/${encodeURIComponent(p.slug)}.html`),
      ...labs.map((l) => `${base}/labs/${encodeURIComponent(l.name)}.html`),
    ];
    writeFile(
      "sitemap.xml",
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${u}</loc></url>`)
        .join("\n")}\n</urlset>`
    );
  }

  /* ---- 静态资源 ---- */
  writeFile(".nojekyll", "");

  log(
    `✓ 构建完成 ${Date.now() - t0}ms — ${posts.length} 篇文章 / ${tagMap.size} 个标签 / ${labs.length} 个专题`
  );
  log(`  输出目录: ${DIST}`);
  return { posts, labs };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build();
}
