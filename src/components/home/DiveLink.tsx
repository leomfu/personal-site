"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useDive } from "@/components/dive/DiveProvider";

/**
 * 首页的两个入口（上海的光点、主按钮）都是它：本质是一个去 /about/ 的普通链接
 * （中键、新标签页、没有脚本都照常能用），普通的左键点击才交给俯冲过渡。
 * 俯冲的放大中心对准首页上那颗光点（data-home-dot）。
 */
export function DiveLink({
  href,
  className,
  children,
  ariaLabel,
  dot = false,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  /** 这一个就是那颗光点 */
  dot?: boolean;
}) {
  const ctx = useDive();

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ctx || event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const marker = document.querySelector("[data-home-dot]");
    const rect = marker?.getBoundingClientRect();
    ctx.dive(href, rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined);
  };

  return (
    <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel} data-home-dot={dot ? "" : undefined}>
      {children}
    </Link>
  );
}
