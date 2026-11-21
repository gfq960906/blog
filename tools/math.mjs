import katex from "./vendor/katex/katex.cjs";

// Keep the TeX as plain text until rendering the final page. The search index
// can then reuse the article HTML without indexing two copies of each formula.
export function mathMarker(tex, display = false) {
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

export function typeset(html, source) {
  return html.replace(/<span data-blog-math="(display|inline)">([^<]*)<\/span>/g, (_, mode, text) => {
    const tex = decodeText(text);
    try {
      return katex.renderToString(tex, { displayMode: mode === "display", output: "htmlAndMathml" });
    } catch (error) {
      throw new Error(source + " 中的公式无法排版：" + tex + "\n" + error.message, { cause: error });
    }
  });
}

export function mathStyles(rel) {
  return '<link rel="stylesheet" href="' + rel + 'assets/katex/' + katex.version + '/katex.min.css">' +
    '<style>.katex{font-size:1.06em}.katex-display{max-width:100%;overflow-x:auto;overflow-y:hidden;padding:.35em 0}.katex-display>.katex{width:max-content;min-width:100%}</style>';
}

// Transform only character data in authored HTML. Preserve scripts (including
// bibliography JSON), examples, attributes, styles, and existing MathML.
export function markHtmlMath(html) {
  if (!html.includes("\\(") && !html.includes("\\[")) return html;
  const tokens = /<!--[\s\S]*?-->|<(head|script|style|pre|code|textarea|svg|math|template|title)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<[!/]?[a-z][\w:.-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|([^<]+)/gi;
  return html.replace(tokens, (token, _protected, text) => {
    if (!text) return token;
    return text.replace(/\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g, (_, inline, block) =>
      mathMarker(decodeText(inline ?? block), block !== undefined));
  });
}
