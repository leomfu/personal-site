import type { CSSProperties } from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FloorPlan } from "@/components/about/FloorPlan";
import { RecordSleeve } from "@/components/about/RecordSleeve";
import { CopyEmail } from "@/components/common/CopyEmail";
import { LangSwitch } from "@/components/common/LangSwitch";
import { SocialLinks } from "@/components/common/SocialLinks";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { ToolIcon } from "@/components/icons/ToolIcon";
import { RESIDENT } from "@/components/player/PlayerProvider";
import { ScenePlate } from "@/components/scene/ScenePlate";
import { getAbout, getMusic, getPosts, getProjects, getTools, getVideos, localized, shortDate } from "@/lib/content";
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
 * 完整介绍页：他房间里的 7 个地方（BRIEF §6–§9）。Grammar 是 Gallery / catalog：
 * 每一幕是一个地方，展品配事实标签（名称 · 年份 · 用到的 · 状态），不写推销文案。
 *
 *   幕  地方     device                 span   情绪
 *   1   书桌前   pin + parallax（四层）  2.6    震撼 → 亲近（峰值，俯冲落地的地方）
 *   1尾 书桌前   flow + in               自然   他的自述（content/about）
 *   2   屏幕     pan + count             1.9    惊讶：原来是真在跑的
 *   3   书架     flow + in               自然   安静（故意只有字）
 *   4   投影     flow + reveal           自然   小惊喜：黑场里擦出画面
 *   5   暗房     flow + parallax + 底色变暖 自然 怀念
 *   6   唱片架   flow + tilt             自然   轻松
 *   7   窗边     pin（短停）             1.25   笃定：停在这里，不淡出
 *
 * 导航是房间平面图（components/about/FloorPlan），没有顶栏。
 * 文案全部走 messages 的 tour / places 命名空间；内容全部来自 content/。
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

  return (
    <ScrollCraftRoot className="tour">
      <header className="tour__top">
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

      <main>
        {/* ───────────── 1 书桌前 · 我是谁（峰值） ───────────── */}
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
            {/* 远景：深夜的房间（位移最小） */}
            <div className="desk__far room-far" data-sc-parallax={DESK_FAR_RATE}>
              <ScenePlate pair={scene.room} eager />
            </div>
            {/* 氛围：台灯的一束暖光雾（自己慢慢变，只做分离） */}
            <div className="desk__haze" aria-hidden />
            {/* 主体：他（位移中等，轻微放大） */}
            {scene.portrait.exists && (
              <div className="desk__subject" data-sc-parallax="-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- 抠图层，尺寸和位置都在 CSS 里 */}
                <img
                  className="desk__portrait"
                  src={scene.portrait.src}
                  width={scene.portrait.width}
                  height={scene.portrait.height}
                  alt={t("portraitAlt", { name })}
                  fetchPriority="high"
                />
              </div>
            )}
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
              <div className="desk__hello" data-sc-cue="0 0.62 0 0.4">
                <p className="desk__coords mono">
                  {coords.text} · {t("landed")}
                </p>
                <h1 id="desk-title" tabIndex={-1} className="desk__name">
                  {name}
                </h1>
              </div>
              <p className="placard__label mono desk__label" data-sc-cue="0.2 1 0.2 0.14">
                {selfLabel}
              </p>
              <p className="desk__tagline" data-sc-cue="0.42 1 0.3 0.2">
                {en ? siteConfig.taglineEn : siteConfig.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* 1 尾：他的自述（pin 松开后接着读） */}
        <section data-place="desk" data-sc-act="flow" className="act desk-tail" aria-label={t("selfIntro")}>
          <div className="desk-tail__inner">
            <div className="prose prose--self" data-sc-in dangerouslySetInnerHTML={{ __html: aboutHtml }} />
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
            <div className="screen__light" aria-hidden />
            <div className="rail" data-sc-pan="0.04">
              <header className="rail__head">
                <h2 id="screen-title" tabIndex={-1} className="act__title">
                  {tPlaces("screen.title")}
                </h2>
                <p className="rail__lead">{t("screenLead", { count: projects.length })}</p>
              </header>

              {projects.map((project, i) => {
                const shot = getProjectShot(project.slug);
                const projectName = localized(locale, project.name, project.name_en);
                const stack = (project.featuredStack ?? project.stack ?? []).join(" / ");
                const status = project.status ? localized(locale, project.status, project.status_en) : "";
                const label = [projectName, project.year, stack, status].filter(Boolean).join(" · ");
                return (
                  <article
                    key={project.slug}
                    className={shot ? "exhibit exhibit--shot" : "exhibit exhibit--text"}
                    style={{ "--i": i + 1 } as CSSProperties}
                  >
                    {shot && (
                      <div className="exhibit__screen">
                        {/* eslint-disable-next-line @next/next/no-img-element -- 项目真实截图，原图原色 */}
                        <img src={shot.src} width={shot.width} height={shot.height} alt={t("shotAlt", { name: projectName })} loading="lazy" decoding="async" />
                      </div>
                    )}
                    <h3 className="exhibit__name">{projectName}</h3>
                    <p className="placard__label mono">{label}</p>
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

        {/* ───────────── 3 书架 · 写下来的（故意只有字） ───────────── */}
        <section id="shelf" data-place="shelf" data-sc-act="flow" className="act shelf" aria-labelledby="shelf-title">
          <div className="shelf__inner">
            <h2 id="shelf-title" tabIndex={-1} className="act__title" data-sc-in>
              {tPlaces("shelf.title")}
            </h2>
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
                <div className="projector__frame" data-sc-reveal="left" data-sc-reveal-at="0.14 0.44">
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
                <div className="projector__placard" data-sc-in>
                  <p className="placard__label mono">
                    {[
                      localized(locale, video.title, video.title_en),
                      video.date.slice(0, 4),
                      t(video.platform === "bilibili" ? "bilibili" : "youtube"),
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
          <div className="darkroom__safelight" aria-hidden />
          <div className="darkroom__inner">
            <h2 id="darkroom-title" tabIndex={-1} className="act__title" data-sc-in>
              {tPlaces("darkroom.title")}
            </h2>
            <div className="darkroom__stage">
              {layers.map(({ album, depth, rate, title }) => (
                <div key={album.slug} className={`darkroom__layer darkroom__layer--${depth}`} data-sc-parallax={rate}>
                  {album.photos.slice(0, 2).map((photo, i) => (
                    <Link
                      key={photo.file}
                      href={localePath(locale, `/photos/${album.slug}`)}
                      className={`print print--${depth}-${i + 1}${photo.height > photo.width ? " is-tall" : ""}`}
                      aria-label={t("printAria", { title, caption: localized(locale, photo.caption ?? "", photo.captionEn) })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- 摄影作品，原图原色，不裁切 */}
                      <img src={photo.src} width={photo.width} height={photo.height} alt="" loading="lazy" decoding="async" />
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <ul className="darkroom__albums" data-sc-in data-sc-stagger="70">
              {albums.map((album) => (
                <li key={album.slug}>
                  <Link href={localePath(locale, `/photos/${album.slug}`)} className="placard__label mono">
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
              <p className="records__hint">{t("recordsHint")}</p>
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

            <div className="toolshelf">
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
        </section>

        {/* ───────────── 7 窗边 · 联系（停住，不淡出） ───────────── */}
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
            <div className="window__view">
              <ScenePlate pair={scene.room} />
            </div>
            <div className="window__scrim" aria-hidden />
            <div className="window__copy">
              <p className="window__coords mono" data-sc-cue="0 1 0 0">
                {coords.text}
                <span>{tPlan("city")}</span>
              </p>
              <div className="nameplate" data-sc-cue="0.06">
                <p className="placard__label mono">{t("windowLabel", { year: siteConfig.since })}</p>
                <h2 id="window-title" tabIndex={-1} className="nameplate__title">
                  {tPlaces("window.title")}
                </h2>
                <p className="nameplate__lead">{t("windowLead")}</p>
                <CopyEmail email={siteConfig.email} className="nameplate__email" />
                <SocialLinks locale={locale} variant="rows" className="nameplate__socials" />
                <p className="nameplate__foot">
                  <Link href={localePath(locale, "")}>{t("backOrbit")}</Link>
                  <span aria-hidden> · </span>
                  <span>© {siteConfig.since} {name} · weiliang.dev</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ScrollCraftRoot>
  );
}
