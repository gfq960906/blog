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
    const section = searchForm.elements.section;
    const sectionLabel = searchForm.querySelector('label[for="search-section"]');
    const results = document.getElementById("search-results");
    const status = document.getElementById("search-status");
    const index = JSON.parse(document.getElementById("search-data").textContent);
    const data = index.map((entry) => ({
      entry,
      title: entry.title.toLowerCase(),
      labels: [entry.cat, entry.sectionName, ...entry.tags].filter(Boolean).join(" ").toLowerCase(),
      headings: (entry.headings || []).map(({ id, label }) => ({ id, label, text: label.toLowerCase() })),
      summary: entry.summary.toLowerCase(),
      text: entry.text.toLowerCase(),
    }));
    const sectionsByScope = new Map();
    for (const entry of index) {
      if (!entry.section) continue;
      if (!sectionsByScope.has(entry.scope)) sectionsByScope.set(entry.scope, new Map());
      sectionsByScope.get(entry.scope).set(entry.section, entry);
    }

    function syncSections(value) {
      if (!section) return;
      const choices = [...(sectionsByScope.get(scope.value)?.values() || [])]
        .sort((a, b) => a.sectionOrder - b.sectionOrder);
      section.replaceChildren(new Option("全部类型", ""), ...choices.map((choice) =>
        new Option(choice.sectionName, choice.section)));
      section.value = choices.some((choice) => choice.section === value) ? value : "";
      section.hidden = section.disabled = choices.length === 0;
      sectionLabel.hidden = section.hidden;
      searchForm.classList.toggle("has-types", !section.hidden);
    }

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
      if (p.sectionHref) {
        const typeLink = document.createElement("a");
        typeLink.href = p.sectionHref;
        highlight(typeLink, p.sectionName, pattern);
        meta.append(typeLink);
      }
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
      const relevant = item.headings.filter(({ text }) => terms.some((term) => text.includes(term))).slice(0, 2);
      if (relevant.length) {
        const chapters = document.createElement("ul");
        chapters.className = "search-chapters";
        chapters.setAttribute("aria-label", "匹配的章节");
        for (const { id, label } of relevant) {
          const li = document.createElement("li");
          const jump = document.createElement("a");
          jump.href = p.href + "#" + encodeURIComponent(id);
          highlight(jump, label, pattern);
          li.append(jump);
          chapters.append(li);
        }
        card.append(chapters);
      }
      return card;
    }

    function render() {
      const query = input.value.trim().toLowerCase();
      const terms = [...new Set(query.split(/\s+/).filter(Boolean))];
      const matches = [];
      for (const item of data) {
        const p = item.entry;
        if (scope.value && scope.value !== p.kind && scope.value !== p.scope) continue;
        if (section?.value && section.value !== p.section) continue;
        let score = query && item.title.includes(query) ? 10 : 0;
        const matched = terms.every((term) => {
          if (item.title.includes(term)) score += 10;
          else if (item.labels.includes(term)) score += 5;
          else if (item.headings.some(({ text }) => text.includes(term))) score += 4;
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
      syncSections(params.get("section"));
      render();
    }
    function update(method) {
      const url = new URL(location.href);
      const params = new URLSearchParams();
      if (input.value.trim()) params.set("q", input.value.trim());
      if (scope.value) params.set("scope", scope.value);
      if (section?.value) params.set("section", section.value);
      if (offline) url.hash = "?" + params.toString();
      else url.search = params.toString();
      if (url.href !== location.href) history[method](null, "", url);
      render();
    }
    input.addEventListener("input", () => update("replaceState"));
    scope.addEventListener("change", () => {
      syncSections();
      update("pushState");
    });
    section?.addEventListener("change", () => update("pushState"));
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
