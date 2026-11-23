// ============================================================
//  静态博客构建脚本 —— Node.js，公式排版由随项目提供的 KaTeX 完成
//  用法：node build.mjs
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { site, categories, labGroups } from "./site.config.mjs";
import { composePage } from "./tools/compose-page.mjs";
import { libraryPage, articleLibraryControls } from "./tools/library-page.mjs";
import markdown from "./tools/markdown.cjs";
import { typeset, mathStyles, katexVersion } from "./tools/math.mjs";

const { mdToHtml, esc, markHtmlMath, parseFrontmatter, isNoteSlug } = markdown;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, "content");
// 构建产物目录。用 GitHub Pages「分支 + /docs」方式发布时必须是 docs；
// 想用 dist（比如拖到 Netlify Drop）就设置环境变量 OUT_DIR=dist
const DIST = path.join(ROOT, process.env.OUT_DIR || "docs");

/* ---------------------------------------------------------- */
/*  工具函数                                                   */
/* ---------------------------------------------------------- */

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

function sectionAnchor(section) {
  return section ? `type-${section}` : "unassigned-notes";
}

const iconPaths = {
  book: '<path d="M3 4.5c3.2-.9 6.1-.4 9 1.4 2.9-1.8 5.8-2.3 9-1.4v14c-3.2-.9-6.1-.4-9 1.4-2.9-1.8-5.8-2.3-9-1.4zM12 6v14"/>',
  research: '<circle cx="12" cy="12" r="1.3"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-35 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(55 12 12)"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 12c5 3 13 3 18 0M10 13h4"/>',
  life: '<path d="M21 3c0 9-2 15-9 16-5 .8-9-2.5-8-7.4C5.4 5.3 13.6 6.3 21 3ZM3 21l12-12"/>',
  essay: '<path d="m4 17 12-12a2.2 2.2 0 0 1 3 3L7 20l-4 1zM14 7l3 3"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  bookmark: '<path d="M6 4h12v16l-6-4-6 4z"/>',
};

