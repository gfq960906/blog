/* 站点交互：主题切换 / 站内搜索 / 阅读进度 */
(function () {
  "use strict";

  /* ---------- 主题 ---------- */
  const root = document.documentElement;
  const key = "blog-theme";
  try {
    const saved = localStorage.getItem(key);
    if (saved) root.setAttribute("data-theme", saved);
  } catch { /* 浏览器禁用本地存储时使用当前主题。 */ }

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(key, next); } catch { /* 此次切换仍然有效。 */ }
    });
  }

  /* ---------- 阅读进度 ---------- */
  const bar = document.getElementById("progress-bar");
  if (bar) {
    const update = function () {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      bar.style.width = (total > 0 ? (h.scrollTop / total) * 100 : 0) + "%";
    };
    document.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- 目录高亮 ---------- */
  const toc = document.querySelector(".toc");
  if (toc) {
    const links = Array.from(toc.querySelectorAll("a"));
    const targets = links
      .map((a) => document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))))
      .filter(Boolean);
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach((l) =>
            l.classList.toggle("current", l.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- 站内搜索 ---------- */
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    const input = searchForm.elements.q;
    const scope = searchForm.elements.scope;
    const results = document.getElementById("search-results");
    const status = document.getElementById("search-status");
    const index = JSON.parse(document.getElementById("search-data").textContent);
    const data = index.map((entry) => ({
      entry,
      title: entry.title.toLowerCase(),
      labels: [entry.cat, ...entry.tags].join(" ").toLowerCase(),
      summary: entry.summary.toLowerCase(),
      text: entry.text.toLowerCase(),
    }));

    function highlight(element, text, pattern) {
      if (!pattern) { element.textContent = text; return; }
      let end = 0;
      for (const match of text.matchAll(pattern)) {
        element.append(text.slice(end, match.index));
        const mark = document.createElement("mark");
        mark.textContent = match[0];
        element.append(mark);
        end = match.index + match[0].length;
      }
      element.append(text.slice(end));
    }

    function excerpt(text, pos) {
      const start = Math.max(0, pos - 30);
      const end = Math.min(text.length, start + 125);
      return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    }

    function resultCard(item, terms, pattern) {
      const p = item.entry;
      const card = document.createElement("article");
      card.className = "post-card";
      const meta = document.createElement("div");
      meta.className = "card-meta";
      const kind = p.kind === "lab" ? "专题" : "文章";
      const labels = [kind, p.cat, ...p.tags.filter((tag) =>
        terms.some((term) => tag.toLowerCase().includes(term)))];
      const label = document.createElement("span");
      highlight(label, [...new Set(labels)].join(" · "), pattern);
      meta.append(label);
      if (p.date) {
        const time = document.createElement("time");
        time.dateTime = p.date;
        time.textContent = p.dateText;
        meta.append(time);
      }
      const heading = document.createElement("h2");
      heading.className = "card-title";
      const link = document.createElement("a");
      link.href = p.href;
      highlight(link, p.title, pattern);
      heading.append(link);
      const context = document.createElement("p");
      context.className = "search-excerpt";
      const bodyTerm = terms.find((term) => !item.summary.includes(term) && item.text.includes(term));
      const snippet = bodyTerm ? excerpt(p.text, item.text.indexOf(bodyTerm)) : p.summary || excerpt(p.text, 0);
      highlight(context, snippet, pattern);
      card.append(meta, heading, context);
      return card;
    }

    function render() {
      const terms = [...new Set(input.value.trim().toLowerCase().split(/\s+/).filter(Boolean))];
      const matches = [];
      for (const item of data) {
        const p = item.entry;
        if (scope.value && scope.value !== p.kind && scope.value !== p.scope) continue;
        let score = 0;
        const matched = terms.every((term) => {
          if (item.title.includes(term)) score += 10;
          else if (item.labels.includes(term)) score += 5;
          else if (item.summary.includes(term)) score += 3;
          else if (item.text.includes(term)) score += 1;
          else return false;
          return true;
        });
        if (matched) matches.push({ item, score });
      }
      matches.sort((a, b) => b.score - a.score || b.item.entry.date.localeCompare(a.item.entry.date));
      const escaped = terms.sort((a, b) => b.length - a.length)
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const pattern = escaped.length ? new RegExp(escaped.join("|"), "gi") : null;
      results.replaceChildren(...matches.map(({ item }) => resultCard(item, terms, pattern)));
      status.textContent = matches.length
        ? `共 ${matches.length} 条${terms.length ? "搜索结果" : "记录"}`
        : "没有找到匹配的记录。试试更短的关键词，或切换搜索范围。";
    }

    const offline = location.protocol === "file:";
    function restore() {
      const params = new URLSearchParams(offline && location.hash.startsWith("#?")
        ? location.hash.slice(2) : location.search);
      input.value = params.get("q") || "";
      scope.value = params.get("scope") || "";
      if (scope.selectedIndex < 0) scope.value = "";
      render();
    }
    function update(method) {
      const url = new URL(location.href);
      const params = new URLSearchParams();
      if (input.value.trim()) params.set("q", input.value.trim());
      if (scope.value) params.set("scope", scope.value);
      if (offline) url.hash = "?" + params.toString();
      else url.search = params.toString();
      if (url.href !== location.href) history[method](null, "", url);
      render();
    }
    input.addEventListener("input", () => update("replaceState"));
    scope.addEventListener("change", () => update("pushState"));
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      update("replaceState");
    });
    window.addEventListener("popstate", restore);
    restore();
  }

  /* ---------- 代码块一键复制 ---------- */
  document.querySelectorAll(".prose pre").forEach(function (pre) {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      const code = pre.querySelector("code");
      navigator.clipboard.writeText(code ? code.innerText : pre.innerText).then(function () {
        btn.textContent = "已复制";
        setTimeout(() => (btn.textContent = "复制"), 1500);
      });
    });
    pre.appendChild(btn);
  });
})();
