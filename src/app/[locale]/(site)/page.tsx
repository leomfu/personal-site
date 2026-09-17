import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroAvatar } from "@/components/home/HeroAvatar";
import { HobbyPills } from "@/components/home/HobbyPills";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/PageHeader";
import {
  getHomeIntro,
  getPosts,
  getProjects,
  getVideos,
  localized,
  shortDate,
} from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { routing } from "@/i18n/routing";

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
 * 首页 —— 改版定稿（docs/design/改版规格.md §6.2）。四块：
 *
 *   Hero      左文右图。左：橙标签 → 眉题 → 手写大标题三行（第三行主色）→ 62×3 主色短横
 *             → 引导语（content/home/intro.zh.md）→ 两个按钮；右：拍立得头像卡（带鼠标视差）
 *   在做的     三张玻璃卡（projects.json 里 featured 的），右上角 92px 手写序号
 *   最近写的 / 最近拍的   左边四行日期+标题，右边一张 16:9 的视频卡
 *   爱好       两条胶囊行（摄影 / 唱片 —— 唱片是音乐页唯一的入口）
 *
 * ⚠️ 数据全部接 lib/content 的管线，一条都不要写死在组件里。
 * ⚠️ 网格里的每一张卡各自包一个 `<Reveal index={i}>` —— 卡片是一张张分别滑进来的。
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const intro = getHomeIntro(locale).body;
  const featured = getProjects().filter((p) => p.featured).slice(0, 3);
  const posts = getPosts().slice(0, 4);
  const latestVideo = getVideos()[0];

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <Reveal
        index={0}
        className="grid items-center gap-8 pt-8 pb-[56px] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]"
      >
        <div className="flex min-w-0 flex-col items-start">
          <span className="glass-tag-2 rounded-full px-[14px] py-[5px] text-[12px]">
            {t("heroTag")}
          </span>

          <span className="mt-4 text-[15px] leading-none font-medium tracking-[0.22em] text-ink opacity-55">
            {t("heroEyebrow")}
          </span>

          <h1 className="mt-3 flex flex-col font-hand text-[clamp(56px,7.4vw,98px)] leading-[1.14] font-normal text-ink">
            <span>{t("heroTitle1")}</span>
            <span>{t("heroTitle2")}</span>
            <span className="text-accent">{t("heroTitle3")}</span>
          </h1>

          <span className="mt-6 block h-[3px] w-[62px] rounded-full bg-accent" aria-hidden />

          <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.9] text-ink opacity-80">{intro}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={localePath(locale, "/projects")}
              className="btn-primary-glow inline-flex min-h-11 items-center rounded-full bg-accent px-[26px] py-3 text-[15px] text-bg transition-colors hover:bg-accent-600"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href={localePath(locale, "/contact")}
              className="glass-soft inline-flex min-h-11 items-center rounded-full px-[26px] py-3 text-[15px] text-ink transition-colors hover:text-accent-700"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>

        <HeroAvatar alt={t("avatarAlt")} caption={t("avatarCaption")} />
      </Reveal>

      {/* ---------------- 在做的 ---------------- */}
      <section className="pb-[56px]">
        <Reveal index={1}>
          <SectionTitle title={t("buildingTitle")} note={t("buildingNote")} />
        </Reveal>

        <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))]">
          {featured.map((project, i) => {
            const warm = i % 2 === 1;
            const stack = project.featuredStack ?? project.stack ?? [];
            return (
              <Reveal key={project.slug} index={i} className="h-full">
                <Link
                  href={localePath(locale, "/projects")}
                  className="glass relative flex h-full flex-col gap-3 overflow-hidden p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-[6px] hover:shadow-lg"
                >
                  {/* 手写序号：淡到 .5 的一层，蓝橙交替 */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute top-[6px] right-[18px] font-hand text-[92px] leading-none select-none ${
                      warm ? "text-accent-2-300 opacity-55" : "text-accent-300 opacity-50"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {project.status && (
                    <span
                      className={`relative w-fit rounded-full px-[14px] py-[5px] text-[12px] ${
                        warm ? "glass-tag-2" : "glass-tag"
                      }`}
                    >
                      {localized(locale, project.status, project.status_en)}
                    </span>
                  )}

                  <h3 className="relative font-hand text-[21px] leading-[1.2] font-normal text-ink">
                    {localized(locale, project.name, project.name_en)}
                  </h3>

                  <p className="relative text-[14px] leading-[1.8] text-ink opacity-[0.78]">
                    {localized(
                      locale,
                      project.summary ?? project.desc,
                      project.summary_en ?? project.desc_en,
                    )}
                  </p>

                  {stack.length > 0 && (
                    <span className="relative mt-auto flex flex-wrap gap-1.5">
                      {stack.map((tech) => (
                        <span
                          key={tech}
                          className="glass-tag-neutral rounded-full px-[14px] py-[5px] text-[12px]"
                        >
                          {tech}
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- 最近写的 / 最近拍的 ---------------- */}
      <section className="grid gap-8 pb-[56px] [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <Reveal index={0} className="flex min-w-0 flex-col">
          <SectionTitle title={t("writingTitle")} />
          <div className="mt-4 flex flex-col">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={localePath(locale, `/blog/${post.slug}`)}
                className="grid min-h-11 grid-cols-[64px_1fr] items-baseline gap-4 rounded-[var(--radius-md)] p-3 transition-colors duration-200 hover:bg-accent-100"
              >
                <span className="text-[12px] tracking-[0.04em] text-ink opacity-50">
                  {shortDate(post.date, locale)}
                </span>
                <span className="text-[16px] leading-[1.6] text-ink">
                  {localized(locale, post.title, post.title_en)}
                </span>
              </Link>
            ))}
          </div>
        </Reveal>

        {latestVideo && (
          <Reveal index={1} className="flex min-w-0 flex-col">
            <SectionTitle title={t("photosTitle")} />
            {/* 只是一张通往视频页的封面卡，播放器仍然只在视频页里点了才加载 */}
            <Link
              href={localePath(locale, "/videos")}
              className="glass group mt-4 block overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-[6px] hover:shadow-lg"
            >
              <span className="relative block w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                {latestVideo.cover && (
                  <Image
                    src={latestVideo.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="washed object-cover"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-[58px] items-center justify-center rounded-full bg-accent pl-1 text-bg shadow-md">
                    <svg width="18" height="20" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
                      <path d="M15 9 0 18V0z" />
                    </svg>
                  </span>
                </span>
              </span>
              <span className="flex flex-col gap-1.5 px-6 pt-4 pb-6">
                <span className="font-hand text-[19px] text-ink">
                  {localized(locale, latestVideo.title, latestVideo.title_en)}
                </span>
                <span className="text-[13.5px] leading-[1.7] text-ink opacity-70">
                  {localized(
                    locale,
                    latestVideo.summary ?? latestVideo.desc,
                    latestVideo.summary_en ?? latestVideo.desc_en,
                  )}
                </span>
              </span>
            </Link>
          </Reveal>
        )}
      </section>

      {/* ---------------- 爱好 ---------------- */}
      <section className="pb-[56px]">
        <Reveal index={0}>
          <SectionTitle title={t("hobbiesTitle")} />
        </Reveal>
        <Reveal index={1}>
          <HobbyPills locale={locale} />
        </Reveal>
      </section>
    </>
  );
}
