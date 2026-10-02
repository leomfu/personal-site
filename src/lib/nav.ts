/**
 * 站点结构（2026-10 改版，scroll-craft · BRIEF §5）。
 *
 *   /{locale}/            首页：单屏的「轨道」，名片 + 入口
 *   /{locale}/about/      完整介绍：他房间里的 7 个地方，一条长滚动
 *   /{locale}/<子页>/     每个地方的「查看全部」
 *   /{locale}/contact/    并入首页和完整介绍页结尾，旧地址客户端跳回首页（不进 sitemap）
 *
 * 7 个地方的顺序就是完整介绍页的分幕顺序，也是房间平面图上「你」走的路线。
 */

export const PLACES = ["desk", "screen", "shelf", "projector", "darkroom", "records", "window"] as const;
export type PlaceKey = (typeof PLACES)[number];

/** 子页，顺序 = 完整介绍页里它们出现的顺序；place 是它在房间里对应的地方 */
export const SUBPAGES = [
  { key: "projects", path: "/projects", place: "screen" },
  { key: "blog", path: "/blog", place: "shelf" },
  { key: "videos", path: "/videos", place: "projector" },
  { key: "photos", path: "/photos", place: "darkroom" },
  { key: "records", path: "/records", place: "records" },
  { key: "tools", path: "/tools", place: "records" },
] as const satisfies ReadonlyArray<{ key: string; path: string; place: PlaceKey }>;

export type SubpageKey = (typeof SUBPAGES)[number]["key"];

/** sitemap 里的全部静态页（文章和影集另算） */
export const SITEMAP_PATHS = ["", "/about", ...SUBPAGES.map((p) => p.path)] as const;

/**
 * 带语言前缀 + 尾斜杠（next.config 开了 trailingSlash）。
 * path 里可以带 `#hash`，斜杠要补在 hash 前面：/zh/about/#screen
 */
export function localePath(locale: string, path: string) {
  const [route, hash] = path.split("#");
  const base = `/${locale}${route === "/" ? "" : route}/`;
  return hash ? `${base}#${hash}` : base;
}

/** 当前路径换成另一种语言（语言切换用）。认不出来就回那种语言的首页 */
export function swapLocale(pathname: string, target: string) {
  const match = pathname.match(/^\/(zh|en)(\/.*)?$/);
  if (!match) return `/${target}/`;
  const rest = match[2] ?? "/";
  return `/${target}${rest.endsWith("/") ? rest : `${rest}/`}`;
}
