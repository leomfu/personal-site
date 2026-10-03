import { getTranslations } from "next-intl/server";
import type { Variant } from "@/components/crab/art";
import { getMusic, getPosts, getProjects, getTools, getVideos, localized, longDate, type Post } from "./content";
import { getAlbums, type Album } from "./photos";
import { siteConfig } from "~/site.config";

/**
 * 小螃蟹们的气泡（BRIEF R7）：第三人称介绍站主，像个小导游，**只写事实**。
 * 句子的框在 messages 的 crab.lines（中英各一份），里面的名字、数字、标题全部从 content/ 和 site.config 现取，
 * 内容改了气泡跟着变；取不到的那句直接不说（不会冒出空占位）。只在构建时跑（读 content/ 要 node:fs）。
 */

export type CrabPlace = "home" | "flight" | "desk" | "screen" | "shelf" | "projector" | "darkroom" | "records" | "tools" | "window";

export type CrabCopy = {
  /** 每种造型按钮的读屏文字 */
  label: Record<Variant, string>;
  /** 每个地方的那只说什么（1–3 句，点一下换一句） */
  lines: Record<CrabPlace, string[]>;
};

const VARIANT_KEYS: Variant[] = ["desk", "astronaut", "flyer", "builder", "reader", "director", "photographer", "dj", "mail", "boxer"];

export async function getCrabCopy(locale: string): Promise<CrabCopy> {
  const t = await getTranslations({ locale, namespace: "crab" });
  const tHome = await getTranslations({ locale, namespace: "home" });
  const tVideos = await getTranslations({ locale, namespace: "videos" });
  const en = locale === "en";
  const L = (zh: string, enText?: string) => localized(locale, zh, enText);
  const listJoin = t("lines.listJoin");
  const cta = tHome("cta");

  const { profile } = siteConfig;
  const name = en ? siteConfig.nameEn : siteConfig.name;

  /* 在做的东西：「在用」的那件、已经上线能打开的那件、带数字的那件 */
  const projects = getProjects();
  const daily = projects.find((p) => p.status === "在用");
  const live = projects.find((p) => p.status === "在线" && p.link);
  const counted = projects.find((p) => p.metrics && p.metrics.length > 0);
  const metrics = counted?.metrics
    ?.map((m) => `${m.value} ${L(m.label, m.label_en)}`)
    .join(t("lines.metricJoin"));

  const posts = getPosts();
  const video = getVideos()[0];
  const albums = getAlbums();
  const resident = getMusic().resident[0];
  const tool = getTools()[0];
  const socials = siteConfig.socials.map((s) => (en ? s.labelEn : s.label)).join(listJoin);

  const keep = (lines: (string | false | undefined | null)[]) => lines.filter((x): x is string => Boolean(x));

  const records = keep([
    t("lines.records.play"),
    resident && t("lines.records.resident", { artist: en ? resident.artistEn : resident.artist }),
  ]);
  const tools = keep([
    t("lines.tools.daily"),
    tool && t("lines.tools.first", { tool: tool.name, desc: L(tool.desc, tool.desc_en) }),
  ]);

  return {
    label: Object.fromEntries(VARIANT_KEYS.map((v) => [v, t(`label.${v}`, { cta })])) as Record<Variant, string>,
    lines: {
      home: keep([
        t("lines.home.here"),
        t("lines.home.who", { name, age: profile.age, major: en ? profile.majorEn : profile.major }),
        t("lines.home.go", { cta }),
      ]),
      flight: keep([t("lines.flight.ahead"), t("lines.flight.river"), t("lines.flight.shh")]),
      desk: keep([t("lines.desk.hi"), t("lines.desk.kb"), t("lines.desk.learn")]),
      screen: keep([
        daily && t("lines.screen.daily", { name: L(daily.name, daily.name_en) }),
        live && t("lines.screen.live", { name: L(live.name, live.name_en) }),
        counted && metrics && t("lines.screen.made", { name: L(counted.name, counted.name_en), metrics }),
      ]),
      shelf: keep([
        posts[0] && t("lines.shelf.latest", { title: L(posts[0].title, posts[0].title_en) }),
        posts.length > 0 && t("lines.shelf.count", { count: posts.length }),
        t("lines.shelf.notes"),
      ]),
      projector: keep([
        video && t("lines.projector.latest", { title: L(video.title, video.title_en) }),
        video && t("lines.projector.platform", { platform: tVideos(video.platform === "bilibili" ? "bilibili" : "youtube") }),
      ]),
      darkroom: keep([
        albums[0] && albumLine(t, locale, albums[0]),
        albums.length > 1 &&
          t("lines.darkroom.cities", {
            count: albums.length,
            places: albums.map((a) => L(a.title, a.titleEn)).join(listJoin),
          }),
      ]),
      records,
      tools,
      window: keep([t("lines.window.mail"), t("lines.window.reply"), t("lines.window.socials", { socials })]),
    },
  };
}

type T = Awaited<ReturnType<typeof getTranslations>>;

function albumLine(t: T, locale: string, album: Album) {
  return t("lines.darkroom.album", { place: localized(locale, album.title, album.titleEn), year: album.year });
}

/** 某一辑照片的详情页：先说这一辑，再说一共拍过哪些城市 */
export async function getAlbumLines(locale: string, album: Album, base: CrabCopy) {
  const t = await getTranslations({ locale, namespace: "crab" });
  return [albumLine(t, locale, album), ...base.lines.darkroom.slice(1)];
}

/** 文章详情页：这一篇多长、哪天发的，再加一句他怎么记笔记 */
export async function getArticleLines(locale: string, post: Post) {
  const t = await getTranslations({ locale, namespace: "crab" });
  const minutes = (locale === "en" && post.minutes_en) || post.minutes;
  return [
    t("lines.article.minutes", { minutes }),
    t("lines.article.date", { date: longDate(post.date, locale) }),
    t("lines.shelf.notes"),
  ];
}
