"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 首页的几层怎么动（BRIEF §10「首页 · 轨道」）：
 *
 *   远景  地球：极慢地呼吸（44 秒一个来回的轻微缩放），指针视差最小
 *   主体  名片：不动
 *   前景  坐标刻度、发丝线：指针视差最大
 *   氛围  大气层边缘的冷光：CSS 里自己慢慢变（不在这里）
 *
 * 这里只往根节点上写三个变量（--mx / --my / --drift），具体每层动多少写在 CSS 里。
 * 指针视差只在 (hover: hover) and (pointer: fine) 下开；减少动态效果时整个循环不跑，画面静止。
 *
 * 另一件事：名片和上海光点之间那根引线。光点长在地球那层上（跟着地球动），
 * 名片在主体层（不动），所以引线的两头每一帧都要重新量。
 */
export function HomeStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const dot = root.querySelector<HTMLElement>("[data-home-dot]");
    const anchor = root.querySelector<HTMLElement>("[data-home-anchor]");
    const facts = root.querySelector<HTMLElement>(".idcard__facts");
    const line = root.querySelector<SVGPolylineElement>("[data-home-leader] polyline");
    const knot = root.querySelector<SVGCircleElement>("[data-home-leader] circle");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let last = "";
    const drawLeader = () => {
      if (!dot || !anchor || !line || !knot) return;
      const d = dot.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const dx = d.left + d.width / 2;
      const dy = d.top + d.height / 2;
      let ax: number;
      let ay: number;
      let ex: number;
      let ey: number;
      if (dx > a.right + 32) {
        // 光点在名片右边（桌面，R6 名片在左边）：从名片右缘出发，先水平走一段再斜着连过去
        ax = a.right;
        // 桌面从事实票根的右端出发（它是名片右缘最醒目的一点），找不到就退回名片上部
        const f = facts?.getBoundingClientRect();
        ay = f && f.height > 0 ? f.top + f.height / 2 : a.top + Math.min(a.height * 0.5, 64);
        ex = ax + (dx - ax) * 0.38;
        ey = ay;
      } else if (dx < a.left - 32) {
        // 光点在名片左边（目前没有这种布局，留着兜底）：从名片的左缘出发，先往左平走一段
        ax = a.left;
        ay = a.top + Math.min(a.height * 0.42, 150);
        ex = ax - (ax - dx) * 0.38;
        ey = ay;
      } else {
        // 光点在名片上下方（手机）：从名片的上缘或下缘出发，先竖着走一段
        ax = Math.min(Math.max(dx, a.left + 28), a.right - 28);
        ay = dy > a.bottom ? a.bottom : a.top;
        ex = ax;
        ey = ay + (dy - ay) * 0.42;
      }
      // 线头停在光点外圈，不压住光点本身
      const vx = dx - ex;
      const vy = dy - ey;
      const len = Math.hypot(vx, vy) || 1;
      const gap = 15;
      const points = `${ax.toFixed(1)},${ay.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} ${(dx - (vx / len) * gap).toFixed(1)},${(dy - (vy / len) * gap).toFixed(1)}`;
      if (points === last) return;
      last = points;
      line.setAttribute("points", points);
      knot.setAttribute("cx", ax.toFixed(1));
      knot.setAttribute("cy", ay.toFixed(1));
    };

    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;
    const t0 = performance.now();

    const frame = (now: number) => {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const drift = 1.025 + Math.sin((now - t0) / 7000) * 0.012;
      root.style.setProperty("--mx", mx.toFixed(4));
      root.style.setProperty("--my", my.toFixed(4));
      root.style.setProperty("--drift", drift.toFixed(4));
      drawLeader();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      tx = (event.clientX / window.innerWidth) * 2 - 1;
      ty = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    if (fine && !reduce) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", drawLeader, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    drawLeader();
    void document.fonts?.ready.then(drawLeader);
    start();
    root.classList.add("is-live");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", drawLeader);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={ref} className="home">
      {children}
    </div>
  );
}
