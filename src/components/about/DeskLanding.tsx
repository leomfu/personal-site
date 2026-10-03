"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { CrabArt, HelmetArt } from "@/components/crab/Crab";

/**
 * 第 1 幕开场：「到了」（BRIEF R9 第 1 条第 4 点）。
 *
 * 第 0 幕里小宇航员先一步飞进了那扇窗；第 1 幕钉住的那一刻（书桌那一幕的顶到了屏幕顶），这里演一小段（约 3 秒）：
 *   从房间的窗户飞进来（由小变大）→ 落在 MacBook 右边的桌面上、站直 → 举起两只钳子摘下头盔，
 *   头盔放到旁边、滚一下停在桌上 → 跳上 Claude 窗口的顶边，半空里斗篷收掉 → 变成桌宠
 * 变身那一刻：书桌那一幕打上 data-landed（CSS 显出窗口顶边上的桌宠），这只表演用的藏起来，
 * 两者位置、大小一样，所以任何时候屏幕上只有一只。然后发 wl:landed，屏幕里才开始打「Hello Claude」。
 *
 * 这只是 .plate__box 的孩子：坐标用房间图本身的比例，跟着第 1 幕的视差、推镜一起动。
 * 动画用 Web Animations（只动 transform / opacity，播完就停），不开常驻循环；滚动只在 scroll 事件里看一眼位置。
 * 退回第 0 幕（书桌那一幕的顶又落到屏幕三成以下）就复位，下次到达再演；打字只演一遍。
 * 减少动态效果：不演，桌宠一开始就在屏幕上。
 * 页面直接从更下面打开（书桌那一幕整个在上面了）：也不演，直接是落好的样子。
 */

/** 房间图上的几个点（归一化坐标）：窗户里飞进来的地方、落脚点（脚底）、头盔最后停的地方（底边） */
const SPOTS = {
  wide: { window: { x: 0.52, y: 0.36 }, land: { x: 0.668, y: 0.79 }, helmet: { x: 0.724, y: 0.797 } },
  tall: { window: { x: 0.56, y: 0.38 }, land: { x: 0.69, y: 0.768 }, helmet: { x: 0.785, y: 0.782 } },
} as const;
const TALL_QUERY = "(max-aspect-ratio: 4/5)";
/** 身体框的高宽比（clawd 78 / 112） */
const BODY = 78 / 112;

