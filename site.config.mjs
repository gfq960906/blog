// ============================================================
//  站点配置文件 —— 这个文件是唯一需要你改的地方
//  改完运行 `node build.mjs` 重新生成即可
// ============================================================

export const site = {
  // 站点标题（显示在浏览器标签、页头、RSS 里）
  title: "我的博客",

  // 副标题 / 一句话介绍，显示在首页大标题下面
  description: "记录论文阅读、实验进展，以及工作与生活里的发现。",

  // 你的名字或昵称
  author: "郭",

  // 站点最终的公网地址，用于 RSS 和 sitemap。
  // 用 GitHub Pages 的话形如："https://<你的用户名>.github.io/blog"
  url: "https://gfq960906.github.io/blog",
};

// 首页每页显示多少篇文章
export const postsPerPage = 20;

// 分类及子类。sections 的键供 Markdown 的 section 字段使用，配置顺序即目录顺序。
export const categories = {
  work: {
    name: "工作记录",
    color: "#3b6ea5",
    sections: { project: "项目记录", review: "工作复盘", workflow: "流程与工具" },
  },
  life: {
    name: "生活随笔",
    color: "#b4763a",
    sections: { daily: "日常记录", trips: "出行见闻" },
  },
  research: {
    name: "研究笔记",
    color: "#6b5b95",
    sections: {
      theory: "理论推导",
      experiment: "实验进展",
      literature: "文献阅读与综述",
      industry: "产业调研",
      ideas: "研究思考",
    },
  },
  essay: {
    name: "随笔感想",
    color: "#4a7c59",
    sections: { blog: "博客与写作", reflections: "观点与感想" },
  },
};

// 专题页的分组顺序（在专题页 html 的 meta 里用 "group": "公司图谱" 指定）
// 没写 group 的专题会归到「其他」，排在最后
export const labGroups = ["公司图谱", "实验进展", "综述"];
