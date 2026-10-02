"use client";

import { useEffect } from "react";

/**
 * 彩铅批注、涂鸦、记号「什么时候画」的换算（BRIEF R4：stroke-dashoffset 由所在幕的 --sc-p 驱动）。
 *
 * 画的进度永远来自所在幕的 --sc-p（引擎写的，CSS 里换成 --draw），这里只负责算每一件的 --from / --to：
 * 让它在自己进到视口下方 15% 处开始画、升到视口一半时画完。不同屏幕上同一件东西在幕里的位置不一样，
 * 所以不能写死，得按实际布局算一次（尺寸变了、引擎重新量过之后再算）。
 *
 *   flow 幕：p = (scrollY + vh − 幕顶) / (幕高 + vh)，按元素的竖向位置反推
 *   pan 幕：横向轨道 translateX = −溢出 × p，按元素在轨道里的横向位置反推
 * 只处理带 data-auto 的；写死了 from / to 的（钉住的幕里）不动。
 */
export function DrawDriver() {
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const y = window.scrollY;
      document.querySelectorAll<HTMLElement | SVGElement>("[data-auto]").forEach((el) => {
        const act = el.closest<HTMLElement>("[data-sc-act]");
        if (!act) return;
        const kind = act.getAttribute("data-sc-act");
        const r = el.getBoundingClientRect();
        let from: number;
        let to: number;
        if (kind === "pan") {
          const rail = act.querySelector<HTMLElement>("[data-sc-pan]");
          if (!rail) return;
          const over = rail.scrollWidth - vw;
          if (over <= 0) return;
          const travel = over * (1 + (parseFloat(rail.getAttribute("data-sc-pan") ?? "0") || 0));
          const x = r.left - rail.getBoundingClientRect().left;
          from = (x - vw * 0.86) / travel;
          to = (x + r.width - vw * 0.62) / travel;
        } else if (kind === "flow") {
          const a = act.getBoundingClientRect();
          const top = a.top + y;
          const elTop = r.top + y;
          const span = a.height + vh;
          from = (elTop - top + vh * 0.12) / span;
          to = (elTop - top + vh * 0.48) / span;
        } else {
          return;
        }
        from = Math.max(-0.2, Math.min(0.95, from));
        to = Math.max(from + 0.04, Math.min(1, to));
        el.style.setProperty("--from", from.toFixed(4));
        el.style.setProperty("--to", to.toFixed(4));
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("wl:engine", schedule);
    void document.fonts?.ready.then(schedule);
    const late = window.setTimeout(schedule, 1200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(late);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wl:engine", schedule);
    };
  }, []);
  return null;
}
