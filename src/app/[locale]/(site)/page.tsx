import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroAvatar } from "@/components/home/HeroAvatar";
import { HobbyPills } from "@/components/home/HobbyPills";
import { Reveal } from "@/components/ui/Reveal";
import { ContentFooter, SectionTitle } from "@/components/ui/PageHeader";
import {
  getHomeIntro,
  getNow,
  getPosts,
  getProjects,
  getVideos,
  localized,
  monthLabel,
  shortDate,
} from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { renderMarkdown } from "@/lib/markdown";
import { localePath } from "@/lib/nav";
import { routing } from "@/i18n/routing";
import { siteConfig } from "~/site.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMetadata(locale, "home", "");
}

/**
 * 首页 —— 2026-09-17 改版重做（handoff §6.2）。四块：
 *
 *   Hero      左文右图。左边：橙标签 → 眉题 → 手写大标题两行（第二行主色）
 *             → 62×3 主色短横 → 引导语 → 两个按钮；右边是拱门头像卡（带鼠标视差）
 *   在做的     三张玻璃卡，每张右上角一个 92px 的手写序号当底纹
 *   最近写的 / 最近拍的   左边四行日期+标题，右边一张 16:9 的视频卡
 *   爱好       两条胶囊行（摄影 / 唱片）
 *
 * ⚠️ **整页收在 1080px 版心里**（`max-w-page-narrow`，和关于页、联系页同一档）。
 * 摊在 1180px 上时四块都是歪的 —— 这一条是改版之前就定下来的，别改回去。
 *
 * ⚠️ 数据全部接 lib/content 的管线：featured 项目、最近文章、最新视频。
 * 一条都不要写死在组件里。
 *
 * ⚠️ 网格里的每一张卡各自包一个 `<Reveal index={i}>` —— 卡片是一张张分别滑进来的，
 * 不是整块一起进（handoff §5.3）。
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tVideos = await getTranslations("videos");

  const name = locale === "en" ? siteConfig.nameEn : siteConfig.name;
  const tagline = locale === "en" ? siteConfig.taglineEn : siteConfig.tagline;
  const intro = await renderMarkdown(getHomeIntro(locale).body, locale);
  const now = getNow(locale);
  const featured = getProjects().filter((p) => p.featured).slice(0, 3);
  const posts = getPosts().slice(0, 4);
  const latestVideo = getVideos()[0];

  return (
    <div className="mx-auto w-full max-w-page-narrow">
      {/* ---------------- Hero ---------------- */}
      <Reveal index={0} className="grid items-center gap-8 pt-8 pb-16 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col items-start">
          <span className="rounded-full bg-accent-2-100 px-[14px] py-[5px] text-[12px] text-accent-2-700">
            {t("heroTag")}
          </span>

          <span className="mt-6 text-[15px] tracking-[0.22em] text-muted opacity-55">
            {t("heroEyebrow")}
          </span>

          <h1 className="mt-3 font-hand text-[clamp(56px,7.4vw,98px)] leading-[1.14] font-normal text-ink">
            {t("heroTitle1")}
            <br />
            <span className="text-accent">{t("heroTitle2")}</span>
          </h1>

          <span className="mt-6 block h-[3px] w-[62px] rounded-full bg-accent" aria-hidden />

          <p className="mt-6 max-w-[44ch] text-[17px] leading-[1.9] text-body">{tagline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(locale, "/projects")}
              className="btn-primary-glow rounded-full bg-accent px-[26px] py-3 text-[14px] font-medium text-neutral-100 transition-colors hover:bg-accent-600"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href={localePath(locale, "/contact")}
              className="glass-soft rounded-full px-[26px] py-3 text-[14px] text-ink transition-colors hover:text-accent-700"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        {/* 头像用的是首页那张双色调照片（hero-src/road.png 印出来的）。
            真头像到位后换掉 HeroAvatar 里那一个 src 就行，见 docs/素材清单.md */}
        <HeroAvatar badge={t("avatarBadge")} alt={name} />
      </Reveal>

      {/* ---------------- 关于 ----------------
          ⚠️ 这一块**不在 handoff §6.2 的四块里**，是实现时补回来的：
          content/home/intro.{locale}.md 是站主自己写的一段自我介绍，设计稿的首页
          没给它位置，照着做等于把这段文字从站上删掉。所以按新设计的语言
          （一张玻璃卡）留在 Hero 和「在做的」之间。真不想要就删掉这个 section，
          那份 markdown 也就只剩关于页在用了。 */}
      <section className="pb-14">
        <Reveal index={1}>
          <div className="glass p-8 sm:p-10">
            <span className="text-[12px] tracking-(--tracking-label) text-accent-700">
              {t("aboutLabel")}
            </span>
            <div
              className="prose-bw prose-about mt-4"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          </div>
        </Reveal>
      </section>

      {/* ---------------- 在做的 ---------------- */}
      <section className="pb-14">
        <Reveal index={1}>
          <SectionTitle
            title={t("buildingTitle")}
            note={now.updated ? monthLabel(now.updated, locale) : undefined}
          />
        </Reveal>

        {featured.length === 0 ? (
          <Reveal index={2}>
            <p className="mt-6 text-[15px] leading-[1.9] text-muted">{t("noProjects")}</p>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {featured.map((project, i) => {
              const label = localized(locale, project.name, project.name_en);
              const desc = localized(locale, project.desc, project.desc_en);
              const status = project.status
                ? localized(locale, project.status, project.status_en)
                : undefined;
              const no = String(i + 1).padStart(2, "0");
              const href = project.link ?? localePath(locale, "/projects");
              const external = Boolean(project.link);

              const card = (
                <article className="glass group relative flex h-full flex-col gap-3 overflow-hidden p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                  {/* 手写序号：淡到 .5 的一层底纹，蓝橙交替 */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute -top-4 right-4 font-hand text-[92px] leading-none opacity-50 select-none ${
                      i % 2 === 0 ? "text-accent-300" : "text-accent-2-300"
                    }`}
                  >
                    {no}
                  </span>

                  {status && (
                    <span className="glass-tag relative w-fit rounded-full px-[14px] py-[5px] text-[12px] text-accent-800">
                      {status}
                    </span>
                  )}

                  <h3 className="relative max-w-[80%] text-[21px] leading-[1.35] text-ink">
                    {label}
                  </h3>

                  <p className="relative text-[14px] leading-[1.8] text-body">{desc}</p>

                  {project.stack && project.stack.length > 0 && (
                    <div className="relative mt-auto flex flex-wrap gap-2 pt-3">
                      {project.stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-neutral-200 px-[12px] py-[4px] text-[11.5px] text-muted"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );

              return (
                <Reveal key={project.slug} index={i} className="h-full">
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="block h-full rounded-[calc(var(--radius-lg)*1.15)]"
                    >
                      {card}
                    </a>
                  ) : (
                    <Link href={href} className="block h-full rounded-[calc(var(--radius-lg)*1.15)]">
                      {card}
                    </Link>
                  )}
                </Reveal>
              );
            })}
          </div>
        )}

        <Reveal index={3}>
          <p className="mt-6 text-[13.5px] text-muted">
            {t.rich("moreProjects", {
              link: (chunks) => (
                <Link
                  href={localePath(locale, "/projects")}
                  className="text-accent-700 underline decoration-accent-300 underline-offset-4 transition-colors hover:decoration-accent-700"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </Reveal>
      </section>

      {/* ---------------- 最近写的 / 最近拍的 ---------------- */}
      <section className="grid gap-10 pb-14 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <Reveal index={0} className="flex flex-col">
          <SectionTitle title={t("writingTitle")} />
          <div className="mt-6 flex flex-col">
            {posts.length === 0 && (
              <p className="py-6 text-[15px] leading-[1.9] text-muted">{t("noPosts")}</p>
            )}
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={localePath(locale, `/blog/${post.slug}`)}
                className="grid grid-cols-[64px_1fr] items-baseline gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-accent-100"
              >
                <span className="text-[12.5px] text-faint">{shortDate(post.date, locale)}</span>
                <span className="text-[15px] leading-[1.6] text-ink">
                  {localized(locale, post.title, post.title_en)}
                </span>
              </Link>
            ))}
          </div>
          {posts.length > 0 && (
            <p className="mt-auto pt-6 text-[13.5px] text-muted">
              {t.rich("morePosts", {
                link: (chunks) => (
                  <Link
                    href={localePath(locale, "/blog")}
                    className="text-accent-700 underline decoration-accent-300 underline-offset-4 transition-colors hover:decoration-accent-700"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          )}
        </Reveal>

        {latestVideo && (
          <Reveal index={1} className="flex flex-col">
            <SectionTitle title={t("photosTitle")} />
            {/* 只是一张通往视频页的封面卡，播放器仍然只在视频页里加载 */}
            <Link
              href={localePath(locale, "/videos")}
              className="glass group mt-6 block overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-lg"
            >
              <span className="relative block w-full overflow-hidden bg-neutral-300" style={{ aspectRatio: "16 / 9" }}>
                {latestVideo.cover && (
                  <Image
                    src={latestVideo.cover}
                    alt={localized(locale, latestVideo.title, latestVideo.title_en)}
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover saturate-[0.72] brightness-[1.06]"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-[58px] items-center justify-center rounded-full bg-accent text-neutral-100 transition-transform duration-300 group-hover:scale-105">
                    <svg width="15" height="17" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
                      <path d="M15 9 0 18V0z" />
                    </svg>
                  </span>
                </span>
              </span>
              <span className="flex flex-col gap-1.5 px-6 py-5">
                <span className="text-[16px] text-ink">
                  {localized(locale, latestVideo.title, latestVideo.title_en)}
                </span>
                <span className="text-[12.5px] text-faint">
                  {shortDate(latestVideo.date, locale)} · {tVideos("title")}
                </span>
              </span>
            </Link>
          </Reveal>
        )}
      </section>

      {/* ---------------- 爱好 ---------------- */}
      <section className="pb-6">
        <Reveal index={0}>
          <SectionTitle title={t("hobbiesTitle")} />
        </Reveal>
        <Reveal index={1}>
          <HobbyPills locale={locale} />
        </Reveal>
      </section>

      <Reveal index={2}>
        <ContentFooter
          note={t.rich("footerNote", {
            link: (chunks) => (
              <Link
                href={localePath(locale, "/contact")}
                className="text-accent-700 underline decoration-accent-300 underline-offset-4 transition-colors hover:decoration-accent-700"
              >
                {chunks}
              </Link>
            ),
          })}
        />
      </Reveal>
    </div>
  );
}
