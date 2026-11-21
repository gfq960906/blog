# 我的博客

**线上地址：<https://gfq960906.github.io/blog/>**

用 Markdown 写笔记，构建后可以在 GitHub Pages 或其他静态托管上阅读。仓库自带 KaTeX 和数学字体，离线打开文章也能显示公式。

用 Node.js 运行 `node build.mjs` 即可生成静态网页，无须安装 npm 包。

---

## 〇、记一篇学习笔记

**在网页上写**　从首页打开「写笔记」，填好标题、正文和分类，可按笔记用途再选一个子类。「实时预览」会随输入排版 Markdown 和 LaTeX，写错的公式旁会出现提示。浏览器会在当前设备暂存一份草稿，关闭页面后仍可回来接着写。点「导出 Markdown」，把下载的 `.md` 文件放进项目的 `content/posts/`，然后按下文预览或发布。在另一台设备继续写时，可带走导出的 Markdown 文件。

**在目录里查**　点击首页的任一大类，即可按笔记类型跳转并查看目录。研究笔记可按理论推导、实验进展、文献阅读与综述、产业调研及研究思考浏览。标签用来记录笔记的主题，例如「量子力学」或「里德堡」。

**在终端里写**　在博客项目目录打开终端。下面的命令会创建 `content/posts/rydberg-blockade.md`，归入「研究笔记」，并加上两个可供检索的标签。

```powershell
node new-post.mjs "里德堡阻塞的物理图像" rydberg-blockade --study --section theory --tags "中性原子, 里德堡" --draft
```

1. 打开这份 Markdown，把一句话结论写进 `summary`。正文模板有「学习问题」「核心笔记」「待验证的问题」「参考资料」四节，可以按需删改。
2. 在本地编辑草稿。准备预览时，删除文件开头的 `draft: true`，运行 `node serve.mjs`，打开终端打印的地址。之后每次保存，刷新浏览器即可查看。
3. 准备发布时，按第五节的 GitHub Pages 步骤提交并推送到 `main`。网站展示的是构建生成的 `docs/`。公开仓库中已提交的草稿源码也可以被读到。

在已配置好 Git 认证的 Windows 电脑上，也可运行发布脚本。它也兼容原 DeepSeek Harness 目录旁安装的 GitHub CLI。

```powershell
.\deploy.ps1
```

也可以双击 `deploy.cmd`。脚本会构建网站、提交当前工作区的改动并推送。任何一步失败时，脚本会停下来。推送成功后，由 GitHub Pages 发布。

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
│  ├─ labs/               ← 【放专题页】你自己的 HTML 报告整页放这里
│  └─ sources/            ← 原始稿备份（保存在仓库中，构建时跳过）
└─ docs/                  ← 生成的网站（GitHub Pages 就发布这个目录，不要手改）
```

---

## 三、写一篇新文章

> **先分清两种内容，别重复发**
>
> | 你手上的东西 | 放哪里 | 会变成什么 |
> | --- | --- | --- |
> | `.md` 文字稿（笔记、随笔、周记） | `content/posts/` | **文章**：进列表、标签、搜索、RSS |
> | `.html` 整页报告（调研、图谱、可视化） | `content/labs/` | **专题页**：保留你自己的设计样式，出现在「专题」板块 |
> | 同一份内容既有 `.md` 又有 `.html` | **只放一个**，推荐放 `.html` | 避免站内出现两份一样的内容 |
>
> 页面自己的样式不会被博客覆盖，所以已经有排版的报告直接扔进去就行。

在 `content/posts/` 里新建一个 `.md` 文件，**文件名会成为网址**（建议用英文或拼音），比如：

```
content/posts/2026-11-05-quantum-weekly.md
```

文件开头必须有这一段（叫 frontmatter），中间用 `---` 包起来：

````markdown
---
title: 标题写这里
date: 2026-11-05
category: work
section: review
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
````

保存后：

- 如果 `node serve.mjs` 还开着，刷新页面就能看到（自动重建）；
- 否则手动跑一次 `node build.mjs`。

### 写数学公式

在正文、列表或表格中，用单个美元符号包住行内 LaTeX。独立公式可用双美元符号另起一段。

```markdown
当 $B \gg \Omega$ 时，双激发受到抑制。

