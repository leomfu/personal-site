"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Heading } from "@/lib/markdown";

/**
 * 长文的侧边目录（宽屏才出现，窄屏没有位置）。当前小节靠 IntersectionObserver 高亮。
 */
export function ArticleToc({ headings }: { headings: Heading[] }) {
  const t = useTranslations("blog");
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav className="toc" aria-label={t("toc")}>
      <p className="toc__label mono">{t("toc")}</p>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} className={heading.depth === 3 ? "toc__sub" : undefined}>
            <a href={`#${heading.id}`} className={active === heading.id ? "is-active" : undefined} aria-current={active === heading.id ? "true" : undefined}>
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
