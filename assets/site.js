/* 站点交互：主题切换 / 分类过滤 / 站内搜索 / 阅读进度 */
(function () {
  "use strict";

  /* ---------- 主题 ---------- */
  const root = document.documentElement;
  const key = "blog-theme";
  const saved = localStorage.getItem(key);
  if (saved) root.setAttribute("data-theme", saved);

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(key, next);
    });
  }

  /* ---------- 分类过滤 ---------- */
  const filters = document.getElementById("filters");
  if (filters) {
    filters.addEventListener("click", function (e) {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const val = btn.dataset.filter;
      filters.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
      document.querySelectorAll("#post-list .post-card").forEach((card) => {
        card.style.display = val === "all" || card.dataset.cat === val ? "" : "none";
      });
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
  const input = document.getElementById("search-input");
  if (input) {
    const results = document.getElementById("search-results");
    const empty = document.getElementById("search-empty");
    let data = null;

    const load = fetch("search-index.json")
      .then((r) => r.json())
      .then((json) => (data = json))
      .catch(function () {
        empty.hidden = false;
        empty.textContent = "搜索索引加载失败，请通过本地服务器或部署后的网址访问。";
      });

    const render = function (list) {
      results.innerHTML = list
        .map(function (p) {
          return (
            '<article class="post-card">' +
            '<div class="card-meta"><time>' + p.dateText + "</time>" +
            '<span class="cat-name">' + p.cat + "</span></div>" +
            '<h2 class="card-title"><a href="' + p.href + '">' + p.title + "</a></h2>" +
            (p.summary ? '<p class="card-summary">' + p.summary + "</p>" : "") +
            "</article>"
          );
        })
        .join("");
      empty.hidden = list.length > 0;
      if (!list.length) empty.textContent = "没有找到相关内容，换个词试试？";
    };

    const search = function () {
      if (!data) return;
      const q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ""; empty.hidden = true; return; }
      const terms = q.split(/\s+/);
      const scored = data
        .map(function (p) {
          const hay = (p.title + " " + p.summary + " " + p.tags.join(" ") + " " + p.text).toLowerCase();
          let score = 0;
          terms.forEach(function (t) {
            if (!hay.includes(t)) return;
            if (p.title.toLowerCase().includes(t)) score += 10;
            if (p.tags.join(" ").toLowerCase().includes(t)) score += 5;
            score += 1;
          });
          return { p: p, score: score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
        .map((x) => x.p);
      render(scored);
    };

    input.addEventListener("input", search);
    load.then(search);

    const q = new URLSearchParams(location.search).get("q");
    if (q) { input.value = q; load.then(search); }
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
