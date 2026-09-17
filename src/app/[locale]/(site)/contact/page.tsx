import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { ContentFooter, PageHeader } from "@/components/ui/PageHeader";
import { EmailActions } from "@/components/ui/EmailActions";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/metadata";
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
  return pageMetadata(locale, "contact", "/contact");
}

/**
 * 联系页 —— 2026-09-17 改版重做（handoff §6.9）。左右两栏：
 *
 *   左  一张**主色实底**的大卡（32px 圆角）：EMAIL 眉题 + 手写大字邮箱 +
 *       白底胶囊按钮。整页真正要人做的那件事，所以它是页面上唯一一块实色主色。
 *   右  一列 999px 的社交行：44px 圆形图标 + 两行文字 + 右侧主色 ↗，
 *       hover 整行往右挪 8px。
 *
 * 图标底色只有哔哩哔哩用品牌色（--color-brand-bilibili），其余是 neutral-900 ——
 * 一排彩色圆点会把这一栏变成贴纸墙，留一个就够认。
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const socials = siteConfig.socials;

  return (
    <div className="mx-auto w-full max-w-page-narrow">
      <PageHeader tag="CONTACT" title={t("title")} lead={t("lead")} />

      <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
        {/* 左：主色实底大卡 */}
        <Reveal index={0}>
          <div className="btn-primary-glow flex h-full flex-col rounded-[32px] bg-accent p-8 sm:p-10">
            <span className="text-[12px] tracking-(--tracking-label) text-neutral-100/70">
              {t("emailLabel")}
            </span>
            <p className="mt-5 font-hand text-[clamp(28px,3.4vw,44px)] leading-[1.2] break-all text-neutral-100">
              {siteConfig.email}
            </p>
            <EmailActions email={siteConfig.email} />
          </div>
        </Reveal>

        {/* 右：社交行 */}
        <Reveal index={1}>
          <span className="text-[12px] tracking-(--tracking-label) text-muted">
            {t("elsewhere")}
          </span>
          <div className="mt-4 flex flex-col gap-2.5">
            {socials.map((social) => {
              const label = locale === "en" ? social.labelEn : social.label;
              const badge =
                social.key === "bilibili"
                  ? "bg-brand-bilibili text-neutral-100"
                  : "bg-neutral-900 text-neutral-100";

              const inner = (
                <>
                  <span
                    className={`flex size-[44px] shrink-0 items-center justify-center rounded-full ${badge}`}
                  >
                    <SocialIcon name={social.key} size={18} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[15px] text-ink">{label}</span>
                    <span className="truncate text-[12px] text-faint">{social.handle}</span>
                  </span>
                  {social.href && (
                    <span className="ml-auto shrink-0 text-[16px] text-accent" aria-hidden>
                      ↗
                    </span>
                  )}
                </>
              );

              return social.href ? (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="glass flex items-center gap-4 rounded-full py-2.5 pr-6 pl-2.5 transition-transform duration-300 hover:translate-x-2"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={social.key}
                  className="glass flex items-center gap-4 rounded-full py-2.5 pr-6 pl-2.5 opacity-45"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>

      <Reveal index={2}>
        <ContentFooter
          note={t.rich("footerNote", {
            link: (chunks) => (
              <Link href={localePath(locale, "/blog")} className="link-underline">
                {chunks}
              </Link>
            ),
          })}
        />
      </Reveal>
    </div>
  );
}
