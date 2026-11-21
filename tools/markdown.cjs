// Shared by the static site builder and the editor. A classic browser script
// also works when the generated blog is opened directly from the filesystem.
(() => {
  "use strict";

  const esc = (s = "") =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Keep the TeX as plain text until rendering the final page. The search index
  // can then reuse the article HTML without indexing two copies of each formula.
  function mathMarker(tex, display = false) {
    const text = tex.trim().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return '<span data-blog-math="' + (display ? "display" : "inline") + '">' + text + "</span>";
  }

  function decodeText(text) {
    const entities = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'", nbsp: " " };
    return text.replace(/&(lt|gt|amp|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi, (original, name) => {
      if (name[0] !== "#") return entities[name.toLowerCase()];
      const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return code <= 0x10ffff ? String.fromCodePoint(code) : original;
    });
  }

  function typesetMarkers(html, katex, onError) {
    return html.replace(/<span data-blog-math="(display|inline)">([^<]*)<\/span>/g, (_, mode, text) => {
      const tex = decodeText(text);
      try {
        return katex.renderToString(tex, { displayMode: mode === "display", output: "htmlAndMathml", trust: false });
      } catch (error) {
        return onError(tex, error);
      }
    });
  }

  function mathError(tex, message) {
    return '<span class="note-math-error"><code>' + esc(tex) + '</code> ' + esc(message) + '</span>';
  }

  const closingMath = { "$": "$", "$$": "$$", "\\(": "\\)", "\\[": "\\]" };

  function unclosedMath(tex, delimiter) {
    return mathError(tex, "请补上结束符 " + closingMath[delimiter]);
  }

  function renderNotePreview(markdown, katex) {
    // NUL is reserved for parser placeholders. Treat pasted controls like ordinary text.
    const { html } = mdToHtml(markdown.replaceAll("\0", "\uFFFD"), true);
    return typesetMarkers(html, katex, (tex, error) => {
      const detail = error.rawMessage || error.message.replace(/^KaTeX parse error:\s*/, "");
      const command = detail.match(/Undefined control sequence:\s*(\\\S+)/);
      let message = "公式有误：" + detail;
      if (command) message = "无法识别命令 " + command[1];
      else if (detail.includes("Expected '}'") && detail.includes("EOF")) message = "缺少右花括号 }";
      else if (detail.includes("Unexpected end of input")) message = "公式尚未写完，请检查命令的参数";
      return mathError(tex, message);
    });
  }

  // Transform only character data in authored HTML. Preserve scripts (including
  // bibliography JSON), examples, attributes, styles, and existing MathML.
  function markHtmlMath(html) {
    if (!html.includes("\\(") && !html.includes("\\[")) return html;
    const tokens = /<!--[\s\S]*?-->|<(head|script|style|pre|code|textarea|svg|math|template|title)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<[!/]?[a-z][\w:.-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|([^<]+)/gi;
    return html.replace(tokens, (token, _protected, text) => {
      if (!text) return token;
      return text.replace(/\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g, (_, inline, block) =>
        mathMarker(decodeText(inline ?? block), block !== undefined));
    });
  }

  function protectInline(text, preview) {
    // Match code spans and link destinations first. A single dollar opens only
    // before non-space text and closes only after non-space text, never before a digit.
    const tokens = /(?<ticks>\x60+)(?!\x60)(?<code>[\s\S]*?)(?<!\x60)\k<ticks>(?!\x60)|!\[[^\]]*\]\([^)]*\)|\]\([^)]*\)|\\(?<literal>[$|\\])|\\\((?<paren>.+?)\\\)|\\\[(?<bracket>.+?)\\\]|\$\$(?<display>.+?)\$\$|\$(?![\s$])(?<math>(?:\\.|[^$\\])+?)(?<!\s)\$(?![\d$])/g;
    // In the editor also report unfinished delimiters without treating a price as TeX.
    const pattern = preview ? new RegExp(tokens.source + String.raw`|(?<open>\\\(|\\\[|\$\$|\$(?=[^\s\d$]))`, "g") : tokens;
    const fragments = [];
    const masked = text.replace(pattern, (token, ...args) => {
      const g = args.at(-1);
      let fragment;
      if (g.code !== undefined) fragment = "<code>" + esc(g.code) + "</code>";
      else if (g.literal !== undefined) fragment = esc(g.literal);
      else if (g.math ?? g.paren ?? g.display ?? g.bracket) {
        fragment = mathMarker(g.math ?? g.paren ?? g.display ?? g.bracket, g.display !== undefined || g.bracket !== undefined);
      } else if (g.open) fragment = unclosedMath(g.open, g.open);
      else return token;
      fragments.push(fragment);
      return "\u0000F" + (fragments.length - 1) + "\u0000";
    });
    return { masked, restore: (html) => html.replace(/\u0000F(\d+)\u0000/g, (_, i) => fragments[i]) };
  }

  function formatInline(text, preview) {
    let t = esc(text);
    const references = [];
    // Put validated attributes back only after inline emphasis has been processed.
    function reference(html) {
      return "\0R" + (references.push(html) - 1) + "\0";
    }

    // 图片
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, alt, src, title) => {
      if (preview) {
        const url = previewUrl(src);
        return url ? reference('<img loading="lazy" referrerpolicy="no-referrer" src="' + url + '" alt="' + alt + '">') : alt;
      }
      return `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ""} loading="lazy">`;
    });

    // 链接（外链自动加 target=_blank）
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, label, href, title) => {
      if (preview) {
        const url = previewUrl(href, true);
        if (!url) return label;
        const attrs = url.startsWith("#") ? "" : ' target="_blank" rel="noopener noreferrer"';
        return reference('<a href="' + url + '"' + attrs + '>') + label + reference('</a>');
      }
      const external = /^https?:\/\//i.test(href);
      const attrs = external ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${href}"${title ? ` title="${title}"` : ""}${attrs}>${label}</a>`;
    });

    // 粗体 / 斜体 / 删除线
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    t = t.replace(/==([^=]+)==/g, "<mark>$1</mark>");

    return preview ? t.replace(/\0R(\d+)\0/g, (_, i) => references[i]) : t;
  }

  function previewUrl(escaped, isLink = false) {
    const value = decodeText(escaped);
    if (isLink && value.startsWith("#")) return esc("#note-preview-" + value.slice(1));
    try {
      // Published posts live one directory below the editor. Use their base for relative paths.
      const postBase = new URL("posts/", globalThis.location?.href || "https://preview.invalid/");
      const url = new URL(value, postBase);
      if (["http:", "https:"].includes(url.protocol) || (isLink && url.protocol === "mailto:")) return esc(url.href);
    } catch { /* Incomplete links stay as text while editing. */ }
    return "";
  }

  function inline(text, preview) {
    const { masked, restore } = protectInline(text, preview);
    return restore(formatInline(masked, preview));
  }

  function tableCells(line, preview) {
    const { masked, restore } = protectInline(line.trim().replace(/^\|/, "").replace(/\|$/, ""), preview);
    return masked.split("|").map((cell) => restore(formatInline(cell.trim(), preview)));
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

  function mdToHtml(src, preview = false) {
    const lines = src.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    const toc = [];
    const usedIds = new Set();
    let i = 0;

    const isBlank = (l) => l.trim() === "";
    const displayStart = /^\s*(\$\$|\\\[)/;
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
          `<pre><code${lang ? ` class="language-${esc(lang)}"` : ""}>${esc(buf.join("\n"))}</code></pre>`
        );
        continue;
      }

      // ---- 独立公式 ----
      const display = line.match(displayStart);
      if (display) {
        const end = display[1] === "$$" ? "$$" : "\\]";
        let last = i;
        const first = line.slice(display[0].length).trimEnd();
        if (!first.endsWith(end)) {
          last++;
          while (last < lines.length && !lines[last].trimEnd().endsWith(end)) last++;
        }
        if (last < lines.length) {
          const tex = [first, ...lines.slice(i + 1, last + 1)].join("\n").trimEnd().slice(0, -end.length);
          out.push(mathMarker(tex, true));
          i = last + 1;
          continue;
        }
        if (preview) {
          out.push(unclosedMath(line.trim(), display[1]));
          i++;
          continue;
        }
      }

      // ---- 标题 ----
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = h[1].length;
        const text = h[2].trim();
        const id = (preview ? "note-preview-" : "") + slugifyHeading(text.replace(/[*`_]/g, ""), usedIds);
        if (!preview && (level === 2 || level === 3)) {
          const { masked, restore } = protectInline(text);
          toc.push({ level, label: restore(esc(masked.replace(/[*_]/g, ""))), id });
        }
        out.push(`<h${level} id="${id}">${inline(text, preview)}</h${level}>`);
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
        const headCells = tableCells(line, preview);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && !isBlank(lines[i])) {
          rows.push(tableCells(lines[i], preview));
          i++;
        }
        let html = "<div class=\"table-wrap\"><table><thead><tr>";
        html += headCells.map((c) => `<th>${c}</th>`).join("");
        html += "</tr></thead><tbody>";
        for (const r of rows) {
          html += "<tr>" + r.map((c) => `<td>${c}</td>`).join("") + "</tr>";
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
        out.push(`<blockquote>${mdToHtml(buf.join("\n"), preview).html}</blockquote>`);
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
            const subHtml = mdToHtml(sub.map((s) => s.trim()).join("\n"), preview).html;
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
          html += `<li>${inline(it.text || "", preview)}${it.children ? it.children : ""}</li>`;
        }
        html += `</${tag}>`;
        out.push(html);
        continue;
      }

      // ---- 原始 HTML 块 ----
      if (/^\s*</.test(line)) {
        const buf = [];
        while (i < lines.length && !isBlank(lines[i])) buf.push(lines[i++]);
        const raw = buf.join("\n");
        out.push(preview ? "<p>" + markHtmlMath(esc(raw)) + "</p>" : markHtmlMath(raw));
        continue;
      }

      // ---- 段落 ----
      if (!isBlank(line)) {
        const buf = [];
        while (i < lines.length && !isBlank(lines[i])) {
          const l = lines[i];
          if ((buf.length && displayStart.test(l)) || /^(#{1,6})\s/.test(l) || openingFence.test(l) || /^>\s?/.test(l) || /^\s*([-*+]|\d+[.)])\s+/.test(l)) break;
          buf.push(l);
          i++;
        }
        if (buf.length) out.push(`<p>${inline(buf.join("\n").replace(/\n/g, " "), preview)}</p>`);
        continue;
      }

      i++;
    }

    return { html: out.join("\n"), toc };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { mdToHtml, markHtmlMath, mathMarker, typesetMarkers, renderNotePreview, esc };
  } else {
    window.renderBlogNotePreview = renderNotePreview;
  }
})();
