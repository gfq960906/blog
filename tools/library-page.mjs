import markdown from "./markdown.cjs";

const { esc } = markdown;

export function articleLibraryControls(slug) {
  return `<div class="article-library" data-library-post="${esc(slug)}" hidden>
    <button type="button" class="library-button" data-library-bookmark aria-pressed="false">收藏</button>
    <button type="button" class="library-button" data-library-resume hidden>继续上次阅读</button>
    <span class="library-feedback" role="status"></span>
  </div>`;
}

export function libraryPage(entries) {
  const catalog = JSON.stringify(entries).replace(/</g, "\\u003c");
  return `
<section class="page-head">
  <h1>阅读夹</h1>
  <p class="page-sub">收藏和最近阅读保存在当前浏览器。</p>
</section>
<noscript><p>启用 JavaScript 后可查看收藏和最近阅读。</p></noscript>
<p id="library-status" class="library-feedback" role="status"></p>
<div id="reading-library" class="reading-library" hidden>
  <section class="library-panel" aria-labelledby="library-bookmarks-heading">
    <div class="library-panel-head">
      <h2 id="library-bookmarks-heading" tabindex="-1">收藏</h2>
    </div>
    <p id="library-empty-bookmarks" class="library-empty">打开一篇笔记，点击「收藏」即可在这里找回。</p>
    <ul id="library-bookmarks" class="library-list"></ul>
  </section>
  <section class="library-panel" aria-labelledby="library-history-heading">
    <div class="library-panel-head">
      <h2 id="library-history-heading" tabindex="-1">最近阅读</h2>
      <button type="button" class="library-button" id="library-clear-history" hidden>清空记录</button>
    </div>
    <p id="library-empty-history" class="library-empty">读过的笔记会出现在这里。</p>
    <ul id="library-history" class="library-list"></ul>
  </section>
</div>
<script type="application/json" id="library-catalog">${catalog}</script>`;
}
