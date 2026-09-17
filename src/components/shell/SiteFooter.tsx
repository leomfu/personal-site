import { getTranslations } from "next-intl/server";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { siteConfig, type SocialKey } from "~/site.config";

/**
 * 全站页脚（改版规格 §6.10）—— neutral-900 底、顶部 56px 大圆角，整块像一张从页面
 * 底下托上来的卡。两列：
 *
 *   左   手写大字两行 + 主按钮「写封邮件 →」
 *   右   ELSEWHERE 眉题 + 三个 46px 圆形社交图标（GitHub / X / 哔哩哔哩）+ 版权行
 *
 * 社交只放设计稿里那三个，链接取 site.config.ts 的 socials（不写死地址）。
 */

/** 页脚那一排的顺序（和联系页右栏一致） */
const FOOTER_SOCIALS: SocialKey[] = ["github", "x", "bilibili"];

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });

  const socials = FOOTER_SOCIALS.map((key) => siteConfig.socials.find((s) => s.key === key)).filter(
    (s): s is (typeof siteConfig.socials)[number] => Boolean(s?.href),
  );

  return (
    <footer className="relative z-1 mt-[35.2px] rounded-t-[56px] bg-neutral-900 text-neutral-200">
      <div className="mx-auto grid w-full max-w-page items-center gap-8 px-6 py-[49px] [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {/* 左：手写大字两行 + 主按钮 */}
        <div className="flex flex-col items-start">
          <p className="font-hand text-[clamp(26px,3.4vw,38px)] leading-[1.25] font-normal text-bg">
            {t("line1")}
            <br />
            {t("line2")}
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="btn-primary-glow mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-[26px] py-3 text-[15px] text-bg transition-colors hover:bg-accent-600"
          >
            {t("cta")}
          </a>
        </div>

        {/* 右：ELSEWHERE + 圆形社交 + 版权 */}
        <div className="flex flex-col items-start gap-4 sm:justify-self-end">
          <span className="text-[11.5px] tracking-[0.14em] opacity-55">{t("eyebrow")}</span>
          <div className="flex flex-wrap gap-3">
            {socials.map((social) => {
              const label = locale === "en" ? social.labelEn : social.label;
              return (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={label}
                  aria-label={label}
                  className="flex size-[46px] items-center justify-center rounded-full bg-white/10 text-neutral-200 transition-colors duration-[250ms] hover:bg-accent hover:text-neutral-900"
                >
                  <SocialIcon name={social.key} size={19} />
                </a>
              );
            })}
          </div>
          <span className="mt-4 text-[12px] opacity-45">{t("copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
