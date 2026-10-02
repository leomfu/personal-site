"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { swapLocale } from "@/lib/nav";

/** 中 / EN 切换：停在同一页，只换语言 */
export function LangSwitch({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname() ?? `/${locale}/`;

  return (
    <nav className={className ? `lang ${className}` : "lang"} aria-label={t("langLabel")}>
      {(["zh", "en"] as const).map((target) => {
        const active = target === locale;
        return active ? (
          <span key={target} className="lang__item is-active" aria-current="true" lang={target}>
            {t(target)}
          </span>
        ) : (
          <Link
            key={target}
            href={swapLocale(pathname, target)}
            className="lang__item"
            hrefLang={target}
            lang={target}
            aria-label={t(target === "zh" ? "toZh" : "toEn")}
          >
            {t(target)}
          </Link>
        );
      })}
    </nav>
  );
}
