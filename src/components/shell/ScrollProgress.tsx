"use client";

import { useEffect, useRef } from "react";

/**
 * 顶部那条 3px 的滚动进度条（改版 handoff §5.3 最后一条）。
 *
 * 宽度 = scrollY / (scrollHeight - innerHeight)，直接写 DOM style，**不进 React state** ——
 * 滚动是每帧都在发生的事，进 state 等于每帧重渲染一次整棵树。
 * scroll / resize 都挂 passive，并用 requestAnimationFrame 节流到每帧最多算一次。
 *
 * 「减少动态效果」下整条不渲染：它本身就是一条纯装饰的动效反馈。
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      el.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
