"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * 换页动效（handoff §5.3 倒数第二条）—— 整块 main 从右边 44px 滑进来，
 * `wlPgSlide .55s cubic-bezier(.2,.8,.3,1)`，关键帧和 `.page-enter` 都在 globals.css 里。
 *
 * 用 `key={pathname}` 让 React 每次换路由都重建这个节点，动画因此重播一次。
 * 不再走 Framer Motion：这只是一条一次性的入场，CSS 关键帧就够了，
 * 而且和 Reveal 的错位滑入用的是同一套缓动语言，写在一起更好对。
 *
 * 「减少动态效果」下 globals.css 里有 `.page-enter { animation: none }` 把它关掉。
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
