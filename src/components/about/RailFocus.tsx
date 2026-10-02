"use client";

import { useEffect } from "react";

/**
 * 键盘焦点进到「屏幕」那一幕的横向展品里时，把那件展品带到屏幕中间。
 *
 * 横向轨道的位置是由竖向滚动决定的（引擎的 pan：translateX = −(溢出宽度) × p），
 * 浏览器自己的「滚到焦点那里」只会竖着滚，焦点停在一件横着还在屏幕外的展品上。
 * 这里反过来算：要让这件展品居中，p 应该是多少，再换算成竖向滚动位置跳过去。
 * 减少动态效果时轨道变成原生的横向滚动区，浏览器自己会处理，这里不管。
 */
export function RailFocus() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      const rail = target?.closest?.<HTMLElement>("[data-sc-pan]");
      if (!target || !rail) return;
      const act = rail.closest<HTMLElement>("[data-sc-act]");
      const item = (Array.from(rail.children) as HTMLElement[]).find((child) => child.contains(target));
      if (!act || !item) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const over = rail.scrollWidth - vw;
      if (over <= 0) return;
      const total = over * (1 + (parseFloat(rail.getAttribute("data-sc-pan") ?? "0") || 0));
      const p = Math.min(1, Math.max(0, (item.offsetLeft + item.offsetWidth / 2 - vw / 2) / total));
      const top = act.getBoundingClientRect().top + window.scrollY;
      const y = top + p * Math.max(act.offsetHeight - vh, 1);
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" }));
    };

    window.addEventListener("focusin", onFocus);
    return () => window.removeEventListener("focusin", onFocus);
  }, []);

  return null;
}
