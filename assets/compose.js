(() => {
  const form = document.getElementById("note-editor");
  if (!form) return;

  const key = "note-draft:" + location.pathname.replace(/[^/]*$/, "");
  const names = ["title", "date", "category", "tags", "summary", "body"];
  const fields = Object.fromEntries(names.map(name => [name, form.elements.namedItem(name)]));
  const section = form.elements.namedItem("section");
  const initialCategory = fields.category.value;
  const status = form.querySelector(".note-status");
  const download = form.querySelector(".note-download");
  const newNote = form.querySelector(".note-new");
  const importButton = form.querySelector(".note-import");
  const importSource = document.getElementById("note-import-source");
  const importStatus = form.querySelector(".note-import-status");
  const noteSource = window.blogNoteSource;
  const preview = document.getElementById("note-preview");
  const emptyPreview = preview?.firstElementChild;
  const previewStatus = form.querySelector(".note-preview-status");
  const canPreview = preview && window.katex && typeof window.renderBlogNotePreview === "function";
  let previewTimer;
  let storageUsable = true;
  let unsavedInput = false;
  let imported = null;

  function say(message) {
    if (status.textContent !== message) status.textContent = message;
  }

  function setPreviewStatus(message) {
    if (previewStatus.textContent !== message) previewStatus.textContent = message;
  }

  function syncPreviewScroll() {
    const sourceRange = fields.body.scrollHeight - fields.body.clientHeight;
    if (preview && sourceRange > 0) {
      preview.scrollTop = fields.body.scrollTop / sourceRange * (preview.scrollHeight - preview.clientHeight);
    }
  }

  function updatePreview() {
    clearTimeout(previewTimer);
    if (!canPreview) return;
    const markdown = fields.body.value;
    if (!markdown.trim()) {
      preview.replaceChildren(emptyPreview);
      preview.scrollTop = 0;
      setPreviewStatus("");
      return;
    }
    try {
      preview.innerHTML = window.renderBlogNotePreview(markdown, window.katex);
      const errors = preview.querySelectorAll(".note-math-error").length;
      setPreviewStatus(errors ? errors + " 处公式待检查" : "");
      const body = fields.body;
      if (document.activeElement === body && body.selectionEnd === markdown.length &&
          body.scrollTop + body.clientHeight >= body.scrollHeight - 2) {
        preview.scrollTop = preview.scrollHeight;
      }
    } catch {
      preview.replaceChildren();
      setPreviewStatus("预览暂时不可用，请刷新后重试。");
    }
  }

  function today() {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function updateSections(value = "") {
    if (!section) return;
    const category = fields.category.selectedOptions[0];
    const options = Object.entries(JSON.parse(category?.dataset.sections || "{}"));
    const empty = section.options[0];
    section.replaceChildren(empty, ...options.map(([key, label]) => new Option(label, key)));
    section.value = options.some(([key]) => key === value) ? value : "";
    section.disabled = options.length === 0;
  }

  function resetFields() {
    form.reset();
    imported = null;
    if (importStatus) importStatus.textContent = "";
    updateSections();
    fields.date.value = today();
    fields.title.setCustomValidity("");
    fields.body.setCustomValidity("");
  }

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) {
        resetFields();
        return say("尚未写入本机草稿");
      }
      const draft = JSON.parse(saved);
      if (!draft || !names.every(name => typeof draft[name] === "string")) {
        throw new Error("无法读取草稿");
      }
      for (const name of names) {
        if (fields[name].value !== draft[name]) fields[name].value = draft[name];
      }
      updateSections(draft.section);
      const original = draft.imported;
      imported = original && typeof original.filename === "string" &&
        Array.isArray(original.extra) && original.extra.every(line => typeof line === "string" &&
          !/[\r\n]/.test(line) && !/^---\s*$/.test(line)) &&
        Array.isArray(original.tags) && original.tags.every(tag => typeof tag === "string") ? original : null;
      if (importStatus) importStatus.textContent = imported ? "已导入 " + imported.filename : "";
      say(fields.category.value ? "已恢复本机草稿" : "已恢复草稿，原分类已移除，请重新选择。");
    } catch {
      storageUsable = false;
      say("本机草稿暂时不可用，可导出 Markdown 保存。");
    } finally {
      updatePreview();
      syncPreviewScroll();
    }
  }

  function readFields() {
    const note = Object.fromEntries(names.map(name => [name, fields[name].value]));
    note.section = section?.value || "";
    if (imported) note.imported = imported;
    return note;
  }

  function hasContent(note) {
    return Boolean(note.title || note.body || note.tags || note.summary || note.section || note.imported ||
      note.date !== today() || note.category !== initialCategory);
  }

  function saveDraft(event) {
    if (event?.target === importSource) return;
    if (event?.target === fields.category) updateSections(section?.value);
    unsavedInput = true;
    fields.title.setCustomValidity("");
    fields.body.setCustomValidity("");
    if (!storageUsable) return;
    try {
      localStorage.setItem(key, JSON.stringify(readFields()));
      unsavedInput = false;
      say("本机草稿已保存");
    } catch {
      say("本机草稿保存失败，请导出 Markdown。");
    }
  }

  resetFields();
  restoreDraft();
  if (canPreview) {
    fields.body.addEventListener("input", () => {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(updatePreview, 90);
    });
    fields.body.addEventListener("scroll", syncPreviewScroll, { passive: true });
  } else if (preview) {
    preview.replaceChildren();
    setPreviewStatus("预览暂时不可用，请刷新后重试。");
  }
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);
  window.addEventListener("storage", event => {
    if (storageUsable && !unsavedInput && (event.key === key || event.key === null)) restoreDraft();
  });

  if (importButton && importSource && importStatus && noteSource) {
    importButton.disabled = false;
    importButton.addEventListener("click", () => importSource.click());
    importSource.addEventListener("change", async () => {
      const file = importSource.files[0];
      importSource.value = "";
      if (!file) return;
      const ext = /\.(?:md|markdown)$/i;
      if (!ext.test(file.name)) {
        importStatus.textContent = "请选择 .md 或 .markdown 文件。";
        return;
      }

      importButton.disabled = true;
      try {
        const raw = await file.text();
        if (!raw.trim() || raw.includes("\0")) {
          importStatus.textContent = "文件为空或不是 Markdown 文本。";
          return;
        }
        const { data, body, lines } = noteSource.parseFrontmatter(raw);
        if (data.slug && !noteSource.isNoteSlug(data.slug)) {
          importStatus.textContent = "请在原文件中把网址名（slug）改为有效的文件名，再重新导入。";
          return;
        }
        if (hasContent(readFields()) && !window.confirm("导入会替换此页面的本机草稿。继续吗？")) return;

        const stem = file.name.replace(ext, "");
        const category = data.category == null ? initialCategory : String(data.category);
        const tags = Array.isArray(data.tags) ? data.tags : String(data.tags ?? "").split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
        const hasMetadata = lines.some(({ key }) => key);
        const content = hasMetadata ? body.replace(/^\r?\n/, "") : raw.replace(/^\uFEFF/, "");
        const heading = content.match(/^\s*#\s+(.+?)\s*#*$/m)?.[1];
        const editable = new Set([...names.filter(name => name !== "body"), "section"]);
        imported = {
          filename: noteSource.isNoteSlug(stem) ? stem + ".md" : "",
          extra: hasMetadata ? lines.filter(({ key }) => !editable.has(key)).map(({ line }) => line) : [],
          tags,
        };
        fields.title.value = String(data.title || heading || stem);
        fields.date.value = data.date ? String(data.date).replaceAll("/", "-") : today();
        fields.category.value = category;
        updateSections(data.section);
        fields.tags.value = tags.join("，");
        fields.summary.value = String(data.summary ?? "");
        fields.body.value = content;
        saveDraft();
        updatePreview();
        preview?.scrollTo(0, 0);
        fields.body.scrollTop = 0;
        fields.title.focus();

        const review = [];
        if (!fields.date.value) review.push("日期");
        if (!fields.category.value) review.push("分类");
        else if (data.section && !section?.value) review.push("子类");
        importStatus.textContent = "已导入 " + file.name + (review.length ? "，请检查" + review.join("和") + "。" : "。");
      } catch {
        importStatus.textContent = "无法读取 Markdown 文件，请重试。";
      } finally {
        importButton.disabled = false;
      }
    });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const note = readFields();
    if (!note.title.trim()) fields.title.setCustomValidity("请填写笔记标题。");
    if (!note.body.trim()) fields.body.setCustomValidity("请填写笔记正文。");
    if (!form.reportValidity()) return;

    const tags = imported && note.tags === imported.tags.join("，") ? imported.tags
      : [...new Set(note.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    const markdown = [
      "---",
      `title: ${JSON.stringify(note.title.trim())}`,
      `date: ${note.date}`,
      `category: ${JSON.stringify(note.category)}`,
      ...(note.section ? [`section: ${JSON.stringify(note.section)}`] : []),
      `tags: ${JSON.stringify(tags)}`,
      `summary: ${JSON.stringify(note.summary.trim())}`,
      ...(imported?.extra ?? []),
      "---", "",
    ].join("\n") + "\n" + note.body + (note.body.endsWith("\n") ? "" : "\n");
    const name = Array.from(note.title.trim().normalize("NFC").replace(/[^\p{L}\p{N}_-]+/gu, "-"))
      .slice(0, 64).join("").replace(/^-+|-+$/g, "") || "note";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    a.download = imported?.filename || `${note.date}-${name}.md`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    say("已生成 " + a.download);
  });

  newNote.addEventListener("click", () => {
    if ((hasContent(readFields()) || !storageUsable) && !window.confirm("新建笔记会清除本页草稿。已导出的文件会保留。继续吗？")) return;
    try {
      localStorage.removeItem(key);
      storageUsable = true;
      say("已新建空白笔记");
    } catch {
      say("本机草稿暂时不可用，可导出 Markdown 保存。");
    }
    resetFields();
    updatePreview();
    unsavedInput = false;
    fields.title.focus();
  });

  download.disabled = false;
  newNote.disabled = false;
})();
