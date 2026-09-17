import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { excerpt, readingMinutes } from "./format";
import type {
  MusicLibrary,
  Post,
  PostType,
  Project,
  RecordItem,
  Tool,
  Track,
  Video,
} from "./types";

/**
 * content/ 的读取层 —— 全部在构建时跑（Node API），组件里不写死内容。
 * 字段约定见 content/README.md。类型在 ./types，日期/双语格式化在 ./format
 * （客户端组件从那两个文件拿，因为这里有 node:fs）。
 *
 * 双语（2026-09-17 起 content/ 已补齐英文）：
 *   markdown 页：readDoc 读 `xxx.en.md`，找不到就回退 `xxx.zh.md`；
 *   文章：`posts/<slug>.md` 是原文，同目录 `posts/<slug>.en.md` 是英文译本（同一个 slug、同一个 URL），
 *         getPosts() 把译本并进 title_en / summary_en / tags_en / body_en / minutes_en，不单独成篇；
 *   json 条目：*_en / *En 字段，没填时组件里的 localized() 自动退回中文字段。
 * ⚠️ 改中文内容时对应的英文文件/字段也要一起改，否则英文站显示的是旧内容。
 */

export type * from "./types";
export * from "./format";

const CONTENT_DIR = path.join(process.cwd(), "content");

const read = (...p: string[]) => fs.readFileSync(path.join(CONTENT_DIR, ...p), "utf8");
const exists = (...p: string[]) => fs.existsSync(path.join(CONTENT_DIR, ...p));
const readJson = <T>(file: string, fallback: T): T =>
  exists(file) ? (JSON.parse(read(file)) as T) : fallback;

/* ------------------------------------------------------------------ 纯 markdown 页 */

/** about / home-intro 这类「一整篇正文」的页面。没有这一语言的文件就读中文 */
function readDoc(dir: string, base: string, locale: string) {
  const file = `${base}.${locale}.md`;
  const fallback = `${base}.zh.md`;
  const target = exists(dir, file) ? file : fallback;
  if (!exists(dir, target)) return { body: "", data: {} as Record<string, unknown> };
  const parsed = matter(read(dir, target));
  return { body: parsed.content.trim(), data: parsed.data as Record<string, unknown> };
}

export const getAbout = (locale: string) => readDoc("about", "about", locale);
/** 首页 Hero 那句引导语（content/home/intro.zh.md，纯文本一段） */
export const getHomeIntro = (locale: string) => readDoc("home", "intro", locale);

/** front-matter 里的日期：gray-matter 会把 2026-08-24 解析成 Date，统一转回 YYYY-MM-DD */
function toISODate(value: unknown) {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  return value ? String(value) : "";
}

/* ------------------------------------------------------------------ 项目 */


/** 顺序就是 json 里的顺序（01 / 02 / 03 是人工排的），**不要排序** */
export const getProjects = () => readJson<Project[]>("projects/projects.json", []);

/* ------------------------------------------------------------------ 视频 */


export function getVideos(): Video[] {
  return readJson<Video[]>("videos.json", []).sort((a, b) => b.date.localeCompare(a.date));
}

/* ------------------------------------------------------------------ 工具 */


export const getTools = () => readJson<Tool[]>("tools.json", []);

/* ------------------------------------------------------------------ 文章 */



/** 英文译本的文件名后缀：`<slug>.en.md`。它不是独立文章，列表/RSS/sitemap 都不单独算 */
const EN_SUFFIX = ".en.md";