function icon(key) {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${Object.hasOwn(iconPaths, key) ? iconPaths[key] : iconPaths.folder}</svg>`;
}

/* ---------------------------------------------------------- */
/*  内容加载                                                    */
/* ---------------------------------------------------------- */

function readPosts() {
  const dir = path.join(CONTENT, "posts");
  if (!fs.existsSync(dir)) return [];
  const posts = [];
  const slugs = new Map();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true || data.draft === "true") continue;
    const slug = data.slug || f.replace(/\.md$/, "");
    if (!isNoteSlug(slug)) {
      throw new Error(f + " 的网址名无效，请在 slug 中填写可用作单个文件名的文字。");
    }
    const slugKey = slug.toLowerCase();
    if (slugs.has(slugKey)) {
      throw new Error(f + " 和 " + slugs.get(slugKey) + " 的网址名重复。");
    }
    slugs.set(slugKey, f);
    const date = data.date ? new Date(String(data.date).replace(/\//g, "-")) : new Date();
    const { html, toc } = mdToHtml(body);
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
    const category = data.category || "essay";
    const sections = catInfo(category).sections ?? {};
    const section = typeof data.section === "string" && Object.hasOwn(sections, data.section)
      ? data.section : "";
    posts.push({
      slug,
      title: data.title || slug,
      date: isNaN(date) ? new Date() : date,
      category,
      section,
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
  if (body.includes('<span data-blog-math="')) {
    body = typeset(body, fullTitle);
    head += mathStyles(rel);
  }
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
      <a class="header-icon-link" href="${rel}search.html" title="搜索" aria-label="搜索">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </a>
      <a class="header-icon-link${active === "library.html" ? " active" : ""}" href="${rel}library.html" title="阅读夹" aria-label="阅读夹"${active === "library.html" ? ' aria-current="page"' : ""}>${icon("bookmark")}</a>
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
    <span class="dot">·</span>
    <a href="${rel}library.html">阅读夹</a>
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

function categoryDirectory(collection, rel) {
  const groups = new Map(Object.entries(collection.sections ?? {}).map(([key, name]) =>
    [key, { name, posts: [] }]));
  groups.set("", { name: "未细分", posts: [] });
  for (const post of collection.items) groups.get(post.section).posts.push(post);
  const visibleGroups = [...groups].filter(([, group]) => group.posts.length);
  return `
    <div class="note-directory">
      <nav class="directory-nav" aria-label="笔记目录">
        <p class="directory-label">笔记目录</p>
        <ul>${visibleGroups.map(([key, group]) => `<li><a href="#${encodeURIComponent(sectionAnchor(key))}">
          ${esc(group.name)}<span>${group.posts.length} 篇</span>
        </a></li>`).join("")}</ul>
      </nav>
      <div class="directory-groups">${visibleGroups.map(([key, group]) => `
        <section class="directory-group" id="${escAttr(sectionAnchor(key))}">
          <h2>${esc(group.name)}</h2>
          <ul>${group.posts.map((p) => `
            <li class="directory-entry">
              <div class="directory-entry-head">
                <h3><a href="${rel}posts/${encodeURIComponent(p.slug)}.html">${esc(p.title)}</a></h3>
                <time datetime="${isoDate(p.date)}">${isoDate(p.date)}</time>
              </div>
              ${p.summary ? `<p>${esc(p.summary)}</p>` : ""}
            </li>`).join("")}
          </ul>
        </section>`).join("")}
      </div>
    </div>`;
}

function relatedNotes(post, posts) {
  const related = posts.filter((other) => other !== post).map((other) => {
    const shared = other.tags.filter((tag) => post.tags.includes(tag));
    const sameSection = post.section && post.category === other.category && post.section === other.section;
    return { other, shared, score: shared.length + Number(Boolean(sameSection)) };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!related.length) return "";

  return `<section class="related-notes" aria-labelledby="related-notes-title">
    <h2 id="related-notes-title">相关笔记</h2>
    <ul>${related.map(({ other, shared }) => `<li>
      <a href="${encodeURIComponent(other.slug)}.html">${esc(other.title)}</a>
      ${shared.length ? `<small>${shared.map((tag) => "#" + esc(tag)).join(" · ")}</small>` : ""}
    </li>`).join("")}</ul>
  </section>`;
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

  fs.copyFileSync(path.join(ROOT, "tools/markdown.cjs"), path.join(destination, "note-preview.js"));
  const files = ["style.css", "site.js", "search.css", "compose.css", "compose.js", "note-preview.js", "library.css", "library.js"];
  const assets = Object.fromEntries(files.map((name) => [name, `assets/${versioned(name)}`]));
  const browserKatex = `katex/${katexVersion}/katex.min.js`;
  fs.copyFileSync(path.join(ROOT, "tools/vendor/katex/katex.cjs"), path.join(destination, browserKatex));
  assets["katex.js"] = `assets/${versioned(browserKatex)}`;
  return assets;
}

export function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const t0 = Date.now();
  const posts = readPosts();
  const labs = readLabs();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const assets = prepareAssets();
  const layout = (options) => renderPage(assets, options);
  const libraryAssets = (rel = "") => `<link rel="stylesheet" href="${rel}${assets["library.css"]}">
<script defer src="${rel}${assets["library.js"]}"></script>`;
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
      <p class="page-sub">${entries.length} 篇记录 · ${collection
        ? `<a href="${rel}search.html?scope=${encodeURIComponent("category:" + collection.key)}">搜索本类</a>`
        : "按日期排列"}</p>
    </section>
    <nav class="filters archive-filters" aria-label="按分类浏览">
      <a href="${rel}posts.html"${collection ? ' class="chip"' : current}>全部</a>
      ${collections.map((c) => `<a href="${rel}${categoryPath(c.key)}"${c === collection ? current : ' class="chip"'}>${esc(c.name)} <span>${c.items.length}</span></a>`).join("")}
    </nav>
${collection ? categoryDirectory(collection, rel) : `
    <div class="post-list">${entries.map((p) => postCard(p, rel)).join("\n") || '<p class="empty">还没有已发布的笔记。</p>'}</div>`}`;
  }
  writeFile("posts.html", layout({ title: "全部文章", body: archiveBody(), active: "posts.html" }));
  for (const c of collections) {
    writeFile(categoryPath(c.key), layout({ title: c.name, body: archiveBody(c), rel: "../", active: "posts.html" }));
  }
  writeFile("compose.html", layout({ title: "写笔记", body: composePage(categories, assets) }));
  const libraryEntries = posts.map((p) => ({
    slug: p.slug,
    href: `posts/${encodeURIComponent(p.slug)}.html`,
    title: p.title,
    category: catInfo(p.category).name,
  }));
  writeFile("library.html", layout({
    title: "阅读夹",
    body: libraryPage(libraryEntries),
    active: "library.html",
    head: `<meta name="robots" content="noindex">${libraryAssets()}`,
  }));

  /* ---- 文章详情 ---- */
  posts.forEach((p, idx) => {
    const cat = catInfo(p.category);
    const prev = posts[idx + 1]; // 更早
    const next = posts[idx - 1]; // 更新
    const tocLinks = p.toc.map((t) => `<a class="toc-${t.level}" href="#${t.id}">${t.label}</a>`).join("\n");

    const body = `
<article class="post">
  <div class="post-head">
    <div class="post-kicker">
      <a class="cat-pill" href="../${categoryPath(p.category)}" style="--c:${cat.color}">${esc(cat.name)}</a>
      ${p.section ? `<a class="post-type" href="../${categoryPath(p.category)}#${encodeURIComponent(sectionAnchor(p.section))}">${esc(cat.sections[p.section])}</a>` : ""}
      <time datetime="${isoDate(p.date)}">${fmtDate(p.date)}</time>
      <span>${p.minutes} 分钟阅读</span>
    </div>
    <h1 class="post-title">${esc(p.title)}</h1>
    ${p.summary ? `<p class="post-lede">${esc(p.summary)}</p>` : ""}
    ${p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<a class="tag" href="../tags/${encodeURIComponent(tagSlug(t))}.html">#${esc(t)}</a>`).join(" ")}</div>` : ""}
    ${articleLibraryControls(p.slug)}
  </div>
  <div class="post-body${p.toc.length ? " with-toc" : ""}">
    ${tocLinks ? `<details class="toc-inline"><summary>文章目录 · ${p.toc.length} 节</summary><nav aria-label="文章目录">${tocLinks}</nav></details>` : ""}
    <div class="prose">${p.html}</div>
    ${tocLinks ? `<nav class="toc" aria-label="目录"><div class="toc-title">目录</div>${tocLinks}</nav>` : ""}
  </div>
${relatedNotes(p, posts)}
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
        head: libraryAssets("../"),
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
      raw = markHtmlMath(raw);
      if (raw.includes('<span data-blog-math="')) {
        raw = typeset(raw, l.name);
        const stylesheet = mathStyles("../");
        raw = /<\/head\s*>/i.test(raw) ? raw.replace(/<\/head\s*>/i, (tag) => stylesheet + tag) : stylesheet + raw;
      }
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
      section: p.section,
      ...(p.section && {
        sectionName: catInfo(p.category).sections[p.section],
        sectionHref: `${categoryPath(p.category)}#${encodeURIComponent(sectionAnchor(p.section))}`,
        sectionOrder: Object.keys(catInfo(p.category).sections).indexOf(p.section),
      }),
      headings: p.toc.map(({ id, label }) => ({ id, label: searchText(label) })).filter(({ label }) => label),
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
  <p class="page-sub">搜索 ${posts.length} 篇文章与 ${labs.length} 个专题。可按分类和笔记类型缩小范围。</p>
</section>
<form id="search-form" class="search-box" action="search.html" method="get" role="search">
  <label for="search-input">关键词</label>
  <input id="search-input" name="q" type="search" placeholder="例如：里德堡、量子门" autocomplete="off">
  <label for="search-scope">搜索范围</label>
  <select id="search-scope" name="scope"><option value="">全部内容</option>${scopeGroup("article", "文章")}${scopeGroup("lab", "专题")}</select>
  <label for="search-section" hidden>笔记类型</label>
  <select id="search-section" name="section" hidden disabled><option value="">全部类型</option></select>
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
