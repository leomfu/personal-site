import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getAbout } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { renderMarkdown } from "@/lib/markdown";
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
  return pageMetadata(locale, "about", "/about");
}

/**
 * 关于页 —— 改版定稿（docs/design/改版规格.md §6.3）。
 *
 *   页头（统一模板）
 *   两列 minmax(300px, 1fr)：
 *     左  markdown 正文（content/about/about.zh.md）16px/1.95，收在 62ch，h3 24px
 *     右  一张 48px 大圆角的玻璃卡：右上/右下两个纯色装饰圆（溢出裁掉）、
 *         带脉冲光环的「现在」状态点、手写 40px 标题、说明、三枚标签、主按钮「私信我 →」
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const html = await renderMarkdown(getAbout(locale).body, locale);

  const tags = [
    { label: t("cardTag1"), cls: "glass-tag" },
    { label: t("cardTag2"), cls: "glass-tag-2" },
    { label: t("cardTag3"), cls: "glass-tag-neutral" },
  ];

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead")} />

      <div className="grid items-start gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <Reveal index={0}>
          <div
            className="prose-bw prose-about"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Reveal>

        <Reveal index={1}>
          <div className="glass relative flex flex-col items-start gap-4 overflow-hidden rounded-[calc(var(--radius-lg)*1.7)] px-6 py-8 sm:px-8 sm:py-[37px]">
            {/* 两个纯色装饰圆，被 overflow-hidden 裁掉一半 */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-[96px] -right-[96px] size-[250px] rounded-full bg-accent-100"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-[34px] -bottom-[72px] size-[156px] rounded-full bg-accent-2-100"
            />

            <span className="relative flex items-center gap-2.5 text-[12px] tracking-[0.18em] text-accent-700">
              {/* 脉冲光环：wlPulse 在 globals.css 里，reduced-motion 下停掉 */}
              <span
                aria-hidden
                className="size-[9px] rounded-full bg-accent shadow-[0_0_0_5px_var(--color-accent-200)] motion-safe:animate-[wlPulse_2.4s_ease-in-out_infinite]"
              />
              {t("nowLabel")}
            </span>

            <h2 className="relative font-hand text-[clamp(30px,3.6vw,40px)] leading-[1.14] font-normal text-ink">
              {t("cardTitle")}
            </h2>

            <p className="relative max-w-[34ch] text-[16.5px] leading-[1.95] text-ink opacity-[0.82]">
              {t("cardBody")}
            </p>

            <div className="relative mt-1 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.label} className={`${tag.cls} rounded-full px-[14px] py-[5px] text-[12px]`}>
                  {tag.label}
                </span>
              ))}
            </div>

            <Link
              href={localePath(locale, "/contact")}
              className="btn-primary-glow relative mt-2 inline-flex min-h-11 items-center rounded-full bg-accent px-[26px] py-3 text-[15px] text-bg transition-colors hover:bg-accent-600"
            >
              {t("cardCta")}
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
