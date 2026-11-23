(() => {
  "use strict";

  const page = document.getElementById("reading-library");
  const article = document.querySelector("[data-library-post]");
  if (!page && !article) return;

  const base = new URL(article ? "../" : "./", document.baseURI);
  const bookmarkKey = "blog-bookmarks:" + base.pathname;
  const historyKey = "blog-reading-history:" + base.pathname;
  const failure = "当前浏览器无法保存阅读夹记录。";
  const historyLimit = 30;

  function read(key) {
    const saved = localStorage.getItem(key);
    let rows;
    try { rows = JSON.parse(saved); } catch { rows = []; }
    return new Map((Array.isArray(rows) ? rows : [])
      .filter((row) => typeof row?.slug === "string" && Number.isFinite(row.at) && row.at > 0 && row.at <= 8.64e15)
      .map((row) => [row.slug, row]));
  }

  function write(key, rows) {
    localStorage.setItem(key, JSON.stringify([...rows.values()]));
  }

  function progressOf(row) {
    return Number.isFinite(row?.progress) ? Math.min(1, Math.max(0, row.progress)) : 0;
  }

  function canResume(row) {
    const progress = progressOf(row);
    return progress >= .02 && progress < .98;
  }

  function byRecency(rows) {
    return [...rows.values()].sort((a, b) => b.at - a.at);
  }

  function whenStoredChanges(update) {
    window.addEventListener("storage", (event) => {
      if (event.key === null || event.key === bookmarkKey || event.key === historyKey) update();
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) update();
    });
  }

  if (article) {
    const slug = article.dataset.libraryPost;
    const prose = article.closest("article").querySelector(".prose");
    const bookmark = article.querySelector("[data-library-bookmark]");
    const resume = article.querySelector("[data-library-resume]");
    const feedback = article.querySelector(".library-feedback");
    const header = document.querySelector(".site-header");
    let pendingScroll;
    let lastProgress;

    function updateControls() {
      try {
        bookmark.setAttribute("aria-pressed", String(read(bookmarkKey).has(slug)));
        resume.hidden = !canResume(read(historyKey).get(slug));
      } catch {
        feedback.textContent = failure;
      }
    }

    function remember(progress) {
      try {
        const records = read(historyKey);
        const previous = records.get(slug);
        records.set(slug, { slug, at: Date.now(), progress: progress ?? progressOf(previous) });
        localStorage.setItem(historyKey, JSON.stringify(byRecency(records).slice(0, historyLimit)));
      } catch { /* The article remains available when storage is blocked. */ }
    }

    function bounds() {
      const scroller = document.scrollingElement;
      const { top, bottom } = prose.getBoundingClientRect();
      const visibleTop = header?.getBoundingClientRect().bottom ?? 0;
      const start = scroller.scrollTop + top - visibleTop;
      const end = scroller.scrollTop + bottom - scroller.clientHeight;
      return { y: scroller.scrollTop, start, end };
    }

    function goToSavedPosition() {
      let saved;
      try { saved = read(historyKey).get(slug); } catch { return; }
      if (!canResume(saved)) return;
      const { start, end } = bounds();
      if (end <= start) return;
      const y = Math.max(0, start + (end - start) * saved.progress);
      const near = [...prose.querySelectorAll("h2, h3, h4")].filter((heading) =>
        window.scrollY + heading.getBoundingClientRect().top <= y + (header?.offsetHeight || 0) + 8).at(-1) || prose;
      near.setAttribute("tabindex", "-1");
      near.focus({ preventScroll: true });
      window.scrollTo({ top: y, behavior: "instant" });
    }

    function saveScroll() {
      if (pendingScroll === undefined) return;
      clearTimeout(pendingScroll);
      pendingScroll = undefined;
      const { y, start, end } = bounds();
      // A brief visit to the top should leave a previous position available.
      if (end <= start || y - start < Math.min(80, .18 * (end - start))) return;
      const progress = Math.min(1, Math.round((y - start) / (end - start) * 1000) / 1000);
      if (progress === lastProgress) return;
      lastProgress = progress;
      remember(progress);
      updateControls();
    }

    bookmark.addEventListener("click", () => {
      try {
        const bookmarks = read(bookmarkKey);
        const saved = bookmarks.delete(slug);
        if (!saved) bookmarks.set(slug, { slug, at: Date.now() });
        write(bookmarkKey, bookmarks);
        updateControls();
        feedback.textContent = saved ? "已取消收藏。" : "已加入阅读夹。";
      } catch {
        feedback.textContent = failure;
      }
    });
    resume.addEventListener("click", goToSavedPosition);
    article.hidden = false;
    updateControls();
    remember();
    whenStoredChanges(updateControls);

    function trackReading() {
      const link = new URL(location.href);
      if (!link.hash && link.searchParams.get("resume") === "1") {
        goToSavedPosition();
        link.searchParams.delete("resume");
        try { history.replaceState(history.state, "", link); } catch { /* Some offline browsers restrict URL changes. */ }
      }
      window.addEventListener("scroll", () => {
        if (pendingScroll === undefined) pendingScroll = setTimeout(saveScroll, 220);
      }, { passive: true });
      window.addEventListener("pagehide", saveScroll);
    }
    if (document.readyState === "complete") trackReading();
    else window.addEventListener("load", trackReading, { once: true });
    return;
  }

  const dateFormat = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" });
  const catalog = new Map(JSON.parse(document.getElementById("library-catalog").textContent)
    .map((entry) => [entry.slug, entry]));
  const bookmarkList = document.getElementById("library-bookmarks");
  const readingList = document.getElementById("library-history");
  const clear = document.getElementById("library-clear-history");
  const status = document.getElementById("library-status");

  function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function noteLink(entry) {
    const link = element("a", entry.title);
    link.href = entry.href;
    return link;
  }

  function removeBookmark(slug, origin) {
    try {
      const next = origin.closest("li").nextElementSibling?.querySelector("button")?.dataset.slug;
      const bookmarks = read(bookmarkKey);
      bookmarks.delete(slug);
      write(bookmarkKey, bookmarks);
      render();
      status.textContent = "已取消收藏。";
      const focus = [...bookmarkList.querySelectorAll("button")].find((button) => button.dataset.slug === next);
      (focus || document.getElementById("library-bookmarks-heading")).focus();
    } catch {
      status.textContent = failure;
    }
  }

  function item(row, isBookmark) {
    const entry = catalog.get(row.slug);
    const li = element("li", "", "library-entry");
    const heading = element("h3");
    heading.append(noteLink(entry));
    li.append(heading);
    const meta = element("p", entry.category, "library-entry-meta");
    const progress = progressOf(row);
    if (!isBookmark) {
      const date = new Date(row.at);
      const time = element("time", dateFormat.format(date));
      time.dateTime = date.toISOString();
      meta.append(time);
      if (progress > 0) meta.append(element("span", "进度 " + Math.round(progress * 100) + "%"));
    }
    li.append(meta);
    const actions = element("div", "", "library-entry-actions");
    if (isBookmark) {
      const remove = element("button", "取消收藏", "library-button");
      remove.type = "button";
      remove.dataset.slug = row.slug;
      remove.setAttribute("aria-label", "取消收藏《" + entry.title + "》");
      remove.addEventListener("click", () => removeBookmark(row.slug, remove));
      actions.append(remove);
    } else if (canResume(row)) {
      const link = element("a", "继续阅读");
      const target = new URL(entry.href, base);
      target.searchParams.set("resume", "1");
      link.href = target.href;
      link.setAttribute("aria-label", "继续阅读《" + entry.title + "》");
      actions.append(link);
    }
    if (actions.childElementCount) li.append(actions);
    return li;
  }

  function render() {
    try {
      const bookmarks = byRecency(read(bookmarkKey)).filter((row) => catalog.has(row.slug));
      const records = byRecency(read(historyKey)).filter((row) => catalog.has(row.slug));
      bookmarkList.replaceChildren(...bookmarks.map((row) => item(row, true)));
      readingList.replaceChildren(...records.map((row) => item(row, false)));
      document.getElementById("library-empty-bookmarks").hidden = bookmarks.length > 0;
      document.getElementById("library-empty-history").hidden = records.length > 0;
      clear.hidden = records.length === 0;
      page.hidden = false;
    } catch {
      page.hidden = true;
      status.textContent = failure;
    }
  }

  clear.addEventListener("click", () => {
    if (!window.confirm("要清空最近阅读记录和续读位置吗？")) return;
    try {
      localStorage.removeItem(historyKey);
      render();
      status.textContent = "已清空阅读记录。";
      document.getElementById("library-history-heading").focus();
    } catch {
      status.textContent = failure;
    }
  });
  whenStoredChanges(render);
  render();
})();
