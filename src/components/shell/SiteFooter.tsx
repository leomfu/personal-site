import { getTranslations } from "next-intl/server";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { siteConfig } from "~/site.config";

/**
 * 全站页脚（改版 handoff §6.10）—— 深色底、顶部 56px 大圆角，整块像一张从页面
 * 底下托上来的卡。左边手写大字两行 + 主按钮，右边 ELSEWHERE 眉题 + 一排圆形社交图标。
 *
 * 底色用 --color-neutral-900 而不是 --color-shell：shell 那一组是「暗侧」
 * （顶栏时代的侧栏、开场页、放松区），页脚不属于那一侧，它是亮侧页面收口的一块深色。
 *
 * 社交按 siteConfig.socials 全量渲染（设计稿只画了三个，但站上有六个，
 * 功能一个都不能少）；没填 href 的那几个渲染成不可点的暗底圆。
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tContact = await getTranslations({ locale, namespace: "contact" });
  const tHome = await getTranslations({ locale, namespace: "home" });

  const name = locale === "en" ? siteConfig.nameEn : siteConfig.name;

  return (
    <footer className="relative z-1 mt-14 rounded-t-[56px] bg-neutral-900 text-neutral-200">
      <div className="mx-auto flex w-full max-w-page flex-col gap-10 px-6 py-14 sm:py-[72px] lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        {/* 左：手写大字两行 + 主按钮 */}
        <div className="flex flex-col items-start gap-6">
          <p className="font-hand text-[clamp(34px,4.4vw,52px)] leading-[1.15] font-normal text-neutral-100">
            {t("line1")}
            <br />
            {t("line2")}
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="btn-primary-glow rounded-full bg-accent px-[26px] py-3 text-[14px] font-medium text-neutral-100 transition-colors hover:bg-accent-600"
          >
            {t("cta")}
          </a>
        </div>

        {/* 右：ELSEWHERE + 圆形社交 + 版权 */}
        <div className="flex flex-col gap-5 lg:items-end">
          <span className="text-[11.5px] tracking-(--tracking-label) text-neutral-500 uppercase">
            {tContact("elsewhere")}
          </span>
          <div className="flex flex-wrap gap-3">
            {siteConfig.socials.map((social) => {
              const label = locale === "en" ? social.labelEn : social.label;
              if (!social.href) {
                return (
                  <span
                    key={social.key}
                    title={label}
                    aria-label={label}
                    className="flex size-[46px] items-center justify-center rounded-full bg-white/5 text-neutral-700"
                  >
                    <SocialIcon name={social.key} size={18} />
                  </span>
                );
              }
              return (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={label}
                  aria-label={label}
                  className="flex size-[46px] items-center justify-center rounded-full bg-white/10 text-neutral-200 transition-colors hover:bg-accent hover:text-neutral-900"
                >
                  <SocialIcon name={social.key} size={18} />
                </a>
              );
            })}
          </div>
          <span className="text-xs text-neutral-200/45">
            {tHome("copyright", { year: siteConfig.since, name })}
          </span>
        </div>
      </div>
    </footer>
  );
}
