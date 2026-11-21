// 从命令行在 content/posts/ 中创建 Markdown 笔记。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { categories } from "./site.config.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const POSTS = path.join(ROOT, "content", "posts");
const categoryList = Object.entries(categories).map(([key, { name }]) => `${key}（${name}）`).join("、");
const usage = [
  'node new-post.mjs "标题" [网址名] [--study] [--category 分类] [--tags "标签1,标签2"] [--draft]',
  `可选分类为 ${categoryList}`,
  "--study 使用学习笔记模板，默认分类为 research。普通文章默认归入 essay。",
  "--draft 先存为草稿，在 Markdown 中删除 draft: true 后即可参与构建。",
].join("\n");

function createPost() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      study: { type: "boolean" },
      category: { type: "string" },
      tags: { type: "string", default: "" },
      draft: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) return console.log(usage);

  const [title, requestedSlug] = positionals;
  if (!title?.trim() || positionals.length > 2) throw new Error(usage);
  if (/[\r\n]/.test(title + values.tags)) throw new Error("标题和标签应各写在一行。");
  const category = values.category ?? (values.study ? "research" : "essay");
  if (!Object.hasOwn(categories, category)) throw new Error(`请选择已配置的分类：${categoryList}`);
  const tags = [...new Set(values.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const slug = requestedSlug?.replace(/\.md$/i, "").replace(/[\\/:*?"<>|#%\s]+/g, "-");
  if (requestedSlug !== undefined && (!slug || /^\.+$/.test(slug))) {
    throw new Error("请填写网址名，例如 neutral-atom-notes，或省略网址名以使用日期。");
  }

  const body = values.study ? "## 学习问题\n\n\n## 核心笔记\n\n\n## 待验证的问题\n\n\n## 参考资料\n" : "在这里开始写正文。\n";
  const content = [
    "---",
    `title: ${JSON.stringify(title.trim())}`,
    `date: ${date}`,
    `category: ${category}`,
    `tags: ${JSON.stringify(tags)}`,
    "summary:",
    ...(values.draft ? ["draft: true"] : []),
    "---",
    "",
    body,
    "",
  ].join("\n");

  fs.mkdirSync(POSTS, { recursive: true });
  for (let n = 1; ; n++) {
    const file = path.join(POSTS, `${slug ?? `${date}-${n}`}.md`);
    try {
      fs.writeFileSync(file, content, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (slug) throw new Error(`文件已存在：${path.relative(ROOT, file)}`);
      continue;
    }
    console.log("✓ 已创建：" + path.relative(ROOT, file));
    console.log(values.draft
      ? "  准备预览或发布时，在文件开头删除 draft: true 并重新构建。"
      : "  运行 node serve.mjs 在浏览器中预览，或运行 node build.mjs 生成网站。");
    return;
  }
}

try {
  createPost();
} catch (error) {
  console.error("× " + error.message);
  process.exitCode = 1;
}