export function getPosts(): Post[] {
  if (!exists("posts")) return [];
  return fs
    .readdirSync(path.join(CONTENT_DIR, "posts"))
    .filter((f) => f.endsWith(".md") && !f.endsWith(EN_SUFFIX))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const parsed = matter(read("posts", file));
      const d = parsed.data as Record<string, unknown>;
      const body = parsed.content.trim();
      const date = toISODate(d.date);
      // front-matter 里写了 minutes 就用它（文案定稿给的阅读时长），没写就按字数估
      const minutes = Number(d.minutes) > 0 ? Number(d.minutes) : readingMinutes(body);

      // 英文译本（可选）：front-matter 只认 title / summary / tags / minutes，其余沿用原文
      const enFile = `${slug}${EN_SUFFIX}`;
      const en = exists("posts", enFile) ? matter(read("posts", enFile)) : null;
      const e = (en?.data ?? {}) as Record<string, unknown>;
      const bodyEn = en ? en.content.trim() : undefined;

      return {
        slug,
        title: String(d.title ?? file),
        title_en: e.title ? String(e.title) : d.title_en ? String(d.title_en) : undefined,
        date,
        type: (["blog", "essay", "thought"] as const).includes(d.type as PostType)
          ? (d.type as PostType)
          : "blog",
        tags: Array.isArray(d.tags) ? d.tags.map(String) : [],
        tags_en: Array.isArray(e.tags) ? e.tags.map(String) : undefined,
        lang: d.lang === "en" ? "en" : "zh",
        summary: String(d.summary ?? excerpt(body)),
        summary_en: e.summary
          ? String(e.summary)
          : d.summary_en
            ? String(d.summary_en)
            : bodyEn
              ? excerpt(bodyEn)
              : undefined,
        body,
        body_en: bodyEn,
        minutes,
        // 译本没写 minutes 就沿用原文的阅读时长（同一篇文章，列表上不该一种语言一个数）
        minutes_en: bodyEn ? (Number(e.minutes) > 0 ? Number(e.minutes) : minutes) : undefined,
      } satisfies Post;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

/**
 * 站内曲库，两块：
 * ① 常驻 —— 自托管的公共领域录音，版权干净，完整播放。
 * ② 场景榜单 —— content/music/chart.json，Apple 官方 30 秒预览，按心情场景分成几组。
 *
 * ⚠️ 网易云那组（content/music/netease.json）2026-08-30 从界面上退休了：
 * 歌基本被 Apple 榜单覆盖，两组并存只让访客困惑。数据文件和 `npm run music` 脚本
 * 都还在（要回退的话把这儿读回来即可），但页面不再渲染它。
 */
type ResidentFile = {
  credit: string;
  creditEn?: string;
  tracks: Array<Omit<Track, "kind">>;
};

type ChartFile = {
  scenes: Array<{
    key: string;
    label: string;
    labelEn: string;
    tracks: Array<{
      title: string;
      artist: string;
      album?: string;
      /** Apple 官方 30 秒预览直链。没有就是这首放不出来 */
      previewUrl?: string;
      cover?: string;
      platformUrl?: string;
      durationMs?: number;
      /** 代选标记 —— 给站主看的元数据，**不显示给访客** */
      placeholder?: boolean;
      /** 一句歌曲描述（唱机右侧信息栏），没有就不显示，见 Track.desc 的注释 */
      desc?: string;
      descEn?: string;
      /** AI 代拟描述的标记 —— 给站主看的元数据，**不显示给访客**，也不进 Track 类型 */
      descDraft?: boolean;
    }>;
  }>;
};

/** Apple 单曲页里的 `i=数字` 就是这首歌的 id，拿它当稳定 key */
function appleIdOf(platformUrl: string | undefined, fallback: string) {
  const hit = platformUrl?.match(/[?&]i=(\d+)/);
  return hit ? `apple-${hit[1]}` : fallback;
}

export function getMusic(): MusicLibrary {
  const resident = readJson<ResidentFile>("music/resident.json", { credit: "", tracks: [] });
  const chart = readJson<ChartFile>("music/chart.json", { scenes: [] });

  return {
    resident: resident.tracks.map((t) => ({ ...t, kind: "local" as const })),
    scenes: chart.scenes.map((scene) => ({
      key: scene.key,
      label: scene.label,
      labelEn: scene.labelEn,
      tracks: scene.tracks
        // 没有 previewUrl 就放不出来。整行都是「点了就播」，放不出来的行没法交代，
        // 所以在这儿就滤掉（当前 16 首全都有；这是防御性的）。
        .filter((t) => Boolean(t.previewUrl))
        .map((t, i) => ({
          id: appleIdOf(t.platformUrl, `${scene.key}-${i}`),
          kind: "apple" as const,
          src: t.previewUrl as string,
          title: t.title,
          // Apple 给的元数据只有一份标题/艺人，中英文用同一个（歌名本来就不翻译）
          titleEn: t.title,
          artist: t.artist,
          artistEn: t.artist,
          album: t.album,
          cover: t.cover,
          desc: t.desc,
          descEn: t.descEn,
          // 整首歌的长度，榜单里显示的是它；播放器的分母另算（见 useAudioPlayer）
          duration: Math.round((t.durationMs ?? 0) / 1000),
          clip: true,
          platformUrl: t.platformUrl,
        })),
    })),
    residentCredit: resident.credit,
    residentCreditEn: resident.creditEn,
  };
}

/**
 * 唱片页「我听的」那面墙。
 * ⚠️ 2026-08-30 起页面不再渲染这块（新的场景榜单覆盖了它），
 * 数据和脚本保留不删，这个函数也留着方便回退。
 */
export function getRecords(): RecordItem[] {
  return readJson<{ items: RecordItem[] }>("music/records.json", { items: [] }).items;
}
