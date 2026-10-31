// ============================================================
//  站点配置文件 —— 这个文件是唯一需要你改的地方
//  改完运行 `node build.mjs` 重新生成即可
// ============================================================

export const site = {
  // 站点标题（显示在浏览器标签、页头、RSS 里）
  title: "我的博客",

  // 副标题 / 一句话介绍，显示在首页大标题下面
  description: "记录工作与生活的地方",

  // 你的名字或昵称
  author: "郭",

  // 站点最终的公网地址，用于 RSS 和 sitemap。
  // 用 GitHub Pages 的话形如："https://<你的用户名>.github.io/blog"
  url: "https://gfq960906.github.io/blog",
};

// 首页每页显示多少篇文章
export const postsPerPage = 20;

// 分类：key 是内部名，name 是显示名，color 是标签颜色
export const categories = {
  work:     { name: "工作记录", color: "#3b6ea5" },
  life:     { name: "生活随笔", color: "#b4763a" },
  research: { name: "研究笔记", color: "#6b5b95" },
  essay:    { name: "随笔感想", color: "#4a7c59" },
};

// 专题页的分组顺序（在专题页 html 的 meta 里用 "group": "公司图谱" 指定）
// 没写 group 的专题会归到「其他」，排在最后
export const labGroups = ["公司图谱", "实验进展", "综述"];
