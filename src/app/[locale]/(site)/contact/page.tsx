import { getTranslations, setRequestLocale } from "next-intl/server";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { siteConfig, type SocialKey } from "~/site.config";

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

/** 右栏三行的顺序（文案定稿：GitHub / X / 哔哩哔哩）。链接取 site.config.ts 的 socials */
const ROWS: SocialKey[] = ["github", "x", "bilibili"];

/**
 * 联系页 —— 改版定稿（docs/design/改版规格.md §6.9）。两列 minmax(290px, 1fr)：
 *
 *   左  主色实底大卡（圆角 32px）：EMAIL 眉题 + 手写大字邮箱 + 底色胶囊按钮「写封邮件 →」
 *   右  三个 999px 的玻璃社交行：44px 圆形图标（前两个 neutral-900 底，B 站用品牌色）
 *       + 两行文字 + 右侧主色 ↗，hover 往右挪 8px
 *
 * 邮箱地址取 site.config.ts 的 email（站主本人的真实地址），不写死在这里。
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const rows = ROWS.map((key) => siteConfig.socials.find((s) => s.key === key)).filter(
    (s): s is (typeof siteConfig.socials)[number] => Boolean(s?.href),
  );

  return (
    <>
      <PageHeader tag={t("tag")} title={t("title")} lead={t("lead")} />

      <div className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(290px,100%),1fr))]">
        {/* 左：主色实底大卡 */}
        <Reveal index={0}>
          <div className="rounded-[calc(var(--radius-lg)*1.15)] bg-accent p-8 text-bg shadow-md">
            <span className="block text-[12px] tracking-[0.14em] opacity-80">{t("emailLabel")}</span>
            <p className="mt-2 font-hand text-[clamp(22px,3vw,30px)] break-all">{siteConfig.email}</p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-bg px-6 py-[11px] font-hand text-[14px] text-accent-800 transition-colors hover:bg-surface"
            >
              {t("write")}
            </a>
          </div>
        </Reveal>

        {/* 右：社交行 */}
        <Reveal index={1}>
          <div className="flex flex-col gap-3">
            {rows.map((social) => {
              const label = locale === "en" ? social.labelEn : social.label;
              const badge =
                social.key === "bilibili" ? "bg-brand-bilibili text-white" : "bg-neutral-900 text-bg";
              return (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="glass flex items-center gap-4 rounded-full px-6 py-4 transition-transform duration-[250ms] hover:translate-x-2"
                >
                  <span className={`flex size-[44px] shrink-0 items-center justify-center rounded-full ${badge}`}>
                    <SocialIcon name={social.key} size={19} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[15.5px] font-semibold text-ink">{label}</span>
                    <span className="text-[12.5px] text-ink opacity-60">
                      {t(`socials.${social.key as "github" | "x" | "bilibili"}`)}
                    </span>
                  </span>
                  <span className="ml-auto shrink-0 text-[15px] text-accent" aria-hidden>
                    ↗
                  </span>
                </a>
              );
            })}
          </div>
        </Reveal>
      </div>
    </>
  );
}
