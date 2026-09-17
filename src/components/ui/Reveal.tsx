"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 翻阅动效「错位滑入」（handoff §5.3）—— 改版的第三层体感。
 *
 * 块滚进视口时左右交替滑入：偶数序号从左边、奇数序号从右边，
 * 同时带一点下移和 .965 的缩放。位移强度由 globals.css 里的 `--wl-k`（1.6）统一控制，
 * 具体的初态/终态/缓动全写在那边的 `[data-wl-rv]` 规则里 —— 这个组件只负责
 * **什么时候把 `data-wl-in` 挂上去**。
 *
 * 错峰延迟 `(index % 4) * 110ms`：同一屏里相邻的几块不会齐刷刷一起动，
 * 每四个一轮回到 0，所以长列表不会越往下延迟越久。
 *
 * ⚠️ 两个容易踩的点：
 *
 * ① **卡片网格要一张张进，不是整块进**。所以网格的每一张卡各自包一个
 *    `<Reveal index={i}>`，而不是把整个 grid 包成一个 Reveal。
 * ② **1600ms 的兜底定时器不能删**。IntersectionObserver 的回调依赖布局，
 *    图片还没加载完时首屏那几块可能一直不触发，页面就是空的。到点了不管
 *    观察器有没有响过，全部置为可见。
 *
 * 「减少动态效果」下直接就位：这里不挂观察器，globals.css 那条
 * `prefers-reduced-motion` 也会把初态强制成可见。
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  /** 在所在这一组里的序号，从 0 开始。决定从左还是从右进、以及错峰延迟 */
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const show = () => el.setAttribute("data-wl-in", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show();
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -16% 0px", threshold: 0.04 },
    );
    observer.observe(el);

    /* 兜底：图片没加载完导致观察器一直不响时，1600ms 后无条件放行 */
    const timer = window.setTimeout(show, 1600);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-wl-rv=""
      data-wl-alt={index % 2 === 1 ? "" : undefined}
      style={{ transitionDelay: `${(index % 4) * 110}ms` }}
    >
      {children}
    </div>
  );
}
