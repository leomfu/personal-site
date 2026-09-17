import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader, ContentFooter } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getAbout } from "@/lib/content";
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
  return pageMetadata(locale, "about", "/about");
}

/**
 * 关于页 —— 2026-09-17 改版重做（handoff §6.3）。
 *
 *   页头（统一模板）
 *   左：markdown 正文 16px/1.95，收在 62ch
 *   右：一张 48px 大圆角的玻璃卡（「现在」状态点 + 手写标题 + 说明 + 三枚标签 + 主按钮），
 *       sticky 跟着正文走
 *
 * 原来右栏卡片下面的履历和页底「我的爱好」同心轨道图
 * 2026-09-17 全站改版第一阶段下线；新关于页（正文 + 一张大卡）是第二阶段的事。
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tHome = await getTranslations("home");

  const html = await renderMarkdown(getAbout(locale).body, locale);
  const tagline = locale === "en" ? siteConfig.taglineEn : siteConfig.tagline;

  return (
    <div className="mx-auto w-full max-w-page-narrow">
      <PageHeader tag="ABOUT" title={t("title")} lead={tagline} />

      <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <Reveal index={0}>
          <div
            className="prose-bw max-w-[62ch] text-[16px] leading-[1.95]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Reveal>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-6 lg:self-start">
          <Reveal index={1}>
            {/* 两个纯色装饰圆藏在卡的右上/右下，被 overflow-hidden 裁掉一半 */}
            <div className="glass relative overflow-hidden rounded-[48px] p-8 sm:p-10">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-14 -right-12 size-40 rounded-full bg-accent-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -bottom-16 size-44 rounded-full bg-accent-2-100"
              />

              <div className="relative flex flex-col items-start">
                <span className="flex items-center gap-3 text-[12px] tracking-(--tracking-label) text-muted">
                  {/* 脉冲光环：wlPulse 在 globals.css 里，reduced-motion 下由全局那条掐停 */}
                  <span
                    aria-hidden
                    className="size-2 rounded-full bg-accent motion-safe:animate-[wlPulse_2.4s_ease-in-out_infinite]"
                  />
                  {t("nowLabel")}
                </span>

                <h2 className="mt-5 font-hand text-[40px] leading-[1.15] font-normal text-ink">
                  {t("cardTitle")}
                </h2>

                <p className="mt-4 text-[16.5px] leading-[1.95] text-body">{t("cardBody")}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[t("cardTag1"), t("cardTag2"), t("cardTag3")].map((tag) => (
                    <span
                      key={tag}
                      className="glass-tag rounded-full px-[14px] py-[5px] text-[12px] text-accent-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={localePath(locale, "/contact")}
                  className="btn-primary-glow mt-8 rounded-full bg-accent px-[26px] py-3 text-[14px] font-medium text-neutral-100 transition-colors hover:bg-accent-600"
                >
                  {t("cardCta")}
                </Link>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>

      <Reveal index={1}>
        <ContentFooter
          note={tHome.rich("footerNote", {
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
