(() => {
  const form = document.getElementById("note-editor");
  if (!form) return;

  const key = "note-draft:" + location.pathname.replace(/[^/]*$/, "");
  const names = ["title", "date", "category", "tags", "summary", "body"];
  const fields = Object.fromEntries(names.map(name => [name, form.elements.namedItem(name)]));
  const initialCategory = fields.category.value;
  const status = form.querySelector(".note-status");
  const download = form.querySelector(".note-download");
  const newNote = form.querySelector(".note-new");
  const preview = document.getElementById("note-preview");
  const emptyPreview = preview?.firstElementChild;
  const previewStatus = form.querySelector(".note-preview-status");
  const canPreview = preview && window.katex && typeof window.renderBlogNotePreview === "function";
  let previewTimer;
  let storageUsable = true;
  let unsavedInput = false;

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

  function resetFields() {
    form.reset();
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
    return Object.fromEntries(names.map(name => [name, fields[name].value]));
  }

  function saveDraft() {
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

  form.addEventListener("submit", event => {
    event.preventDefault();
    const note = readFields();
    if (!note.title.trim()) fields.title.setCustomValidity("请填写笔记标题。");
    if (!note.body.trim()) fields.body.setCustomValidity("请填写笔记正文。");
    if (!form.reportValidity()) return;

    const tags = [...new Set(note.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    const markdown = [
      "---",
      `title: ${JSON.stringify(note.title.trim())}`,
      `date: ${note.date}`,
      `category: ${JSON.stringify(note.category)}`,
      `tags: ${JSON.stringify(tags)}`,
      `summary: ${JSON.stringify(note.summary.trim())}`,
      "---", "", note.body, "",
    ].join("\n");
    const name = Array.from(note.title.trim().normalize("NFC").replace(/[^\p{L}\p{N}_-]+/gu, "-"))
      .slice(0, 64).join("").replace(/^-+|-+$/g, "") || "note";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    a.download = `${note.date}-${name}.md`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    say("已生成 " + a.download);
  });

  newNote.addEventListener("click", () => {
    const draft = readFields();
    const hasContent = draft.title || draft.body || draft.tags || draft.summary ||
      draft.date !== today() || draft.category !== initialCategory;
    if ((hasContent || !storageUsable) && !window.confirm("新建笔记会清除本页草稿。已导出的文件会保留。继续吗？")) return;
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
