"use client";

import { useEffect } from "react";

/**
 * 告诉固定在屏幕上的那几件（迷你播放器、房间平面图、完整介绍页的顶栏）现在脚下是夜景还是纸面：
 * 写在 <html data-ground="night | paper"> 上，CSS 用它把这几件换成纸面的配色和彩铅样式。
 *
 *   value="paper"  整页都是纸（子页）
 *   不传 value      完整介绍页：盯着 [data-paper] 那张纸，它的上沿升过屏幕一半就算到了纸面
 * 离开页面时把属性删掉（首页、俯冲都是夜景，默认就是夜景）。
 */
export function Ground({ value }: { value?: "paper" | "night" }) {
  useEffect(() => {
    const root = document.documentElement;
    if (value) {
      root.dataset.ground = value;
      return () => {
        delete root.dataset.ground;
      };
    }
    const sheet = document.querySelector<HTMLElement>("[data-paper]");
    if (!sheet) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const top = sheet.getBoundingClientRect().top;
      const next = top < window.innerHeight * 0.5 ? "paper" : "night";
      if (root.dataset.ground !== next) root.dataset.ground = next;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.ground;
    };
  }, [value]);
  return null;
}
