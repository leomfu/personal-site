import { useTranslations } from "next-intl";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { siteConfig } from "~/site.config";

/** 有链接的社交账号（href 为空的不显示，比如还没给分享链接的抖音） */
export const visibleSocials = () => siteConfig.socials.filter((social) => Boolean(social.href));

/**
 * 社交账号。两种样子：
 * - icons：一排图标（首页名片下面），平台名只给读屏
 * - rows：图标 + 平台名 + 账号（完整介绍页「窗边」的铭牌）
 */
export function SocialLinks({
  locale,
  variant = "icons",
  className,
}: {
  locale: string;
  variant?: "icons" | "rows";
  className?: string;
}) {
  const t = useTranslations("common");
  const en = locale === "en";
  const socials = visibleSocials();

  return (
    <ul className={`socials socials--${variant}${className ? ` ${className}` : ""}`} aria-label={t("socials")}>
      {socials.map((social) => {
        const name = en ? social.labelEn : social.label;
        // site.config 里没有账号名的平台写的是「主页」，英文页换成对应的词
        const handle = social.handle === "主页" ? t("profilePage") : social.handle;
        return (
          <li key={social.key}>
            <a
              href={social.href}
              target="_blank"
              rel="noreferrer noopener"
              className="socials__link"
              aria-label={variant === "icons" ? t("socialAria", { name }) : undefined}
            >
              <SocialIcon name={social.key} size={variant === "icons" ? 17 : 15} />
              {variant === "rows" && (
                <>
                  <span className="socials__name">{name}</span>
                  <span className="socials__handle">{handle}</span>
                  <span className="socials__arrow" aria-hidden>
                    ↗
                  </span>
                </>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
