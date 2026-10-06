import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DeskScreen } from "@/components/about/DeskScreen";
import { FloorPlan } from "@/components/about/FloorPlan";
import { PhotoFlip } from "@/components/about/PhotoFlip";
import { RailFocus } from "@/components/about/RailFocus";
import { RecordSleeve } from "@/components/about/RecordSleeve";
import { CopyEmail } from "@/components/common/CopyEmail";
import { LangSwitch } from "@/components/common/LangSwitch";
import { SocialLinks } from "@/components/common/SocialLinks";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { Crab } from "@/components/crab/Crab";
import { MusicCrab } from "@/components/crab/MusicCrab";
import { ToolIcon } from "@/components/icons/ToolIcon";
import { RESIDENT } from "@/components/player/PlayerProvider";
import { ScenePlate } from "@/components/scene/ScenePlate";
import { Doodle, Mark } from "@/components/sketch/Doodle";
import { DrawDriver } from "@/components/sketch/DrawDriver";
import { Ground } from "@/components/sketch/Ground";
import { Note } from "@/components/sketch/Note";
import { getAbout, getMusic, getPosts, getProjects, getTools, getVideos, localized, shortDate } from "@/lib/content";
import { getCrabCopy } from "@/lib/crabLines";
import { renderMarkdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/metadata";
import { PLACES, localePath, type PlaceKey } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";
import { getProjectShot, getScene } from "@/lib/scene";
import { DESK_FAR_RATE, SPAN } from "@/lib/tour";
import { routing } from "@/i18n/routing";
import { siteConfig } from "~/site.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "about", "/about");
}

