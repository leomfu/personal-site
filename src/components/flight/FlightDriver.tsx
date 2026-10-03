"use client";

import { useEffect, useRef } from "react";

/**
 * 第 0 幕「沿江飞行」页面侧的几件小事（画面本身全在 flight.css 里从 --sc-p 算）：
 *
 *   在不在视口   IntersectionObserver 切 section 上的 .is-live：近景的闪烁、流光、薄雾只在看得见时跑（离屏暂停）
 *   滚动速度     每个 scroll 事件算一次速度，写成 --fv（0..1）；CSS 里 --fv 注册成数字并带 transition，
 *               停下来 160ms 后写 0、换成慢的 transition（.is-coast），流光和速度线慢慢收住。不开常驻 rAF
 *   鼠标视差     桌面上写 --mx / --my（-1..1），小螃蟹用 transition 跟过去
 *   飞完了       钉住结束（p = 1）后打上 data-through：透明的舞台不再挡住下面第 1 幕的点击；
 *               小螃蟹飞进窗户以后（p > 0.88）它的按钮 inert，键盘不会停在一个看不见的东西上
 * 减少动态效果：只做最后一件。
 */
export function FlightDriver() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const section = ref.current?.closest<HTMLElement>("[data-sc-act]");
    if (!section) return;
    const crabSlot = section.querySelector<HTMLElement>(".flight__crabslot");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let live = false;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let coastTimer = 0;
    let through: boolean | null = null;
    let gone: boolean | null = null;

    /** 钉住结束了没有、小螃蟹飞进窗户了没有（都按滚动位置算，不读 CSS） */
    const checkEnds = () => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = Math.max(r.height - vh, 1);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      const nowThrough = r.bottom <= vh + 1;
      if (nowThrough !== through) {
        through = nowThrough;
        section.toggleAttribute("data-through", nowThrough);
      }
      const nowGone = p > (reduce ? 0.68 : 0.88);
      if (crabSlot && nowGone !== gone) {
        gone = nowGone;
        crabSlot.inert = nowGone;
      }
    };

    const onScroll = () => {
      checkEnds();
      if (reduce || !live) return;
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(16, now - lastT);
      const v = Math.abs(y - lastY) / dt; // px / ms
      lastY = y;
      lastT = now;
      section.classList.remove("is-coast");
      section.style.setProperty("--fv", Math.min(1, v / 2.4).toFixed(3));
      window.clearTimeout(coastTimer);
      coastTimer = window.setTimeout(() => {
        section.classList.add("is-coast");
        section.style.setProperty("--fv", "0");
      }, 160);
    };

    const onPointer = (event: PointerEvent) => {
      if (!live || event.pointerType !== "mouse") return;
      section.style.setProperty("--mx", ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      section.style.setProperty("--my", ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };

    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      live = e.isIntersecting;
      section.classList.toggle("is-live", live && !reduce);
      if (live) {
        lastY = window.scrollY;
        lastT = performance.now();
      }
    });
    io.observe(section);

    checkEnds();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", checkEnds, { passive: true });
    if (fine && !reduce) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      io.disconnect();
      window.clearTimeout(coastTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkEnds);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <span ref={ref} hidden />;
}