export function DeskLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const box = root?.parentElement;
    const section = root?.closest<HTMLElement>("[data-desk-landing]");
    const mover = root?.querySelector<HTMLElement>(".landing__mover");
    const crab = root?.querySelector<HTMLElement>(".landing__crab");
    const helmet = root?.querySelector<HTMLElement>(".landing__helmet");
    const spark = root?.querySelector<HTMLElement>(".landing__spark");
    if (!root || !box || !section || !mover || !crab || !helmet || !spark) return;
    const perch = section.querySelector<HTMLElement>(".dscreen__perch");
    const pet = () => section.querySelector<HTMLElement>(".dscreen__crab");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type State = "waiting" | "playing" | "landed";
    let state: State = "waiting";
    const timers: number[] = [];
    const anims: Animation[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const setPerch = (on: boolean) => {
      if (perch) perch.inert = !on;
      section.toggleAttribute("data-landed", on);
    };

    /** 落好了：桌宠上场（叫醒它的自主意识），屏幕开始打字 */
    const handoff = (instant: boolean) => {
      state = "landed";
      setPerch(true);
      mover.style.opacity = "0";
      pet()?.dispatchEvent(new Event("wl:wake"));
      section.dispatchEvent(new Event("wl:landed"));
      if (!instant) {
        const r = pet()?.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        const k = b.width / Math.max(box.offsetWidth, 1);
        if (r) {
          spark.style.left = `${(r.left + r.width / 2 - b.left) / k}px`;
          spark.style.top = `${(r.top + r.height * 0.3 - b.top) / k}px`;
          anims.push(spark.animate([{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.1, offset: 0.35 }, { opacity: 0, scale: 1.5 }], { duration: 520, easing: "ease-out" }));
        }
      }
    };

    const reset = () => {
      timers.splice(0).forEach((id) => window.clearTimeout(id));
      anims.splice(0).forEach((a) => a.cancel());
      state = "waiting";
      setPerch(false);
      mover.style.opacity = "0";
      helmet.style.opacity = "0";
      crab.classList.remove("is-stand", "is-bare", "is-plain", "is-stretch");
    };

    const play = () => {
      state = "playing";
      const tall = window.matchMedia(TALL_QUERY).matches;
      const spots = SPOTS[tall ? "tall" : "wide"];
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      const b = box.getBoundingClientRect();
      const k = b.width / Math.max(bw, 1);
      // 身体的大小 = 屏幕上桌宠的大小（换成房间图坐标）；落在桌上时比它大一点点（离镜头近一点）
      const petRect = pet()?.getBoundingClientRect();
      const S = petRect && petRect.width > 2 ? petRect.width / k : bw * 0.024;
      mover.style.width = `${S}px`;
      mover.style.height = `${S * BODY}px`;
      crab.style.setProperty("--crab-size", `${S}px`);

      /** 脚底在 (x, y)、放大 s 倍时 mover 的 transform（transform-origin 是脚底） */
      const at = (x: number, y: number, s: number) => `translate(${(x - S / 2).toFixed(1)}px, ${(y - S * BODY).toFixed(1)}px) scale(${s.toFixed(3)})`;
      const W = { x: spots.window.x * bw, y: spots.window.y * bh };
      const D = { x: spots.land.x * bw, y: spots.land.y * bh };
      const DS = 1.15;

      crab.classList.remove("is-stand", "is-bare", "is-plain", "is-stretch");
      helmet.style.opacity = "0";
      mover.style.opacity = "1";

      // 1. 从窗户飞进来，落到桌上（先抬一点再落，像减速降落）
      const midX = W.x + (D.x - W.x) * 0.55;
      const midY = Math.min(W.y, D.y) + (D.y - W.y) * 0.25;
      anims.push(
        mover.animate(
          [
            { transform: at(W.x, W.y, 0.45), opacity: 0 },
            { transform: at(W.x + (D.x - W.x) * 0.12, W.y + (D.y - W.y) * 0.05, 0.55), opacity: 1, offset: 0.14 },
            { transform: at(midX, midY, 0.85), opacity: 1, offset: 0.6 },
            { transform: at(D.x, D.y - S * 0.12, DS), opacity: 1, offset: 0.88 },
            { transform: at(D.x, D.y, DS), opacity: 1 },
          ],
          { duration: 1000, easing: "cubic-bezier(0.3, 0.1, 0.3, 1)", fill: "forwards" },
        ),
      );
      // 2. 站直
      later(900, () => crab.classList.add("is-stand"));
      // 3. 举起钳子摘头盔：头盔换成单独的道具，放到旁边、滚一下停在桌上
      later(1250, () => crab.classList.add("is-stretch"));
      later(1450, () => {
        crab.classList.add("is-bare");
        // 头盔在 flyer 坐标里的框是 (-10.5, -42, 133, 120)，身体框是 (0, 0, 112, 78)
        const u = (S * DS) / 112;
        const hx = D.x - (S * DS) / 2 - 10.5 * u;
        const hy = D.y - S * BODY * DS - 42 * u;
        const hw = 133 * u;
        const hh = 120 * u;
        helmet.style.width = `${hw}px`;
        helmet.style.height = `${hh}px`;
        helmet.style.opacity = "1";
        const R = { x: spots.helmet.x * bw - hw / 2, y: spots.helmet.y * bh - hh * 0.9 };
        const tf = (x: number, y: number, r: number, s = 1) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r}deg) scale(${s})`;
        anims.push(
          helmet.animate(
            [
              { transform: tf(hx, hy, 0) },
              { transform: tf(hx + hw * 0.05, hy - hh * 0.32, -5), offset: 0.3 },
              { transform: tf(hx + (R.x - hx) * 0.6, hy - hh * 0.36, 6), offset: 0.55 },
              { transform: tf(R.x, R.y, 12, 0.92), offset: 0.82 },
              { transform: tf(R.x + hw * 0.04, R.y, 17, 0.92) },
            ],
            { duration: 1050, easing: "cubic-bezier(0.4, 0, 0.3, 1)", fill: "forwards" },
          ),
        );
      });
      later(2200, () => crab.classList.remove("is-stretch"));
      // 4. 跳上 Claude 窗口的顶边，半空里斗篷收掉，落下去就是桌宠
      later(2600, () => {
        const nb = box.getBoundingClientRect();
        const nk = nb.width / Math.max(box.offsetWidth, 1);
        const r = pet()?.getBoundingClientRect();
        // 屏幕上的桌宠：脚底（身体框的底边中点）和它相对 S 的大小
        const P = r ? { x: (r.left + r.width / 2 - nb.left) / nk, y: (r.bottom - nb.top) / nk } : { x: D.x - S * 2, y: D.y - bh * 0.3 };
        const ps = r ? r.width / nk / S : 1;
        const apexY = Math.min(P.y, D.y) - S * 1.1;
        anims.push(
          mover.animate(
            [
              { transform: at(D.x, D.y, DS) },
              { transform: at(D.x, D.y + S * 0.06, DS * 1.02), offset: 0.12 },
              { transform: at((D.x + P.x) / 2, apexY, (DS + ps) / 2), offset: 0.55 },
              { transform: at(P.x, P.y, ps) },
            ],
            { duration: 680, easing: "cubic-bezier(0.33, 0, 0.4, 1)", fill: "forwards" },
          ),
        );
        later(330, () => crab.classList.add("is-plain"));
        later(690, () => handoff(false));
      });
    };

    // 位置判断：书桌那一幕钉住了（顶到屏幕顶）就开演；退回第 0 幕就复位
    let raf = 0;
    const read = () => {
      raf = 0;
      if (reduce) return;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (state === "waiting" && r.top <= 2 && r.bottom > vh * 0.6 && !document.hidden) play();
      else if (state !== "waiting" && r.top > vh * 0.3) reset();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    if (reduce) {
      handoff(true);
    } else {
      const r = section.getBoundingClientRect();
      // 打开时已经在更下面（书桌那一幕整个过去了）：直接是落好的样子
      if (r.bottom < window.innerHeight * 0.5) handoff(true);
      else {
        setPerch(false);
        read();
      }
    }
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", schedule);
      timers.forEach((id) => window.clearTimeout(id));
      anims.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div ref={rootRef} className="landing" aria-hidden>
      <span className="landing__helmet">
        <HelmetArt />
      </span>
      <span className="landing__mover">
        <span className="crab crab--flyer crab--still landing__crab" style={{ "--crab-w": 112, "--crab-h": 78 } as CSSProperties}>
          <CrabArt variant="flyer" />
        </span>
      </span>
      <span className="landing__spark">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
