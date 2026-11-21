import { mathMarker } from "./math.mjs";

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function composePage(categories, assets) {
  const inlineExample = "B \\gg \\Omega";
  const displayExample = "B = \\frac{C_6}{R^6}";
  const options = Object.entries(categories).map(([key, category]) =>
    `<option value="${escapeHtml(key)}"${key === "research" ? " selected" : ""}>${escapeHtml(category.name)}</option>`
  );
  return `
<link rel="stylesheet" href="${assets["compose.css"]}">
<section class="page-head">
  <h1>写笔记</h1>
  <p class="page-sub">草稿保存在当前浏览器。写完后可导出 Markdown，放入博客的 <code>content/posts/</code> 目录。</p>
</section>
<noscript><p>请启用 JavaScript 以保存草稿或导出笔记。</p></noscript>
<form id="note-editor" class="note-editor" method="dialog" autocomplete="off">
  <div class="note-writing">
    <label for="note-title">标题</label>
    <input id="note-title" name="title" type="text" placeholder="这篇笔记记录什么？" required>
    <label for="note-body">正文 <small>Markdown</small></label>
    <textarea id="note-body" name="body" rows="15" placeholder="从一个问题、一次实验或一段阅读开始……" required></textarea>
    <details class="note-math-help">
      <summary>怎样写公式？</summary>
      <p>行内写 <code>$${inlineExample}$</code>，排版为 ${mathMarker(inlineExample)}。</p>
      <p>单独一行的公式用双美元符号包围。</p>
      <pre><code>$$
${displayExample}
$$</code></pre>
      ${mathMarker(displayExample, true)}
    </details>
  </div>
  <fieldset class="note-details">
    <legend>笔记信息</legend>
    <label for="note-category">分类</label>
    <select name="category" id="note-category" required>${options.join("")}</select>
    <label for="note-date">日期</label>
    <input type="date" name="date" id="note-date" required>
    <label for="note-tags">标签 <small>用逗号分隔</small></label>
    <input name="tags" id="note-tags" type="text" placeholder="如 中性原子，文献整理">
    <label for="note-summary">摘要 <small>选填</small></label>
    <input name="summary" id="note-summary" type="text" placeholder="写下一句话结论">
  </fieldset>
  <div class="note-actions">
    <button type="submit" class="note-download" disabled>导出 Markdown</button>
    <button type="button" class="note-new" disabled>新建空白笔记</button>
    <span class="note-status" role="status" aria-live="polite"></span>
  </div>
</form>
<script defer src="${assets["compose.js"]}"></script>`;
}
