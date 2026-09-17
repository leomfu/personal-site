/**
 * 顶部导航。
 *
 * 2026-09-17 全站改版第一阶段「精简范围」之后，站上只剩设计稿里的八个页面 + 音乐：
 *
 *   顶栏八项   首页 / 项目 / 视频 / 博客 / 摄影 / 工具 / 关于 / 联系（摄影进了顶栏）
 *   不进顶栏   唱片 /records —— 入口是首页「爱好」那几张胶囊卡
 *
 * 书影音、专注区（番茄钟/便签）、放松区、留言板、新闻、⌘K 命令面板都已下线，
 * 原来给 ⌘K 用的搜索别名表（NAV_ALIASES）也随之删掉了。
 */
/** 首页就是语言根路径 —— 2026-09-01 起开场页下线，/zh/ 直接是首页，不再有 /zh/home/ */
export const NAV_HOME = { key: "home", path: "" } as const;

/** 顶栏平铺的八项（含首页），顺序即左到右的顺序 */
export const NAV_TOP = [
  NAV_HOME,
  { key: "projects", path: "/projects" },
  { key: "videos", path: "/videos" },
  { key: "blog", path: "/blog" },
  { key: "photos", path: "/photos" },
  { key: "tools", path: "/tools" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
] as const;

/** 真实页面，但不进顶栏。sitemap 里有 */
export const NAV_EXTRA = [{ key: "records", path: "/records" }] as const;

export type NavKey = (typeof NAV_TOP)[number]["key"] | (typeof NAV_EXTRA)[number]["key"];

export type NavItem = { key: NavKey; path: string };

/** 摊平的全部页面（sitemap 用） */
export const NAV_ITEMS: readonly NavItem[] = [...NAV_TOP, ...NAV_EXTRA];

/**
 * 带语言前缀 + 尾斜杠（next.config 开了 trailingSlash）。
 * path 里可以带 `#hash`，斜杠要补在 hash 前面：/zh/projects/#uses
 */
export function localePath(locale: string, path: string) {
  const [route, hash] = path.split("#");
  const base = `/${locale}${route === "/" ? "" : route}/`;
  return hash ? `${base}#${hash}` : base;
}
