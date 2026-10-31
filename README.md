# 我的博客

一个**零依赖**的静态博客：写 Markdown → 一条命令生成网站 → 扔到任何静态托管上就能访问。

不需要安装任何 npm 包，不需要数据库，不需要服务器。整个项目只有一个 `node build.mjs`。

---

## 一、先跑起来看看

```bash
cd blog

# 本地预览（自动监听内容变化并重新构建）
node serve.mjs
```

然后浏览器打开 **http://localhost:4321**

想生成最终网站文件：

```bash
node build.mjs
# 结果在 docs/ 目录里，双击 docs/index.html 也能看
```

> 为什么是 `docs`：GitHub Pages 可以直接把仓库里的 `docs/` 目录当网站发布，不需要 Actions，
> 也不需要额外权限，push 完就生效。
> 想生成到别的目录（比如拖到 Netlify Drop）：设置环境变量 `OUT_DIR=dist` 再构建。

---

## 二、目录长什么样

```
blog/
├─ site.config.mjs        ← 【改这里】站名、作者、分类颜色
├─ build.mjs              ← 构建脚本（不用动）
├─ serve.mjs              ← 本地预览服务器（不用动）
├─ assets/
│  ├─ style.css           ← 全站样式，想换配色改这里
│  └─ site.js             ← 主题切换 / 搜索 / 进度条
├─ content/
│  ├─ about.md            ← 「关于」页内容
│  ├─ posts/              ← 【写文章放这里】一个 .md 一篇文章
│  └─ labs/               ← 【放专题页】你自己的 HTML 报告整页放这里
└─ docs/                  ← 生成的网站（GitHub Pages 就发布这个目录，不要手改）
```

---

## 三、写一篇新文章

在 `content/posts/` 里新建一个 `.md` 文件，**文件名会成为网址**（建议用英文或拼音），比如：

```
content/posts/2026-11-05-quantum-weekly.md
```

文件开头必须有这一段（叫 frontmatter），中间用 `---` 包起来：

```markdown
---
title: 标题写这里
date: 2026-11-05
category: work
tags: [量子计算, 周报]
summary: 一句话摘要，会显示在文章列表里
---

正文从这里开始，标准的 Markdown 语法：

## 二级标题
### 三级标题

- 列表
- 列表

**加粗**、*斜体*、`行内代码`

| 表头 | 表头 |
| --- | --- |
| 内容 | 内容 |

> 引用

```python
# 代码块
print("hello")
```
```

保存后：

- 如果 `node serve.mjs` 还开着，刷新页面就能看到（自动重建）；
- 否则手动跑一次 `node build.mjs`。

### 懒人版：一条命令生成空白文章

```bash
node new-post.mjs "周末去爬山" weekend-hike
# ✓ 已创建：content/posts/weekend-hike.md
```

它会自动填好日期和 frontmatter，你只管写正文。第二个参数不写也行（会自动用日期命名）。

### 可用字段

| 字段 | 说明 |
| --- | --- |
| `title` | 标题（必填） |
| `date` | 日期，`2026-11-05` 这种格式 |
| `category` | 分类：`work` / `life` / `research` / `essay`（在 `site.config.mjs` 里可改） |
| `tags` | 标签，`[标签1, 标签2]` |
| `summary` | 摘要，列表页和搜索里用 |
| `draft` | 写 `true` 就不发布这篇 |

---

## 四、放一份「调研报告」那种整页 HTML

你之前让我整理的那种独立网页，直接扔进 `content/labs/` 就行：

```
content/labs/2026-10-27-neutral-atom-companies.html
```

构建时会：

1. 原样复制到网站的 `labs/` 目录下（页面样式由那个 HTML 自己决定，不受博客样式影响）；
2. 自动读取它的 `<title>` 和 `<meta name="description">`；
3. 在「专题」板块生成一张卡片链过去；
4. 在页面左下角自动加一个「← 返回博客专题」的浮标。

如果想让卡片显示得更好看，在 HTML 开头放一行注释：

```html
<!-- meta: {"title":"标题","date":"2026-10-27","summary":"一句话介绍","tag":"调研报告"} -->
```

---

## 五、部署（二选一）

### 方案 A：Netlify Drop（最快，5 分钟，不用 Git）

1. 本地跑 `OUT_DIR=dist node build.mjs`（PowerShell 里先 `$env:OUT_DIR="dist"`）
2. 打开 <https://app.netlify.com/drop>
3. 把 `dist` 文件夹**整个拖进去**
4. 拿到一个 `xxx.netlify.app` 的网址，完事

以后更新：重新构建，再拖一次（或者绑定 GitHub 仓库让它自动部署）。

### 方案 B：GitHub Pages（已经配置好了）

这个仓库已经按下面的方式配置完成，日常更新只要三步：

```bash
node build.mjs                 # 1. 重新生成 docs/
git add -A && git commit -m "更新"   # 2. 提交
git push                       # 3. 推送，GitHub 自动更新网站
```

首次配置时做过的事（供参考，不用重做）：

1. 建一个 public 仓库 `blog`
2. 仓库页面 → **Settings → Pages → Source** 选 **Deploy from a branch**，
   Branch 选 `main`，文件夹选 **/docs**
3. 等 1 分钟左右，网址就是 `https://<你的用户名>.github.io/blog/`

> 为什么用「分支 + /docs」而不是 GitHub Actions：这套方式**不需要额外的 token 权限**，
> 也没有 Actions 配额和排队问题，推上去就直接生效，最省心。
>
> 注意：因为站点用的是**相对路径**，部署在 `/blog/` 这种子路径下也能正常显示，不需要改配置。
> 唯一要改的是 `site.config.mjs` 里的 `url`，填成你的正式网址（RSS 和 sitemap 要用）。

---

## 六、常见改动速查

| 想改什么 | 改哪里 |
| --- | --- |
| 站名 / 作者 / 副标题 | `site.config.mjs` |
| 分类名称和颜色 | `site.config.mjs` 里的 `categories` |
| 整体配色、字体、间距 | `assets/style.css` 顶部的 CSS 变量 |
| 「关于」页 | `content/about.md` |
| 首页大标题 | `site.config.mjs` 的 `title` + `description` |
| 页头导航项 | `build.mjs` 里的 `nav()` 函数 |

---

## 七、FAQ

**Q：图片放哪？**
放到 `assets/` 下（比如 `assets/img/photo.jpg`），文章里写 `![](../assets/img/photo.jpg)`；或者用图床的外链。

**Q：文章网址是中文怎么办？**
能跑，但不建议。文件名用英文/日期，标题写中文就行。

**Q：需要装 Node 吗？**
需要，这台机器上已经有了（v22）。构建脚本不用任何第三方包。

**Q：会不会有一天不能用？**
不会。产物是纯 HTML/CSS/JS 静态文件，任何静态托管都能跑，甚至可以拷到 U 盘里打开。