$$
B = \frac{C_6}{R^6}
$$
```

反引号可以用来原样展示公式源码。独立 HTML 专题的正文也支持 `\(...\)` 和 `\[...\]`。

### 用命令新建文章

```bash
node new-post.mjs "周末去爬山" weekend-hike
# ✓ 已创建：content/posts/weekend-hike.md
```

它会填好本机日期，普通文章归入 `essay`。省略网址名时，以日期和序号命名。指定的网址名已被使用时，命令会提示另选名称。

| 可选参数 | 用途 |
| --- | --- |
| `--study` | 使用学习笔记模板，默认归入 `research` |
| `--category work` | 选择分类，优先于模板的默认值。可选键名来自 `site.config.mjs` 的 `categories` |
| `--section theory` | 选择当前分类的子类。可选键名来自 `site.config.mjs` 中该分类的 `sections` |
| `--tags "量子计算, 文献整理"` | 可写多个标签，用中文或英文逗号分隔 |
| `--draft` | 创建草稿。删除 `draft: true` 并重新构建后，网站将收录它 |

一篇文章选一个分类。标签可以跨分类复用，例如读论文的研究笔记和项目复盘都可以使用「量子计算」。运行 `node new-post.mjs --help` 可查看当前可选分类。以后在 `site.config.mjs` 中添加的分类也会出现在这里。

### 可用字段

| 字段 | 说明 |
| --- | --- |
| `title` | 标题（必填） |
| `date` | 日期，`2026-11-05` 这种格式 |
| `category` | 分类：`work` / `life` / `research` / `essay`（在 `site.config.mjs` 里可改） |
| `section` | 选填子类，例如 `research` 下的 `theory`。空白或旧键名的笔记归入该大类的「未细分」 |
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
3. 在「专题」板块按分组生成卡片链过去；
4. 在页面顶部插入一条粘性的「相关 / 全部专题」导航条，专题之间可以互相跳转。

如果想让卡片显示得更好看，在 HTML 开头放一行注释（**所有字段都是可选的**）：

```html
<!-- meta: {"title":"标题","date":"2026-10-27","summary":"一句话介绍",
           "tag":"调研报告","group":"公司图谱","short":"公司图谱 v2",
           "post":"2026-10-27-neutral-atom-companies"} -->
```

| 字段 | 作用 |
| --- | --- |
| `title` | 卡片和导航条上的标题 |
| `date` | 排序用（不写就排在最后） |
| `summary` | 卡片上的一句话介绍 |
| `tag` | 卡片左上角的小标签 |
| `group` | 专题页分组，分组顺序在 `site.config.mjs` 的 `labGroups` 里改 |
| `short` | 顶部导航条里显示的短名字（默认用 title） |
| `post` | 对应的文章 slug（写了才会出现「读文字版」链接） |

### 顺手把 HTML 报告变成一篇 Markdown 文章（可选）

专题页只在「专题」板块和搜索里出现，不进 RSS 和文章列表。如果也想让它被订阅、被当成普通文章读，一条命令搞定：

```powershell
node tools/make-post-from-report.mjs content/labs/2026-10-28-xxx.html 2026-10-28-xxx 2026-10-28-xxx
#                                        ↑报告HTML                    ↑文章slug      ↑专题页slug（可省略）
```

它会自动读取报告里的 `<!-- meta -->`（标题、日期、摘要、tags），转成 Markdown 写进
`content/posts/<slug>.md`，并在文章开头加一行「这是文字版，报告版在这里」的链接。

> 转换器在 `tools/html2md.mjs`，零依赖，保留标题层级、列表、表格、引用；
> CSS 条形图会变成表格。转换完建议自己扫一眼，个别排版细节可能需要手改。

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
| 首页标题与简介 | `build.mjs` 的首页模板、`site.config.mjs` 的 `description` |
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
