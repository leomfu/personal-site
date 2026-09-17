/**
 * content/ 里各类条目的类型 —— 单独放一个文件，
 * 因为客户端组件也要用它们，而 content.ts 里有 node:fs，不能进浏览器包。
 */

export type Lang = "zh" | "en";

export type Project = {
  slug: string;
  name: string;
  name_en?: string;
  desc: string;
  desc_en?: string;
  stack?: string[];
  link?: string;
  repo?: string;
  /** true = 出现在首页「在做的」 */
  featured?: boolean;
  year?: string;
  /** 状态小标签（"进行中"/"在用"/"在线"） */
  status?: string;
  status_en?: string;
  /** 首页「在做的」卡片上那段短一点的说明；没有就用 desc */
  summary?: string;
  summary_en?: string;
  /** 首页卡片上只列的那几项技术栈；没有就用 stack */
  featuredStack?: string[];
};

export type Video = {
  platform: "bilibili" | "youtube";
  id: string;
  title: string;
  title_en?: string;
  date: string;
  desc: string;
  desc_en?: string;
  /** 封面图（public 下路径），未加载播放器时显示 */
  cover?: string;
  /** 首页「最近拍的」卡片上那句短说明；没有就用 desc */
  summary?: string;
  summary_en?: string;
};

export type Tool = {
  name: string;
  desc: string;
  desc_en?: string;
  url: string;
  icon: string;
  brandColor?: string;
};

export type PostType = "blog" | "essay" | "thought";

export type Post = {
  slug: string;
  title: string;
  title_en?: string;
  date: string;
  type: PostType;
  tags: string[];
  /** 英文版的标签（来自 `<slug>.en.md` 的 front-matter） */
  tags_en?: string[];
  /** 原文语言。有没有英文译本看 body_en，不改这个字段 */
  lang: Lang;
  summary: string;
  summary_en?: string;
  body: string;
  /** 英文译本正文：`content/posts/<slug>.en.md`，没有就是 undefined */
  body_en?: string;
  minutes: number;
  minutes_en?: number;
};

/**
 * 一首歌。两个来源：
 * - kind "local"：自己托管在 public/audio/music/ 的公共领域录音，完整播放（「常驻」）
 * - kind "apple"：Apple 官方 30 秒预览（content/music/chart.json，见 docs/如何加歌.md）
 *
 * ⚠️ 2026-08-30：网易云那组（content/music/netease.json）已经从界面上退休，
 * 歌基本被 Apple 榜单覆盖了，两组并存只会让访客困惑。数据文件和 `npm run music`
 * 脚本还留着（万一要回退），但 lib/content.ts 不再读它。
 */
export type TrackKind = "local" | "apple";

export type Track = {
  id: string;
  kind: TrackKind;
  /** 音频地址：本地是站内路径，Apple 那组是官方预览直链 */
  src: string;
  title: string;
  titleEn: string;
  artist: string;
  artistEn: string;
  /**
   * **整首歌**的长度（秒）—— 榜单里显示的是这个。
   * 注意 Apple 那组的音频文件只有 30 秒，播放器的总时长要读 <audio> 的真实 duration，
   * 不能拿这个字段当分母。
   */
  duration: number;
  /**
   * true = src 指向的是一段 30 秒的官方预览，不是完整的歌。
   * Apple 的预览**本身就是独立的 30 秒文件**，所以不需要「seek 到中间 + 到点淡出」
   * 那套窗口逻辑（那是给网易云整首直链设计的，已经退休）。
   */
  clip?: boolean;
  /** 专辑封面（站内路径，由 scripts/fetch-music-chart.mjs 下载） */
  cover?: string;
  album?: string;
  /**
   * 一句歌曲描述（唱机右侧信息栏用）。只有 chart.json 的场景榜单里手填了才有，
   * 常驻那组没有这两个字段，界面要按「没有就不显示」处理，别开天窗。
   * ⚠️ 现在 chart.json 里这些描述是 AI 代拟的初稿（该条 JSON 会带 `descDraft: true`，
   * 这个标记不进 Track 类型，是给站主看的元数据），站主应该换成自己的话——
   * 见 docs/如何加歌.md。
   */
  desc?: string;
  descEn?: string;
  /** 去平台听完整版（Apple Music 单曲页）。本地曲目没有 */
  platformUrl?: string;
};

/** 榜单里的一组 —— 一个心情场景，组名双语存在 content/music/chart.json 里 */
export type MusicScene = {
  key: string;
  label: string;
  labelEn: string;
  tracks: Track[];
};

export type MusicLibrary = {
  /** 自托管的公共领域录音，完整播放 */
  resident: Track[];
  /** 按心情场景分组的 Apple 榜单 */
  scenes: MusicScene[];
  /** 常驻曲库的出处声明 */
  residentCredit: string;
  residentCreditEn?: string;
};
