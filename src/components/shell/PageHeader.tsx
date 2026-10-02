"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LangSwitch } from "@/components/common/LangSwitch";
import { SUBPAGES, localePath } from "@/lib/nav";
import { siteConfig } from "~/site.config";

/**
 * 子页的顶栏：左边回首页（名字）和回完整介绍，中间是六个子页，右边语言切换。
 * 子页以「好读」为先，所以顶栏就是一行字，不跟着滚动做任何事。
 */
export function PageHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname() ?? "";

  return (
    <header className="pagebar">
      <a className="skip" href="#main">
        {tc("skipToContent")}
      </a>
      <div className="pagebar__inner">
        <div className="pagebar__home">
          <Link href={localePath(locale, "")} className="pagebar__name">
            {locale === "en" ? siteConfig.nameEn : siteConfig.name}
          </Link>
          <Link href={localePath(locale, "/about")} className="pagebar__tour">
            {tc("tour")}
          </Link>
        </div>
        <nav className="pagebar__nav" aria-label={t("label")}>
          <ul>
            {SUBPAGES.map((page) => {
              const href = localePath(locale, page.path);
              const active = pathname.startsWith(href);
              return (
                <li key={page.key}>
                  <Link href={href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
                    {t(page.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <LangSwitch className="pagebar__lang" />
      </div>
    </header>
  );
}
