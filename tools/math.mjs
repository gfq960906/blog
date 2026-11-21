import katex from "./vendor/katex/katex.cjs";
import markdown from "./markdown.cjs";

const { typesetMarkers } = markdown;

export const katexVersion = katex.version;

export function typeset(html, source) {
  return typesetMarkers(html, katex, (tex, error) => {
    throw new Error(source + " 中的公式无法排版：" + tex + "\n" + error.message, { cause: error });
  });
}

export function mathStyles(rel) {
  return '<link rel="stylesheet" href="' + rel + 'assets/katex/' + katex.version + '/katex.min.css">' +
    '<style>.katex{font-size:1.06em}.katex-display{max-width:100%;overflow-x:auto;overflow-y:hidden;padding:.35em 0}.katex-display>.katex{width:max-content;min-width:100%}</style>';
}
