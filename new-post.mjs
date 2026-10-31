// ============================================================
//  新建一篇空白文章
//  用法：node new-post.mjs "文章标题" [英文网址slug]
//  例子：node new-post.mjs "读《思考，快与慢》" reading-kahneman
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const POSTS = path.join(ROOT, "content", "posts");

const title = process.argv[2];
if (!title) {
  console.log('用法：node new-post.mjs "文章标题" [英文slug]');
  console.log('例如：node new-post.mjs "周末随笔" 2026-11-weekend');
  process.exit(1);
}

fs.mkdirSync(POSTS, { recursive: true });

const now = new Date();
const p = (n) => String(n).padStart(2, "0");
const date = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;

let slug = process.argv[3];
if (!slug) {
  // 没给 slug 就用日期 + 序号
  let n = 1;
  while (fs.existsSync(path.join(POSTS, `${date}-${n}.md`))) n++;
  slug = `${date}-${n}`;
}
slug = slug.replace(/\.md$/, "").replace(/[\\/:*?"<>|\s]+/g, "-");

const file = path.join(POSTS, `${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`× 文件已存在：${file}`);
  process.exit(1);
}

const content = `---
title: ${title}
date: ${date}
category: essay
tags: []
summary: 
---

在这里开始写正文。

`;

fs.writeFileSync(file, content, "utf8");

console.log("✓ 已创建：" + path.relative(ROOT, file));
console.log("  写完运行  node build.mjs  重新生成网站");
console.log("  （如果 node serve.mjs 开着，保存后自动重建）");
