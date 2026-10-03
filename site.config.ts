/**
 * 站点配置 —— 所有「关于你本人」的信息集中在这里，组件里不要硬编码。
 * 方括号 [] 包起来的都是占位，素材到位后直接替换（见 docs/素材清单.md）。
 */

/** 2026-10 站主决定：社交平台只留 X、GitHub、哔哩哔哩三个 */
export type SocialKey = "x" | "github" | "bilibili";

export type Social = {
  key: SocialKey;
  label: string;
  labelEn: string;
  href: string;
  handle: string;
};

export const siteConfig = {
  /* --- 身份 --- */
  name: "伟良",
  nameEn: "Weiliang",
  /**
   * 一句话介绍：说清「这个人是做什么的」。RSS 的 <description>、首页名片下面那一行、
   * 完整介绍页第 1 幕都用它（2026-10 改版）。
   */
  tagline: "学着用 AI 把手上的活干得更快更好，顺手做成能跑的东西。",
  taglineEn:
    "Learning to use AI to do the work faster and better, and building the results into things that run.",
  /**
   * 短版一句话 —— 侧边栏那一行和分享图（og.png）都只有一行的位置，
   * 整句放不下会被截断，所以那两处用这个短版。改了要重跑 `npm run og`。
   */
  taglineShort: "把问题查到根上，再写下来",
  taglineShortEn: "Root causes, written down",
  since: "2026",

  /**
   * 事实标签（2026-10 改版：首页名片和完整介绍页第 1 件展品都用它）。
   * 数字和地名取自 content/about/about.zh.md 的第一段，改了那边记得同步这里。
   * 页面上拼成「上海 · 21 · 计算机网络技术 2026 届」，拼法在 messages 的 profile.facts。
   */
  profile: {
    age: 21,
    city: "上海",
    cityEn: "Shanghai",
    major: "计算机网络技术",
    majorEn: "Computer Network Technology",
    classOf: "2026",
  },

  /**
   * 上海的真实坐标（人民广场一带，保留两位小数）。首页光点、第 7 幕「窗边」和平面图收尾都显示它。
   * 只用这一组真实坐标，不编造海拔、距离之类的读数。
   */
  coords: { lat: 31.23, lng: 121.47, text: "31.23°N 121.47°E" },

  /* --- 联系方式 --- */
  email: "weiliang99520@gmail.com",

  /* --- 站点元信息 --- */
  // 部署在 Vercel（项目 weiliang，GitHub 推送自动构建）。正式域名 weiliang.dev —— 2026-08-28
  // 在 Vercel 买的，DNS 也用 Vercel 自家的，所以不用手配 A/CNAME 记录。裸域是主地址，
  // www.weiliang.dev 会 308 永久跳回裸域，所以这里只写裸域。改这个地址**不用**重跑
  // `npm run og` —— 分享图上不含站点地址（生成脚本只取 nameEn / taglineShortEn / since），
  // 真正跟着变的是 meta 里 og:image 那个绝对地址，构建时自动生成。
  url: "https://weiliang.dev",
  locales: ["zh", "en"] as const,
  defaultLocale: "zh" as const,

  /* --- 社交平台：只留这三个（2026-10 站主要求，小红书、YouTube、抖音都不再显示）--- */
  socials: [
    {
      key: "x",
      label: "X",
      labelEn: "X",
      href: "https://x.com/WeiliangF27854",
      handle: "@WeiliangF27854",
    },
    {
      key: "github",
      label: "GitHub",
      labelEn: "GitHub",
      href: "https://github.com/leomfu",
      handle: "@leomfu",
    },
    {
      key: "bilibili",
      label: "哔哩哔哩",
      labelEn: "Bilibili",
      href: "https://space.bilibili.com/3546677612907455",
      handle: "主页",
    },
  ] satisfies Social[],

  /* --- 访问统计（阶段 5 部署时接）--- */
  analytics: {
    umamiSrc: "",
    umamiWebsiteId: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
