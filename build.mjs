// ============================================================
//  静态博客构建脚本 —— 纯 Node，零依赖
//  用法：node build.mjs
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, categories } from "./site.config.mjs";

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
  return tag.trim().replace(/\s+/g, "-").replace(/[\\/:*?"<>|#%&{}]/g, "");
}

function catInfo(key) {
  return categories[key] || { name: key || "未分类", color: "#6b7280" };
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

  while (i < lines.length) {
    const line = lines[i];

    // ---- 代码块 ----
    const fence = line.match(/^```(\S*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++; // 跳过结束 ```
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
      out.push(`<blockquote>${mdToHtml(buf.join("\n"))}</blockquote>`);
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
          const subHtml = mdToHtml(sub.map((s) => s.trim()).join("\n"));
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
        if (/^(#{1,6})\s/.test(l) || /^```/.test(l) || /^>\s?/.test(l) || /^\s*([-*+]|\d+[.)])\s+/.test(l)) break;
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
    posts.push({
      slug,
      title: data.title || slug,
      date: isNaN(date) ? new Date() : date,
      category: data.category || "essay",
      tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
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
      return {
        name,
        title: meta.title || (titleM ? titleM[1].trim() : name),
        date: meta.date ? new Date(meta.date) : null,
        summary: meta.summary || (descM ? descM[1] : ""),
        tag: meta.tag || "专题",
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
      const isActive = active === href ? ' class="active"' : "";
      return `<a href="${rel}${href}"${isActive}>${label}</a>`;
    })
    .join("");
}

function layout({ title, desc, body, rel = "", active = "", head = "", bodyClass = "" }) {
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
<link rel="stylesheet" href="${rel}assets/style.css">
<link rel="alternate" type="application/rss+xml" title="${escAttr(site.title)}" href="${rel}feed.xml">
<script>(function(){try{var t=localStorage.getItem("blog-theme");if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
${head}
</head>
<body class="${bodyClass}">
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${rel}index.html">
      <span class="brand-mark">${esc(site.title.slice(0, 1))}</span>
      <span class="brand-text">${esc(site.title)}</span>
    </a>
    <nav class="site-nav">${nav(rel, active)}</nav>
    <div class="header-tools">
      <a class="search-link" href="${rel}search.html" title="搜索" aria-label="搜索">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </a>
      <button id="theme-toggle" class="theme-toggle" title="切换深浅色" aria-label="切换深浅色">
        <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>
      </button>
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
<script src="${rel}assets/site.js" defer></script>
</body>
</html>`;
}

function postCard(p, rel) {
  const cat = catInfo(p.category);
  return `<article class="post-card" data-cat="${escAttr(p.category)}">
  <div class="card-meta">
    <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time>
    <span class="cat-dot" style="--c:${cat.color}"></span>
    <span class="cat-name">${esc(cat.name)}</span>
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

export function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const t0 = Date.now();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const posts = readPosts();
  const labs = readLabs();
  const tagMap = new Map();
  for (const p of posts) for (const t of p.tags) {
    const k = tagSlug(t);
    if (!tagMap.has(k)) tagMap.set(k, { name: t, posts: [] });
    tagMap.get(k).posts.push(p);
  }

  /* ---- 首页 ---- */
  const latest = posts.slice(0, 8);
  const homeBody = `
<section class="hero">
  <h1 class="hero-title">${esc(site.title)}</h1>
  <p class="hero-desc">${esc(site.description)}</p>
  <div class="hero-stats">
    <span><strong>${posts.length}</strong> 篇记录</span>
    <span><strong>${tagMap.size}</strong> 个标签</span>
    <span><strong>${labs.length}</strong> 个专题</span>
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h2>最近记录</h2>
    <div class="filters" id="filters">
      <button class="chip active" data-filter="all">全部</button>
      ${Object.entries(categories)
        .filter(([k]) => posts.some((p) => p.category === k))
        .map(([k, v]) => `<button class="chip" data-filter="${k}">${esc(v.name)}</button>`)
        .join("")}
    </div>
  </div>
  <div class="post-list" id="post-list">
    ${latest.map((p) => postCard(p, "")).join("\n")}
  </div>
  ${
    posts.length > latest.length
      ? `<p class="more"><a class="btn-ghost" href="posts.html">查看全部 ${posts.length} 篇 →</a></p>`
      : ""
  }
</section>

${
  labs.length
    ? `<section class="section">
  <div class="section-head"><h2>专题与报告</h2><a class="tiny-link" href="labs.html">全部 →</a></div>
  <div class="lab-grid">
    ${labs
      .slice(0, 4)
      .map(
        (l) => `<a class="lab-card" href="labs/${encodeURIComponent(l.name)}.html">
      <span class="lab-tag">${esc(l.tag)}</span>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.summary)}</p>
      ${l.date ? `<time>${fmtDate(l.date)}</time>` : ""}
    </a>`
      )
      .join("\n")}
  </div>
</section>`
    : ""
}
`;
  writeFile("index.html", layout({ body: homeBody, active: "index.html" }));

  /* ---- 文章列表 ---- */
  const listBody = `
<section class="page-head">
  <h1>全部文章</h1>
  <p class="page-sub">共 ${posts.length} 篇 · 按时间倒序</p>
</section>
<div class="filters" id="filters">
  <button class="chip active" data-filter="all">全部</button>
  ${Object.entries(categories)
    .filter(([k]) => posts.some((p) => p.category === k))
    .map(([k, v]) => `<button class="chip" data-filter="${k}">${esc(v.name)}</button>`)
    .join("")}
</div>
<div class="post-list" id="post-list">
${posts.map((p) => postCard(p, "")).join("\n")}
</div>
`;
  writeFile("posts.html", layout({ title: "全部文章", body: listBody, active: "posts.html" }));

  /* ---- 文章详情 ---- */
  posts.forEach((p, idx) => {
    const cat = catInfo(p.category);
    const prev = posts[idx + 1]; // 更早
    const next = posts[idx - 1]; // 更新
    const tocHtml = p.toc.length
      ? `<nav class="toc" aria-label="目录">
  <div class="toc-title">目录</div>
  ${p.toc.map((t) => `<a class="toc-${t.level}" href="#${t.id}">${esc(t.text)}</a>`).join("\n  ")}
</nav>`
      : "";

    const body = `
<article class="post">
  <div class="post-head">
    <div class="post-kicker">
      <span class="cat-pill" style="--c:${cat.color}">${esc(cat.name)}</span>
      <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time>
      <span>${p.minutes} 分钟阅读</span>
    </div>
    <h1 class="post-title">${esc(p.title)}</h1>
    ${p.summary ? `<p class="post-lede">${esc(p.summary)}</p>` : ""}
    ${p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<a class="tag" href="../tags/${encodeURIComponent(tagSlug(t))}.html">#${esc(t)}</a>`).join(" ")}</div>` : ""}
  </div>
  <div class="post-body${p.toc.length ? " with-toc" : ""}">
    <div class="prose">${p.html}</div>
    ${tocHtml}
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
  const tagsSorted = [...tagMap.entries()].sort((a, b) => b[1].posts.length - a[1].posts.length);
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
  const labsBody = `
<section class="page-head">
  <h1>专题与报告</h1>
  <p class="page-sub">整理好的调研、报告、可视化页面，独立成页</p>
</section>
<div class="lab-grid">
${labs
  .map(
    (l) => `<a class="lab-card" href="labs/${encodeURIComponent(l.name)}.html">
      <span class="lab-tag">${esc(l.tag)}</span>
      <h3>${esc(l.title)}</h3>
      <p>${esc(l.summary)}</p>
      ${l.date ? `<time>${fmtDate(l.date)}</time>` : ""}
    </a>`
  )
  .join("\n")}
</div>
${labs.length ? "" : '<p class="empty">还没有专题页。把 HTML 文件放进 <code>content/labs/</code> 即可自动出现在这里。</p>'}
`;
  writeFile("labs.html", layout({ title: "专题", body: labsBody, active: "labs.html" }));

  // 原样复制 labs 页面，并在 </body> 前插入返回条
  const labsDir = path.join(CONTENT, "labs");
  if (fs.existsSync(labsDir)) {
    for (const f of fs.readdirSync(labsDir).filter((x) => x.endsWith(".html"))) {
      let raw = fs.readFileSync(path.join(labsDir, f), "utf8");
      const back = `<div style="position:fixed;left:16px;bottom:16px;z-index:9999;font:14px/1.4 -apple-system,'PingFang SC','Microsoft YaHei',sans-serif"><a href="../labs.html" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;background:rgba(20,24,32,.82);color:#fff;text-decoration:none;backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.18)">← 返回博客专题</a></div>`;
      raw = raw.includes("</body>") ? raw.replace("</body>", back + "\n</body>") : raw + back;
      writeFile(path.join("labs", f), raw);
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
  const searchBody = `
<section class="page-head">
  <h1>搜索</h1>
  <p class="page-sub">在 ${posts.length} 篇记录里找点东西</p>
</section>
<div class="search-box">
  <input id="search-input" type="search" placeholder="输入关键词，比如「量子」「周记」…" autocomplete="off" autofocus>
</div>
<div id="search-results" class="post-list"></div>
<p id="search-empty" class="empty" hidden>没有找到相关内容。</p>
`;
  writeFile(
    "search.html",
    layout({
      title: "搜索",
      body: searchBody,
      head: '<link rel="preload" href="search-index.json" as="fetch" crossorigin>',
    })
  );

  const index = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: isoDate(p.date),
    dateText: fmtDate(p.date),
    cat: catInfo(p.category).name,
    tags: p.tags,
    summary: p.summary,
    text: p.body.replace(/[#>*`|-]/g, " ").replace(/\s+/g, " ").slice(0, 600),
  }));
  writeFile("search-index.json", JSON.stringify(index));

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
  copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
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
