"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { CapeArt, CrabArt, HelmetArt } from "@/components/crab/Crab";
import { AWAY, introSkipped, markIntro } from "@/lib/intro";

/**
 * 进屋之后（BRIEF R11 / R12）。第 0 幕的覆盖层播完（FlightDriver 发 wl:flightdone，小螃蟹已经钻进窗缝、镜头穿过窗洞），
 * 这里自动接着演一小段（约 5 秒走到屏幕里，再加屏幕里打字、回复，一共 9 秒左右）：
 *   从窗户那边落到桌上 → 摘下头盔（弹起，落在桌上滚一下，然后碎成几颗像素点散掉）→ 抖掉小红斗篷（飘落在桌上，同样碎掉散掉）
 *   → 小碎步走到 MacBook 前、爬上键盘 → 沿屏幕底边往里走、越走越小，跨过屏幕下沿时被屏幕遮住（这只在屏幕图片的下面一层）
 *   → 在 Claude 窗口里重新出现（DeskScreen 里的 .dscreen__walker，小尺寸）→ 走到输入框前，屏幕里打出「Hello Claude」、发送、回复
 *   → 跳到窗口顶边，变回桌宠（桌宠在窗口顶边上继续自主意识）
 * 全程同一时刻只有一只：桌上这只走进屏幕下沿就藏起来，屏幕里那只出现；它跳上顶边，那只藏起来，桌宠出现。
 * 头盔和斗篷不留在桌上（R12 取消了彩蛋）：落地后碎成像素点散掉。
 *
 * 只播一次：同一次访问里看过（lib/intro）、直接打开、恢复了滚动位置、减少动态效果，都直接是最终状态
 * （桌宠在屏幕上、对话完成）。访客一直往下滑到离开第一屏 0.7 屏以上，也直接完成。不拦滚动，不抢滚动。
 *
 * 这只是 .plate__box 的孩子：坐标用房间图本身的比例，跟着第 1 幕的视差、推镜一起动。
 * 动画用 Web Animations（只动 transform / opacity，播完就停），不开常驻循环。
 */

type Spot = { x: number; y: number };
type Spots = { window: Spot; land: Spot; helmet: Spot; cape: Spot; front: Spot; kb1: Spot; kb2: Spot; scr: Spot };
/** 房间图上的几个点（归一化坐标，看图量的）：窗户里落进来的地方、落脚点（脚底）、头盔和斗篷最后停的地方、
 *  走路的几个点（笔记本右前角、键盘右、键盘中、屏幕里面）。竖版的笔记本是斜着摆的 */
const SPOTS: Record<"wide" | "tall", Spots> = {
  wide: {
    window: { x: 0.52, y: 0.36 },
    land: { x: 0.668, y: 0.79 },
    helmet: { x: 0.706, y: 0.845 },
    cape: { x: 0.585, y: 0.855 },
    front: { x: 0.635, y: 0.805 },
    kb1: { x: 0.6, y: 0.748 },
    kb2: { x: 0.545, y: 0.724 },
    scr: { x: 0.52, y: 0.668 },
  },
  tall: {
    window: { x: 0.56, y: 0.38 },
    land: { x: 0.69, y: 0.768 },
    helmet: { x: 0.84, y: 0.775 },
    cape: { x: 0.54, y: 0.765 },
    front: { x: 0.76, y: 0.745 },
    kb1: { x: 0.7, y: 0.708 },
    kb2: { x: 0.57, y: 0.7 },
    scr: { x: 0.5, y: 0.645 },
  },
};
const TALL_QUERY = "(max-aspect-ratio: 4/5)";
/** 身体框的高宽比（clawd 78 / 112） */
const BODY = 78 / 112;
/** 落在桌上时比屏幕上的桌宠大一点点（离镜头近一点） */
const DS = 1.6;
/** 头盔、斗篷落地后歇脚的姿势（碎掉之前） */
const HELMET_REST = "rotate(17deg) scale(0.92)";
const CAPE_REST = "rotate(-8deg) scale(1.9, 1.25)";
/** 每件衣服碎成几颗像素点 */
const BITS = 12;

type State = "waiting" | "playing" | "landed";

