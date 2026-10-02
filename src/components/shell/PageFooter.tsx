"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SUBPAGES, localePath } from "@/lib/nav";
import { siteConfig } from "~/site.config";

/**
 * 子页的页脚：回首页、回完整介绍（直接回到这一页对应的那个地方，例如项目页回「屏幕」），
 * 再加一行邮箱和版权。
 */
export function PageFooter() {
  const tc = useTranslations("common");
  const tp = useTranslations("places");
  const locale = useLocale();
  const pathname = usePathname() ?? "";
  const page = SUBPAGES.find((item) => pathname.startsWith(localePath(locale, item.path)));
  const place = page?.place;

  return (
    <footer className="pagefoot">
      <div className="pagefoot__inner">
        <nav className="pagefoot__back" aria-label={tc("backNav")}>
          <Link href={localePath(locale, "")}>{tc("backHome")}</Link>
          <Link href={localePath(locale, place ? `/about#${place}` : "/about")}>
            {place ? tc("backTourAt", { place: tp(`${place}.name`) }) : tc("backTour")}
          </Link>
        </nav>
        <p className="pagefoot__meta">
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <span>
            © {siteConfig.since} {locale === "en" ? siteConfig.nameEn : siteConfig.name} · weiliang.dev
          </span>
        </p>
      </div>
    </footer>
  );
}