/**
 * 完整介绍页：他房间里的 7 个地方（BRIEF §6–§9，第二版 R1–R4）。Grammar 是 Gallery / catalog：
 * 每一幕是一个地方，展品配事实标签（名称 · 年份 · 用到的 · 状态），不写推销文案。
 *
 * 第二版：夜里开场，翻开速写本。第 1 幕还是夜里的书房（提亮加暖，不放人像，MacBook 屏幕里是 Claude 应用和小螃蟹桌宠）；
 * 往下滚，一张撕下来的速写本纸从下面盖上来，从这里开始整页是暖色纸面，作品像贴在本子上，
 * 彩铅批注和爱好涂鸦随滚动一笔一笔画出来。
 *
 *   幕  地方     device                     span   情绪
 *   1   书桌前   pin + parallax（四层）      1.8    到了：一打开就是书房，小螃蟹在 MacBook 屏幕上当桌宠
 *   1尾 书桌前   flow（纸盖上来）            自然   他的自述（content/about），速写本第一页
 *   2   屏幕     pan + count                 1.9    惊讶：原来是真在跑的
 *   3   书架     flow + in                   自然   安静（只有字，最静的一幕）
 *   4   投影     flow + reveal               自然   小惊喜：黑框里擦出画面
 *   5   暗房     flow + parallax + 底色变暖   自然   怀念：照片能翻到背面
 *   6   唱片架   flow + tilt                 自然   轻松：唱片一碰就转
 *   7   写给你   pin（短停）                 1.25   笃定：速写本最后一页，停在这里，不淡出
 *
 * 2026-10-05 起「从首页撞下来」的整套开场（俯冲、沿江飞行、落窗台钻窗、进屋演出）全部下线：首页的入口是普通链接，
 * 点了直接到这里，页面开头就是书桌前。
 * 导航是房间平面图（components/about/FloorPlan），没有顶栏。
 * 每个地方住着一只 Claude 小螃蟹（BRIEF R7，components/crab）：1 屏幕上的桌宠、2 安全帽、3 圆眼镜、4 导演帽、
 * 5 贝雷帽、6 大耳机、7 邮差帽。气泡第三人称介绍他，句子从 content/ 现取（lib/crabLines）。
 * 文案全部走 messages 的 tour / places / desk / crab 命名空间；内容全部来自 content/。
 */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tour");
  const tPlaces = await getTranslations("places");
  const tPlan = await getTranslations("plan");
  const tProfile = await getTranslations("profile");
  const tTypes = await getTranslations("blog.types");
  const tRecords = await getTranslations("records.player");
  const crab = await getCrabCopy(locale);

  const en = locale === "en";
  const scene = getScene();
  const { profile, coords } = siteConfig;
  const name = en ? siteConfig.nameEn : siteConfig.name;

  const aboutHtml = await renderMarkdown(getAbout(locale).body, locale);
  const projects = getProjects();
  const posts = getPosts().slice(0, 4);
  const video = getVideos()[0];
  const albums = getAlbums();
  const music = getMusic();
  const tools = getTools().slice(0, 6);

  const labels = Object.fromEntries(
    PLACES.map((key) => [key, { name: tPlaces(`${key}.name`), title: tPlaces(`${key}.title`) }]),
  ) as Record<PlaceKey, { name: string; title: string }>;
  const gotoLabel = Object.fromEntries(
    PLACES.map((key) => [key, tPlan("goto", { place: labels[key].name, title: labels[key].title })]),
  ) as Record<PlaceKey, string>;

  const selfLabel = tProfile("label", {
    name,
    age: profile.age,
    city: en ? profile.cityEn : profile.city,
    major: en ? profile.majorEn : profile.major,
    year: profile.classOf,
  });

  /** 唱片架：每个心情组的第一张，再加常驻那张（肖邦，没有封面） */
  const sleeves = [
    ...music.scenes
      .filter((scene) => scene.tracks.length > 0)
      .map((scene) => ({ group: scene.key, shelf: en ? scene.labelEn : scene.label, track: scene.tracks[0] })),
    ...(music.resident.length ? [{ group: RESIDENT, shelf: tRecords("groupResident"), track: music.resident[0] }] : []),
  ];

  /** 暗房：三辑照片各占一层景深。第一辑（上海）在最前，后面的依次往后退 */
  const DEPTHS = [
    { depth: "front", rate: -1.2 },
    { depth: "mid", rate: 0.35 },
    { depth: "back", rate: 1.1 },
  ] as const;
  const layers = albums
    .slice(0, DEPTHS.length)
    .map((album, i) => ({ album, ...DEPTHS[i], title: localized(locale, album.title, album.titleEn) }))
    .reverse();

  /** 纸片的倾斜和胶带颜色：手贴上去的，不整齐，但有规律可循（按顺序轮换） */
  const TILTS = [-1.6, 1.2, -0.8, 1.7, -1.2, 0.9];
  const TAPES = ["", " tape--blue", " tape--orange"];
  /** 展品上的彩铅批注：只写事实（learn·wuwu 已上线；Claude-Anki 每天在用，见 content/projects） */
  const NOTES: Record<string, { text: string; tone: "orange" | "blue" }> = {
    "learn-wuwu": { text: t("notes.live"), tone: "blue" },
    "claude-anki": { text: t("notes.daily"), tone: "orange" },
  };
  const videoPlatform = video ? t(video.platform === "bilibili" ? "bilibili" : "youtube") : "";

  return (
    <ScrollCraftRoot className="tour">
      <header className="tour__top wl-chrome">
        <Link href={localePath(locale, "")} className="tour__home">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t("backOrbit")}</span>
        </Link>
        <LangSwitch />
      </header>

      <FloorPlan
        labels={labels}
        coords={coords.text}
        city={tPlan("city")}
        navLabel={tPlan("label")}
        openLabel={tPlan("open")}
        closeLabel={tPlan("close")}
        hereLabel={tPlan("now")}
        gotoLabel={gotoLabel}
      />
      <RailFocus />
      <DrawDriver />
      <Ground />

      <main>
        {/* ───────────── 1 书桌前 · 我是谁（到了，夜里） ───────────── */}
        <section
          id="desk"
          data-place="desk"
          data-sc-act="pin"
          data-sc-span={SPAN.desk}
          className="act desk"
          style={{ height: `${SPAN.desk * 100}vh` }}
          aria-labelledby="desk-title"
        >
          <div data-sc-stage className="sc-stage desk__stage">
            {/* 远景：深夜的房间（位移最小）。MacBook 那块屏幕长在图上，跟着视差和推镜一起动 */}
            <div className="desk__far room-far" data-sc-parallax={DESK_FAR_RATE}>
              <ScenePlate pair={scene.room} eager className="tone-room">
                <DeskScreen quads={scene.screen} crabLabel={crab.label.desk} crabLines={crab.lines.desk} />
              </ScenePlate>
            </div>
            {/* 氛围：台灯的一束暖光雾（自己慢慢变，只做分离） */}
            <div className="desk__haze" aria-hidden />
            {/* 前景：失焦的光点（位移最大） */}
            <div className="desk__fore" data-sc-parallax="-1.8" aria-hidden>
              <span className="bokeh bokeh--1" />
              <span className="bokeh bokeh--2" />
              <span className="bokeh bokeh--3" />
              <span className="bokeh bokeh--4" />
              <span className="bokeh bokeh--5" />
            </div>
            <div className="sc-scrim sc-scrim--lead desk__scrim" aria-hidden />

            <div className="sc-copy sc-copy--lead desk__copy">
              <div className="desk__hello" data-sc-cue="0 1 0 0">
                <p className="desk__coords mono">
                  {coords.text} · {t("arrived")}
                </p>
                <h1 id="desk-title" tabIndex={-1} className="desk__name">
                  {name}
                </h1>
              </div>
              <p className="placard__label desk__label" data-sc-cue="0.05 1 0.3 0">
                {selfLabel}
              </p>
              <p className="desk__tagline" data-sc-cue="0.12 1 0.3 0">
                {en ? siteConfig.taglineEn : siteConfig.tagline}
              </p>
            </div>
          </div>
        </section>

        {/*
         * 速写本：一张撕下来的纸从下面盖上来（负的上外边距让它在第 1 幕还钉着的时候就滑进来），
         * 从这里开始到最后都是纸面。上沿那条撕口是单独一小条（带投影），纸本身不加滤镜。
         */}
        <div className="sheet paper" data-paper>
          <div className="sheet__edge" aria-hidden />

          {/* 1 尾：他的自述（速写本第一页） */}
          <section data-place="desk" data-sc-act="flow" className="act self" aria-label={t("selfIntro")}>
            <div className="self__inner">
              <div className="prose prose--self" data-sc-in dangerouslySetInnerHTML={{ __html: aboutHtml }} />
              <div className="self__margin" aria-hidden>
                <Note className="self__note" text={t("notes.self")} arrow="left" tone="blue" rot={-3} auto />
                <Doodle kind="glove" className="self__doodle self__doodle--glove" rot={-8} auto />
                <Doodle kind="shoe" tone="blue" className="self__doodle self__doodle--shoe" rot={6} auto />
                <Doodle kind="goggles" className="self__doodle self__doodle--goggles" rot={-4} auto />
              </div>
            </div>
          </section>

          {/* ───────────── 2 屏幕 · 在做的东西 ───────────── */}
          <section
            id="screen"
            data-place="screen"
            data-sc-act="pan"
            data-sc-span={SPAN.screen}
            data-span-compact={SPAN.screenCompact}
            className="act screen"
            style={{ height: `${SPAN.screen * 100}vh` }}
            aria-labelledby="screen-title"
          >
            <div data-sc-stage className="sc-stage screen__stage">
              <div className="rail" data-sc-pan="0.04">
                <header className="rail__head">
                  <h2 id="screen-title" tabIndex={-1} className="act__title">
                    {tPlaces("screen.title")}
                    <Mark kind="wave" className="act__wave" from={0.02} to={0.14} />
                  </h2>
                  <p className="rail__lead">{t("screenLead", { count: projects.length })}</p>
                  {/* 戴安全帽的小螃蟹：站在纸上，推着右边的展品往前走、拿扳手敲敲打打 */}
                  <div className="rail__crab">
                    <Crab variant="builder" label={crab.label.builder} lines={crab.lines.screen} side="up-right" />
                  </div>
                </header>

                {projects.map((project, i) => {
                  const shot = getProjectShot(project.slug);
                  const projectName = localized(locale, project.name, project.name_en);
                  const stack = (project.featuredStack ?? project.stack ?? []).join(" / ");
                  const status = project.status ? localized(locale, project.status, project.status_en) : "";
                  const label = [projectName, project.year, stack, status].filter(Boolean).join(" · ");
                  const note = NOTES[project.slug];
                  return (
                    <article
                      key={project.slug}
                      className={shot ? "exhibit exhibit--shot" : "exhibit exhibit--text"}
                      style={{ "--i": i + 1 } as CSSProperties}
                    >
                      <div className="scrap scrap--lift" style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as CSSProperties}>
                        <span className={`tape${TAPES[i % TAPES.length]}`} aria-hidden />
                        <div className="scrap__paper deckle exhibit__paper">
                          {shot && (
                            <div className="exhibit__screen print">
                              {/* eslint-disable-next-line @next/next/no-img-element -- 项目真实截图，原图原色 */}
                              <img src={shot.src} width={shot.width} height={shot.height} alt={t("shotAlt", { name: projectName })} loading="lazy" decoding="async" />
                            </div>
                          )}
                          <h3 className="exhibit__name">{projectName}</h3>
                          <p className="placard__label">{label}</p>
                          <p className="exhibit__summary">
                            {localized(locale, project.summary ?? project.desc, project.summary_en ?? project.desc_en)}
                          </p>
                          {project.metrics && project.metrics.length > 0 && (
                            <p className="exhibit__metrics">
                              {project.metrics.map((metric) => (
                                <span key={metric.label} className="metric">
                                  <b className="metric__value" data-sc-count={`0 ${metric.value}`} data-sc-count-at="0.46 0.74">
                                    {metric.value}
                                  </b>
                                  <span className="metric__label">{localized(locale, metric.label, metric.label_en)}</span>
                                </span>
                              ))}
                              <Mark kind="circle" className="exhibit__circle" auto />
                            </p>
                          )}
                          <p className="exhibit__links">
                            {project.link && (
                              <a href={project.link} target="_blank" rel="noreferrer noopener">
                                {t("visit")}
                              </a>
                            )}
                            {project.repo && (
                              <a href={project.repo} target="_blank" rel="noreferrer noopener">
                                {t("repo")}
                              </a>
                            )}
                            {!project.link && !project.repo && <span className="exhibit__nolink">{t("noLink")}</span>}
                          </p>
                        </div>
                      </div>
                      {note && <Note className="exhibit__note" text={note.text} tone={note.tone} arrow="up-left" rot={-2} auto />}
                    </article>
                  );
                })}

                <footer className="rail__end">
                  <Link href={localePath(locale, "/projects")} className="viewall">
                    {t("screenAll")}
                  </Link>
                </footer>
              </div>
            </div>
          </section>

          {/* ───────────── 3 书架 · 写下来的（只有字，最静） ───────────── */}
          <section id="shelf" data-place="shelf" data-sc-act="flow" className="act shelf" aria-labelledby="shelf-title">
            <div className="shelf__inner">
              <div className="shelf__head">
                <h2 id="shelf-title" tabIndex={-1} className="act__title" data-sc-in>
                  {tPlaces("shelf.title")}
                </h2>
                <Note className="shelf__note" text={t("notes.shelf", { count: posts.length })} arrow="left" tone="blue" rot={-3} auto />
              </div>
              {/* 戴圆眼镜的小螃蟹：蹲在横格本第一条线上，翻页写字 */}
              <div className="shelf__crab">
                <Crab variant="reader" label={crab.label.reader} lines={crab.lines.shelf} side="up-left" />
              </div>
              <ol className="spines" data-sc-in data-sc-stagger="70">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link href={localePath(locale, `/blog/${post.slug}`)} className="spine">
                      <span className="spine__date mono">{post.date}</span>
                      <span className="spine__title">{localized(locale, post.title, post.title_en)}</span>
                      <span className="spine__summary">{localized(locale, post.summary, post.summary_en)}</span>
                      <span className="spine__meta mono">
                        {tTypes(post.type)} · {t("minutes", { minutes: (en && post.minutes_en) || post.minutes })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href={localePath(locale, "/blog")} className="viewall" data-sc-in>
                {t("shelfAll")}
              </Link>
            </div>
          </section>

          {/* ───────────── 4 投影 · 录下来的 ───────────── */}
          <section id="projector" data-place="projector" data-sc-act="flow" className="act projector" aria-labelledby="projector-title">
            <div className="projector__inner">
              <h2 id="projector-title" tabIndex={-1} className="act__title" data-sc-in>
                {tPlaces("projector.title")}
              </h2>
              {video && (
                <>
                  <div className="projector__film scrap" style={{ "--tilt": "-1deg" } as CSSProperties}>
                    <span className="tape tape--corner-l" aria-hidden />
                    <span className="tape tape--corner-r tape--blue" aria-hidden />
                    {/* 戴导演帽的小螃蟹：坐在黑卡纸上沿，打板 */}
                    <div className="projector__crab">
                      <Crab variant="director" label={crab.label.director} lines={crab.lines.projector} side="up-left" />
                    </div>
                    <div className="projector__frame" data-sc-reveal="left" data-sc-reveal-at="0.14 0.42">
                      <Link href={localePath(locale, "/videos")} className="projector__screen">
                        {video.cover && (
                          // eslint-disable-next-line @next/next/no-img-element -- 视频封面是作品，原图原色
                          <img src={video.cover} alt="" width={1280} height={708} loading="lazy" decoding="async" />
                        )}
                        <span className="projector__play" aria-hidden>
                          <svg width="22" height="24" viewBox="0 0 16 18" fill="currentColor">
                            <path d="M15 9 0 18V0z" />
                          </svg>
                        </span>
                        <span className="sr-only">{t("projectorWatch", { title: localized(locale, video.title, video.title_en) })}</span>
                      </Link>
                    </div>
                  </div>
                  <div className="projector__placard" data-sc-in>
                    <Note className="projector__note" text={t("notes.video", { platform: videoPlatform })} arrow="up-left" rot={-3} auto />
                    <p className="placard__label">
                      {[
                        localized(locale, video.title, video.title_en),
                        video.date.slice(0, 4),
                        videoPlatform,
                        t("published", { date: shortDate(video.date, locale) }),
                      ].join(" · ")}
                    </p>
                    <p className="projector__summary">
                      {localized(locale, video.summary ?? video.desc, video.summary_en ?? video.desc_en)}
                    </p>
                    <Link href={localePath(locale, "/videos")} className="viewall">
                      {t("projectorAll")}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ───────────── 5 暗房 · 拍下来的 ───────────── */}
          <section id="darkroom" data-place="darkroom" data-sc-act="flow" className="act darkroom" aria-labelledby="darkroom-title">
            <div className="darkroom__ground" aria-hidden />
            <div className="darkroom__inner">
              <div className="darkroom__head">
                <h2 id="darkroom-title" tabIndex={-1} className="act__title" data-sc-in>
                  {tPlaces("darkroom.title")}
                </h2>
                <Note className="darkroom__note" text={t("notes.flip")} arrow="down-right" tone="blue" rot={-2} auto />
                {/* 戴贝雷帽、胸前挂相机的小螃蟹：按快门，闪一下 */}
                <div className="darkroom__crab">
                  <Crab variant="photographer" label={crab.label.photographer} lines={crab.lines.darkroom} side="up-left" />
                </div>
                <Doodle kind="camera" className="darkroom__doodle" rot={8} auto />
              </div>
              <div className="darkroom__stage">
                {layers.map(({ album, depth, rate, title }) => (
                  <div key={album.slug} className={`darkroom__layer darkroom__layer--${depth}`} data-sc-parallax={rate}>
                    {album.photos.slice(0, 2).map((photo, i) => {
                      const caption = localized(locale, photo.caption ?? "", photo.captionEn);
                      return (
                        <PhotoFlip
                          key={photo.file}
                          className={`print-slot print--${depth}-${i + 1}`}
                          src={photo.src}
                          width={photo.width}
                          height={photo.height}
                          place={title}
                          year={album.year}
                          caption={caption}
                          flipLabel={t("flipAria", { caption: caption || title })}
                          backLabel={t("flipBackAria", { caption: caption || title })}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <ul className="darkroom__albums" data-sc-in data-sc-stagger="70">
                {albums.map((album) => (
                  <li key={album.slug}>
                    <Link href={localePath(locale, `/photos/${album.slug}`)} className="placard__label">
                      {localized(locale, album.title, album.titleEn)} · {t("albumMeta", { year: album.year, count: album.photos.length })}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={localePath(locale, "/photos")} className="viewall" data-sc-in>
                {t("darkroomAll")}
              </Link>
            </div>
          </section>

          {/* ───────────── 6 唱片架 · 听的和用的 ───────────── */}
          <section id="records" data-place="records" data-sc-act="flow" className="act records" aria-labelledby="records-title">
            <div className="records__inner">
              <div className="records__head" data-sc-in>
                <h2 id="records-title" tabIndex={-1} className="act__title">
                  {tPlaces("records.title")}
                </h2>
                <Note className="records__note" text={t("notes.records")} arrow="down-left" rot={-2} auto />
                {/* 戴大耳机的小螃蟹：跟着节奏摇摆；迷你播放器放歌时点头 */}
                <div className="records__crab">
                  <MusicCrab label={crab.label.dj} lines={[...crab.lines.records, crab.lines.tools[0]]} side="up-left" />
                </div>
                <Doodle kind="vinyl" tone="blue" className="records__doodle" rot={-10} auto />
              </div>
              <div className="shelfrow" data-sc-in data-sc-stagger="60">
                {sleeves.map(({ group, shelf, track }) => (
                  <div key={`${group}-${track.id}`} className="shelfrow__item">
                    <RecordSleeve
                      group={group}
                      index={0}
                      title={en ? track.titleEn : track.title}
                      artist={en ? track.artistEn : track.artist}
                      cover={track.cover}
                      shelf={shelf}
                    />
                  </div>
                ))}
              </div>
              <Link href={localePath(locale, "/records")} className="viewall">
                {t("recordsAll")}
              </Link>

              <div className="toolshelf scrap scrap--lift" style={{ "--tilt": "0.8deg" } as CSSProperties}>
                <span className="tape tape--blue" aria-hidden />
                <div className="scrap__paper deckle-top toolshelf__paper">
                  <h3 className="toolshelf__title">{t("toolsTitle")}</h3>
                  <ul className="toolshelf__list" data-sc-in data-sc-stagger="40">
                    {tools.map((tool) => (
                      <li key={tool.name}>
                        <a href={tool.url} target="_blank" rel="noreferrer noopener" className="tool">
                          <ToolIcon name={tool.icon} size={18} />
                          <span className="tool__name">{tool.name}</span>
                          <span className="tool__desc">{localized(locale, tool.desc, tool.desc_en)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <Link href={localePath(locale, "/tools")} className="viewall">
                    {t("toolsAll")}
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ───────────── 7 写给你（速写本最后一页，停住，不淡出） ───────────── */}
          <section
            id="window"
            data-place="window"
            data-sc-act="pin"
            data-sc-span={SPAN.window}
            className="act window"
            style={{ height: `${SPAN.window * 100}vh` }}
            aria-labelledby="window-title"
          >
            <div data-sc-stage className="sc-stage window__stage">
              <div className="window__inner" data-sc-cue="0 1 0 0">
                <article className="postcard scrap" style={{ "--tilt": "-1.2deg" } as CSSProperties}>
                  <span className="tape tape--orange" aria-hidden />
                  <div className="scrap__paper postcard__paper">
                    <div className="postcard__left">
                      <h2 id="window-title" tabIndex={-1} className="postcard__title">
                        {tPlaces("window.title")}
                      </h2>
                      <p className="postcard__lead">{t("windowLead")}</p>
                      <Note className="postcard__note note--inline" text={t("notes.reply")} arrow="none" tone="blue" rot={-2} from={0} to={0.01} />
                      {/* 戴邮差帽的小螃蟹：递出信封、挥手告别 */}
                      <div className="postcard__crab">
                        <Crab variant="mail" label={crab.label.mail} lines={crab.lines.window} side="up-right" />
                      </div>
                    </div>
                    <div className="postcard__right">
                      <div className="postcard__stamp" role="img" aria-label={t("stampAlt")}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- 邮票上是书房窗外那片夜景（同一张房间图，放大到窗户） */}
                        <img src={scene.room.wide.src} width={scene.room.wide.width} height={scene.room.wide.height} alt="" loading="lazy" decoding="async" />
                      </div>
                      <svg className="postmark" viewBox="0 0 160 120" role="img" aria-label={t("postmark", { city: tPlan("city"), coords: coords.text })}>
                        <defs>
                          <path id="postmark-arc" d="M60 98a38 38 0 1 1 0.1 0" />
                        </defs>
                        <circle cx="60" cy="60" r="44" />
                        <circle cx="60" cy="60" r="27" />
                        <text className="postmark__ring">
                          <textPath href="#postmark-arc" startOffset="2%">
                            {coords.text} · {coords.text}
                          </textPath>
                        </text>
                        <text className="postmark__city" x="60" y="66" textAnchor="middle">
                          {tPlan("city")}
                        </text>
                        <path className="postmark__waves" d="M108 44c8-5 16 5 24 0s16 5 24 0M108 60c8-5 16 5 24 0s16 5 24 0M108 76c8-5 16 5 24 0s16 5 24 0" />
                      </svg>
                      <p className="postcard__to hand">{t("postcardTo")}</p>
                      <CopyEmail email={siteConfig.email} className="postcard__email" />
                      <SocialLinks locale={locale} variant="rows" className="postcard__socials" />
                    </div>
                  </div>
                </article>
                <p className="window__foot">
                  <Link href={localePath(locale, "")}>{t("backOrbit")}</Link>
                  <span aria-hidden> · </span>
                  <span>
                    © {siteConfig.since} {name} · weiliang.dev
                  </span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </ScrollCraftRoot>
  );
}