export function DeskLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const box = root?.parentElement;
    const section = root?.closest<HTMLElement>("[data-desk-landing]");
    const mover = root?.querySelector<HTMLElement>(".landing__mover");
    const crab = root?.querySelector<HTMLElement>(".landing__crab");
    const helmet = root?.querySelector<HTMLElement>(".landing__prop--helmet");
    const cape = root?.querySelector<HTMLElement>(".landing__prop--cape");
    const helmetSlot = helmet?.parentElement;
    const capeSlot = cape?.parentElement;
    const bits = root ? Array.from(root.querySelectorAll<HTMLElement>(".landing__bit")) : [];
    const spark = root?.querySelector<HTMLElement>(".landing__spark");
    if (!root || !box || !section || !mover || !crab || !helmet || !cape || !spark || !helmetSlot || !capeSlot) return;
    const perch = section.querySelector<HTMLElement>(".dscreen__perch");
    const pet = () => section.querySelector<HTMLElement>(".dscreen__crab");
    const walker = () => section.querySelector<HTMLElement>(".dscreen__walker");

    let state: State = "waiting";
    const timers: number[] = [];
    const anims: Animation[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const anim = (el: HTMLElement, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = el.animate(frames, { fill: "forwards", ...opts });
      anims.push(a);
      return a;
    };

    /* ---------------------------------------------------------------- 几何 -- */
    type Geo = {
      bw: number;
      bh: number;
      S: number;
      spots: Spots;
      hw: number;
      hh: number;
      cw: number;
      ch: number;
      /** 头盔、斗篷歇脚时的左上角（盒子像素） */
      hr: Spot;
      cr: Spot;
    };
    const geo = (): Geo | null => {
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      if (bw < 10) return null;
      const spots = SPOTS[window.matchMedia(TALL_QUERY).matches ? "tall" : "wide"];
      // 身体的大小 = 屏幕上桌宠的大小（换成房间图坐标）：桌宠设计尺寸 × 屏幕在盒子里的缩放。取不到就按屏幕宽度估
      const p = pet();
      const scr = section.querySelector<HTMLElement>(".dscreen");
      let S = bw * 0.0236;
      if (p && scr && scr.offsetWidth > 0) {
        const m = new DOMMatrix(getComputedStyle(scr).transform);
        const k = Math.hypot(m.a, m.b) || 0;
        if (k > 0 && p.offsetWidth > 2) S = p.offsetWidth * k;
      }
      S *= 1.3;
      const u = (S * DS) / 112;
      const hw = 133 * u;
      const hh = 120 * u;
      const cw = 59.5 * u;
      const ch = 31.5 * u;
      return {
        bw,
        bh,
        S,
        spots,
        hw,
        hh,
        cw,
        ch,
        hr: { x: spots.helmet.x * bw - hw / 2, y: spots.helmet.y * bh - hh * 0.9 },
        cr: { x: spots.cape.x * bw - cw / 2, y: spots.cape.y * bh - ch * 0.7 },
      };
    };

    /** 头盔和斗篷歇脚的位置和大小，写成盒子的百分比（缩放窗口也跟得上） */
    const layoutRest = () => {
      const g = geo();
      if (!g) return null;
      const put = (el: HTMLElement, x: number, y: number, w: number, h: number) => {
        el.style.left = `${((x / g.bw) * 100).toFixed(3)}%`;
        el.style.top = `${((y / g.bh) * 100).toFixed(3)}%`;
        el.style.width = `${((w / g.bw) * 100).toFixed(3)}%`;
        el.style.height = `${((h / g.bh) * 100).toFixed(3)}%`;
      };
      put(helmetSlot, g.hr.x, g.hr.y, g.hw, g.hh);
      put(capeSlot, g.cr.x, g.cr.y, g.cw, g.ch);
      return g;
    };

    const setPerch = (on: boolean) => {
      if (perch) perch.inert = !on;
      section.toggleAttribute("data-landed", on);
    };
    const resetCrab = () => {
      crab.classList.remove("is-stand", "is-bare", "is-plain", "is-stretch", "is-walk");
    };

    /* ---------------------------------------------------------------- 最终状态 -- */
    /** 桌宠在屏幕上、对话完成，桌上什么都不留。instant = 不是演完的而是直接跳到这里（屏幕里也得跟着直接完成） */
    const settle = (instant: boolean) => {
      timers.splice(0).forEach((id) => window.clearTimeout(id));
      anims.splice(0).forEach((a) => a.cancel());
      state = "landed";
      mover.style.opacity = "0";
      const w = walker();
      if (w) w.style.opacity = "0";
      layoutRest();
      helmet.style.opacity = "0";
      cape.style.opacity = "0";
      setPerch(true);
      markIntro();
      removeSkip();
      if (instant) {
        section.setAttribute("data-final", "");
        section.dispatchEvent(new Event("wl:finish"));
      }
      pet()?.dispatchEvent(new Event("wl:wake"));
    };

    /* ---------------------------------------------------------------- 开演 -- */
    const trot = (g: Geo, from: Spot, to: Spot, s0: number, s1: number, hops: number, lift = 0.07) => {
      // 一段小碎步：从 from 走到 to（脚底坐标），每一步颠一下
      const frames: Keyframe[] = [];
      const n = hops * 2;
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        const up = i % 2 === 1 ? g.S * lift : 0;
        frames.push({
          transform: at(g, from.x + (to.x - from.x) * f, from.y + (to.y - from.y) * f - up, s0 + (s1 - s0) * f),
          offset: f,
        });
      }
      return frames;
    };
    /** 脚底在 (x, y)、放大 s 倍时 mover 的 transform（transform-origin 是脚底） */
    const at = (g: Geo, x: number, y: number, s: number) =>
      `translate(${(x - g.S / 2).toFixed(1)}px, ${(y - g.S * BODY).toFixed(1)}px) scale(${s.toFixed(3)})`;

    /** 衣服落地后碎成几颗像素点，往四周弹开、落下、淡掉（不留在桌上） */
    const shatter = (el: HTMLElement, c: Spot, colors: string[], g: Geo, group: number) => {
      el.style.opacity = "0";
      const size = Math.max(3, (g.S * DS * 3.5) / 112);
      bits.slice(group * BITS, (group + 1) * BITS).forEach((b, i) => {
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        b.style.background = colors[i % colors.length];
        const ang = ((i * 137.5 + group * 40) * Math.PI) / 180;
        const dist = size * (3.5 + (i % 4) * 2.4);
        const x = c.x - size / 2;
        const y = c.y - size / 2;
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist * 0.55 - size * 2.5;
        anim(
          b,
          [
            { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`, opacity: 1 },
            { transform: `translate(${(x + dx).toFixed(1)}px, ${(y + dy).toFixed(1)}px)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${(x + dx * 1.35).toFixed(1)}px, ${(y + dy + size * 4).toFixed(1)}px)`, opacity: 0 },
          ],
          { duration: 720 + (i % 3) * 90, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" },
        );
      });
    };

    const play = () => {
      const g = layoutRest();
      if (!g) {
        settle(true);
        return;
      }
      state = "playing";
      addSkip();
      const { bw, bh, S, spots } = g;
      mover.style.width = `${S}px`;
      mover.style.height = `${S * BODY}px`;
      crab.style.setProperty("--crab-size", `${S}px`);
      const px = (s: Spot): Spot => ({ x: s.x * bw, y: s.y * bh });
      const W = px(spots.window);
      const D = px(spots.land);
      const F = px(spots.front);
      const K1 = px(spots.kb1);
      const K2 = px(spots.kb2);
      const SC = px(spots.scr);

      resetCrab();
      crab.classList.add("is-stand");
      helmet.style.opacity = "0";
      cape.style.opacity = "0";
      mover.style.opacity = "1";

      // 1. 从窗户那边落到桌上（先抬一点再落，像减速降落）
      const midX = W.x + (D.x - W.x) * 0.55;
      const midY = Math.min(W.y, D.y) + (D.y - W.y) * 0.25;
      anim(
        mover,
        [
          { transform: at(g, W.x, W.y, 0.45), opacity: 0 },
          { transform: at(g, W.x + (D.x - W.x) * 0.12, W.y + (D.y - W.y) * 0.05, 0.55), opacity: 1, offset: 0.14 },
          { transform: at(g, midX, midY, 0.85), opacity: 1, offset: 0.6 },
          { transform: at(g, D.x, D.y - S * 0.12, DS), opacity: 1, offset: 0.88 },
          { transform: at(g, D.x, D.y, DS), opacity: 1 },
        ],
        { duration: 1000, easing: "cubic-bezier(0.3, 0.1, 0.3, 1)" },
      );

      // 2. 摘头盔：举钳子，头盔弹起、落在桌上滚一下（之后它就留在那儿）
      later(1150, () => crab.classList.add("is-stretch"));
      later(1350, () => {
        crab.classList.add("is-bare");
        // 头盔在 flyer 坐标里的框是 (-10.5, -42, 133, 120)，身体框是 (0, 0, 112, 78)
        const u = (S * DS) / 112;
        const hx = D.x - (S * DS) / 2 - 10.5 * u;
        const hy = D.y - S * BODY * DS - 42 * u;
        helmet.style.opacity = "1";
        const off = (x: number, y: number, r: number, s = 1) => `translate(${(x - g.hr.x).toFixed(1)}px, ${(y - g.hr.y).toFixed(1)}px) rotate(${r}deg) scale(${s})`;
        anim(
          helmet,
          [
            { transform: off(hx, hy, 0) },
            { transform: off(hx + g.hw * 0.05, hy - g.hh * 0.32, -5), offset: 0.3 },
            { transform: off(hx + (g.hr.x - hx) * 0.6, hy - g.hh * 0.36, 6), offset: 0.55 },
            { transform: off(g.hr.x, g.hr.y, 12, 0.92), offset: 0.82 },
            { transform: HELMET_REST },
          ],
          { duration: 1050, easing: "cubic-bezier(0.4, 0, 0.3, 1)" },
        );
      });
      later(2050, () => crab.classList.remove("is-stretch"));
      // 头盔落地、滚一下，歇半拍，碎成像素点散掉
      later(2750, () => shatter(helmet, { x: g.hr.x + g.hw / 2, y: g.hr.y + g.hh / 2 }, ["#e9f0fb", "#b9c9e0", "#ffffff", "#FF7A4D"], g, 0));

      // 3. 抖斗篷：身子左右抖三下，斗篷脱下来飘落到桌上
      later(2150, () => {
        anim(crab, [{ rotate: "0deg" }, { rotate: "-5deg" }, { rotate: "5deg" }, { rotate: "-4deg" }, { rotate: "4deg" }, { rotate: "0deg" }], {
          duration: 520,
          easing: "ease-in-out",
        });
      });
      later(2400, () => {
        crab.classList.add("is-plain");
        const u = (S * DS) / 112;
        const wx = D.x - (S * DS) / 2 - 59.5 * u;
        const wy = D.y - S * BODY * DS + 38.5 * u;
        const dx = wx - g.cr.x;
        const dy = wy - g.cr.y;
        const tf = (x: number, y: number, r: number, sx: number, sy: number) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r}deg) scale(${sx}, ${sy})`;
        cape.style.opacity = "1";
        anim(
          cape,
          [
            { transform: tf(dx, dy, 0, 1, 1) },
            { transform: tf(dx * 0.62 - u * 14, dy * 0.45 - u * 10, -16, 1.1, 1), offset: 0.3 },
            { transform: tf(dx * 0.3 + u * 10, dy * 0.2, 12, 1.5, 1.1), offset: 0.62 },
            { transform: tf(dx * 0.08 - u * 3, dy * 0.04, -12, 1.8, 1.2), offset: 0.85 },
            { transform: CAPE_REST },
          ],
          { duration: 900, easing: "cubic-bezier(0.35, 0.1, 0.4, 1)" },
        );
      });
      // 斗篷飘落，贴在桌上歇半拍，碎成像素点散掉
      later(3600, () => shatter(cape, { x: g.cr.x + g.cw / 2, y: g.cr.y + g.ch / 2 }, ["#C8343C", "#E8646C", "#8E1F26"], g, 1));

      // 4. 小碎步走到 MacBook 前，爬上键盘，沿屏幕底边往里走、越走越小
      later(3000, () => {
        crab.classList.add("is-walk");
        anim(mover, trot(g, D, F, DS, DS, 3), { duration: 420, easing: "linear" });
      });
      later(3440, () => {
        crab.classList.remove("is-walk");
        // 爬上键盘：跳一下
        anim(
          mover,
          [
            { transform: at(g, F.x, F.y, DS) },
            { transform: at(g, F.x, F.y + S * 0.06, DS * 1.02), offset: 0.15 },
            { transform: at(g, (F.x + K1.x) / 2, Math.min(F.y, K1.y) - S * 0.9, (DS + 1.35) / 2), offset: 0.55 },
            { transform: at(g, K1.x, K1.y, 1.35) },
          ],
          { duration: 300, easing: "cubic-bezier(0.33, 0, 0.4, 1)" },
        );
      });
      later(3760, () => {
        crab.classList.add("is-walk");
        anim(mover, trot(g, K1, K2, 1.35, 1.1, 4), { duration: 480, easing: "linear" });
      });
      later(4260, () => {
        // 屏幕底边就在前面：往里走，越走越小，身子慢慢被屏幕盖住
        anim(mover, trot(g, K2, SC, 1.1, 0.55, 4), { duration: 540, easing: "linear" });
      });
      later(4830, () => {
        crab.classList.remove("is-walk");
        mover.style.opacity = "0";
        enterScreen();
      });

      // 兜底：万一屏幕里的回复事件没来，也要收尾
      later(14000, () => {
        if (state === "playing") settle(true);
      });
    };

    /* ---------------------------------------------------------------- 屏幕里 -- */
    const enterScreen = () => {
      const w = walker();
      const scr = section.querySelector<HTMLElement>(".dscreen");
      const input = scr?.querySelector<HTMLElement>(".dscreen__input");
      const win = scr?.querySelector<HTMLElement>(".dscreen__win");
      const p = pet();
      if (!w || !scr || !input || !win || !p) {
        settle(true);
        return;
      }
      const Sw = p.offsetWidth * 0.8;
      const crabEl = w.firstElementChild as HTMLElement;
      w.style.width = `${Sw}px`;
      w.style.height = `${Sw * BODY}px`;
      crabEl.style.setProperty("--crab-size", `${Sw}px`);
      const W0 = scr.offsetWidth;
      const H0 = scr.offsetHeight;
      const wat = (x: number, y: number, s: number) => `translate(${(x - Sw / 2).toFixed(1)}px, ${(y - Sw * BODY).toFixed(1)}px) scale(${s.toFixed(3)})`;
      const inTop = win.offsetTop + input.offsetTop;
      const goal = { x: win.offsetLeft + input.offsetLeft + Math.min(input.offsetWidth * 0.22, 130), y: inTop + 3 };
      const start = { x: W0 * 0.52, y: H0 + Sw * BODY + 6 };
      w.style.opacity = "1";
      // 从屏幕下沿钻出来（屏幕自己会把超出下沿的部分裁掉），小碎步走到输入框前
      crabEl.classList.add("is-walk");
      const arrive = w.animate(
        (() => {
          const frames: Keyframe[] = [];
          const n = 8;
          for (let i = 0; i <= n; i++) {
            const f = i / n;
            const e = 1 - (1 - f) * (1 - f);
            frames.push({ transform: wat(start.x + (goal.x - start.x) * e, start.y + (goal.y - start.y) * e - (i % 2 ? Sw * 0.07 : 0), 1), offset: f });
          }
          return frames;
        })(),
        { duration: 700, fill: "forwards", easing: "linear" },
      );
      anims.push(arrive);
      later(700, () => {
        crabEl.classList.remove("is-walk");
        // 站在输入框前，屏幕里开始打字（DeskScreen 听这个事件）
        section.dispatchEvent(new Event("wl:landed"));
      });

      // 回复出来之后，跳到窗口顶边，变回桌宠
      const onReplied = () => {
        section.removeEventListener("wl:replied", onReplied);
        later(500, () => {
          if (state !== "playing") return;
          const P = {
            x: (perch?.offsetLeft ?? 0) + p.offsetLeft + p.offsetWidth / 2,
            y: (perch?.offsetTop ?? 0) + p.offsetTop + p.offsetHeight,
          };
          const ps = p.offsetWidth / Sw;
          const apex = Math.min(goal.y, P.y) - Sw * 1.0;
          const jump = w.animate(
            [
              { transform: wat(goal.x, goal.y, 1) },
              { transform: wat(goal.x, goal.y + Sw * 0.06, 1.02), offset: 0.12 },
              { transform: wat((goal.x + P.x) / 2, apex, (1 + ps) / 2), offset: 0.55 },
              { transform: wat(P.x, P.y, ps) },
            ],
            { duration: 640, fill: "forwards", easing: "cubic-bezier(0.33, 0, 0.4, 1)" },
          );
          anims.push(jump);
          later(650, handoff);
        });
      };
      section.addEventListener("wl:replied", onReplied);
    };

    /** 跳上顶边：这只藏起来，桌宠上场。屏幕里的对话已经演完了，不用再通知它 */
    const handoff = () => {
      const w = walker();
      if (w) w.style.opacity = "0";
      state = "landed";
      layoutRest();
      setPerch(true);
      markIntro();
      removeSkip();
      pet()?.dispatchEvent(new Event("wl:wake"));
      const r = pet()?.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const k = b.width / Math.max(box.offsetWidth, 1);
      if (r) {
        spark.style.left = `${(r.left + r.width / 2 - b.left) / k}px`;
        spark.style.top = `${(r.top + r.height * 0.3 - b.top) / k}px`;
        anims.push(spark.animate([{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.1, offset: 0.35 }, { opacity: 0, scale: 1.5 }], { duration: 520, easing: "ease-out" }));
      }
    };

    /* ---------------------------------------------------------------- 跳过 / 开演 -- */
    // 点一下舞台、按 Esc 可以跳到最终状态；滚轮、方向键、空格都不算（访客照常往下滑，不拦）。
    // 一直滑到离开第一屏 0.7 屏以上，就直接完成（离屏的部分不用再演）
    const skip = (event: Event) => {
      if (state !== "playing") return;
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") return;
      settle(true);
    };
    const addSkip = () => {
      window.addEventListener("pointerdown", skip, true);
      window.addEventListener("keydown", skip, true);
    };
    function removeSkip() {
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("keydown", skip, true);
    }
    const onScroll = () => {
      if (state !== "landed" && window.scrollY > window.innerHeight * AWAY) settle(true);
    };
    // 覆盖层（沿江飞行）播完：接着演进屋之后那段。它是滑走的才直接完成
    const onFlightDone = (e: Event) => {
      if (state !== "waiting") return;
      const instant = Boolean((e as CustomEvent<{ instant: boolean }>).detail?.instant);
      if (instant || document.hidden) settle(true);
      else play();
    };

    const ro = new ResizeObserver(() => {
      layoutRest();
    });
    ro.observe(box);

    setPerch(false);
    if (introSkipped()) settle(true);
    section.addEventListener("wl:flightdone", onFlightDone);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      removeSkip();
      section.removeEventListener("wl:flightdone", onFlightDone);
      window.removeEventListener("scroll", onScroll);
      timers.forEach((id) => window.clearTimeout(id));
      anims.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div ref={rootRef} className="landing">
      <span className="landing__mover" aria-hidden>
        <span className="crab crab--flyer crab--still landing__crab" style={{ "--crab-w": 112, "--crab-h": 78 } as CSSProperties}>
          <CrabArt variant="flyer" />
        </span>
      </span>
      <span className="landing__slot" aria-hidden>
        <span className="landing__prop landing__prop--helmet">
          <HelmetArt />
        </span>
      </span>
      <span className="landing__slot" aria-hidden>
        <span className="landing__prop landing__prop--cape">
          <CapeArt />
        </span>
      </span>
      {Array.from({ length: BITS * 2 }, (_, i) => (
        <i key={i} className="landing__bit" aria-hidden />
      ))}
      <span className="landing__spark" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
