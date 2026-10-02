"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * 小螃蟹桌宠（BRIEF R3）：原创的像素风小螃蟹，Claude 式的暖橙色，自己画的。
 * 全站只出现两次：第 1 幕显示器底边来回走（mode="walk"），第 7 幕「写给你」挥手告别（mode="wave"）。
 *
 *   空闲     偶尔眨眼；walk 模式横着走，走一会儿停一会儿，到边掉头
 *   鼠标靠近 停下来，眼珠转向鼠标
 *   点它     （它本身是个 button，键盘 Enter / 空格同样）跳一下、挥钳子、冒一个小气泡
 *   减少动态效果  静止站着；点它只换一个姿势（举钳子）+ 气泡
 *
 * 位置和姿势只改 transform / opacity（走路是 translateX，跳是 translateY，挥钳子是 rotate）。
 * 离开屏幕或页面隐藏时，动画循环整个停掉（IntersectionObserver + visibilitychange）。
 * `still`：只画一只站着的螃蟹，不能点、不动（俯冲过渡最后一帧里那块屏幕用，和落地后的第一帧对上）。
 */

/** 左半边 11 列（右半边镜像），13 行。c 钳子 o 身体 s 暗面/腿 w 眼白 m 嘴 */
const LEFT_ROWS = [
  ".cc........",
  "c..c.......",
  "cc.c.......",
  ".ccc..ww...",
  "..c...ww...",
  "..c....o...",
  "...c.oooooo",
  "....ooooooo",
  "...oooooomm",
  "...oooooooo",
  "....sssssss",
];
const LEGS_A = ["...s.s..s..", "..s.s..s..."];
const LEGS_B = ["....s.s..s.", "...s.s..s.."];
const W = 22;
const H = 13;

type Px = { x: number; y: number; w: number; k: string };

/** 一行字符串 → 合并成横向的一段段矩形（少画几个 rect） */
function runs(rows: string[], y0: number): Px[] {
  const out: Px[] = [];
  rows.forEach((half, r) => {
    const row = half + half.split("").reverse().join("");
    let x = 0;
    while (x < row.length) {
      const k = row[x];
      if (k === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === k) w++;
      out.push({ x, y: y0 + r, w, k });
      x += w;
    }
  });
  return out;
}

const BODY = runs(LEFT_ROWS, 0);
/** 钳子（含胳膊）单独成组，挥手时绕胳膊根转 */
const isClaw = (p: Px) => p.k === "c";
const CLAW_L = BODY.filter((p) => isClaw(p) && p.x < 11);
const CLAW_R = BODY.filter((p) => isClaw(p) && p.x >= 11);
const TORSO = BODY.filter((p) => !isClaw(p));
const LEGS = { a: runs(LEGS_A, 11), b: runs(LEGS_B, 11) };

const FILL: Record<string, string> = {
  c: "var(--crab-claw)",
  o: "var(--crab-body)",
  s: "var(--crab-shade)",
  w: "var(--crab-eye)",
  m: "var(--crab-mouth)",
};

function Rects({ px }: { px: Px[] }) {
  return (
    <>
      {px.map((p) => (
        <rect key={`${p.x}-${p.y}-${p.k}`} x={p.x} y={p.y} width={p.w} height={1} fill={FILL[p.k]} />
      ))}
    </>
  );
}

/** 两帧腿都画上，走路时靠 .is-step 切换显示哪一帧（不走 React 重渲染） */
export function CrabArt() {
  return (
    <svg className="crab__art" viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden focusable="false">
      <g className="crab__legs crab__legs--a">
        <Rects px={LEGS.a} />
      </g>
      <g className="crab__legs crab__legs--b">
        <Rects px={LEGS.b} />
      </g>
      <Rects px={TORSO} />
      <g className="crab__claw crab__claw--l">
        <Rects px={CLAW_L} />
      </g>
      <g className="crab__claw crab__claw--r">
        <Rects px={CLAW_R} />
      </g>
      {/* 眼珠：各一个像素，看哪边就往哪边挪一格 */}
      <rect className="crab__pupil crab__pupil--l" x={7} y={4} width={1} height={1} fill="var(--crab-pupil)" />
      <rect className="crab__pupil crab__pupil--r" x={14} y={4} width={1} height={1} fill="var(--crab-pupil)" />
      {/* 眨眼：眼睑盖下来（一块身体色挡住眼白） */}
      <g className="crab__lids">
        <rect x={6} y={3} width={2} height={2} fill="var(--crab-body)" />
        <rect x={14} y={3} width={2} height={2} fill="var(--crab-body)" />
      </g>
    </svg>
  );
}

type Mode = "walk" | "wave";

export function Crab({
  mode,
  label,
  say,
  still = false,
  className,
}: {
  mode: Mode;
  /** 读屏文字（按钮的 aria-label） */
  label?: string;
  /** 点它冒出来的那个字（hi / bye!） */
  say: string;
  still?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<HTMLSpanElement | null>(null);
  const [talking, setTalking] = useState(false);
  const [pose, setPose] = useState(false);
  const hopRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    // 起点：底边从左往右 22% 处（still 的那只也摆在这儿，俯冲落地前后才对得上）
    const startX = () => {
      const floor = root.parentElement;
      return floor ? Math.max(0, floor.clientWidth - root.offsetWidth) * 0.22 : 0;
    };
    if (still) {
      if (mode === "walk") root.style.transform = `translate3d(${startX().toFixed(1)}px,0,0)`;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let raf = 0;
    let running = false;
    let visible = false;
    let last = 0;
    let x = 0;
    let dir = 1;
    let state: "walk" | "pause" | "look" | "hop" = mode === "walk" ? "walk" : "pause";
    let until = performance.now() + 1800;
    let nextBlink = performance.now() + 1800;
    let nextWave = performance.now() + 900;
    let legClock = 0;
    let pointer: { x: number; y: number } | null = null;
    let hopUntil = 0;

    const floorWidth = () => {
      const floor = root.parentElement;
      return floor ? Math.max(0, floor.clientWidth - root.offsetWidth) : 0;
    };
    if (mode === "walk") x = startX();

    const place = () => {
      root.style.transform = mode === "walk" ? `translate3d(${x.toFixed(1)}px,0,0)` : "";
    };
    place();

    const look = (lx: number, ly: number) => {
      body.style.setProperty("--lx", String(lx));
      body.style.setProperty("--ly", String(ly));
    };

    const wave = (ms: number) => {
      body.classList.add("is-waving");
      window.setTimeout(() => body.classList.remove("is-waving"), ms);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      const dt = Math.min(64, now - (last || now));
      last = now;

      // 眨眼
      if (now > nextBlink) {
        body.classList.add("is-blink");
        window.setTimeout(() => body.classList.remove("is-blink"), 150);
        nextBlink = now + 2200 + Math.random() * 3200;
      }

      // 鼠标靠近：停下来看着它
      let near = false;
      if (pointer && state !== "hop") {
        const r = root.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const reach = Math.max(180, r.width * 3);
        if (Math.hypot(dx, dy) < reach) {
          near = true;
          look(Math.abs(dx) < r.width * 0.3 ? 0 : Math.sign(dx), dy < -r.height * 0.6 ? -1 : 0);
          if (state !== "look") state = "look";
        }
      }
      if (!near && state === "look") {
        look(0, 0);
        state = mode === "walk" ? "walk" : "pause";
        until = now + 1200 + Math.random() * 1500;
      }

      if (state === "hop" && now > hopUntil) {
        state = mode === "walk" ? "pause" : "pause";
        until = now + 700;
      }

      if (mode === "walk") {
        if (state === "walk") {
          const max = floorWidth();
          x += dir * dt * 0.045;
          if (x <= 0 || x >= max) {
            x = Math.min(max, Math.max(0, x));
            dir *= -1;
          }
          legClock += dt;
          if (legClock > 150) {
            legClock = 0;
            body.classList.toggle("is-step");
          }
          if (now > until) {
            state = "pause";
            until = now + 900 + Math.random() * 1700;
            body.classList.remove("is-step");
          }
          place();
        } else if (state === "pause" && now > until) {
          state = "walk";
          if (Math.random() < 0.45) dir *= -1;
          until = now + 1600 + Math.random() * 2600;
        }
      } else if (state === "pause" && now > nextWave) {
        // 第 7 幕：隔一会儿挥一次手
        wave(1300);
        nextWave = now + 3600 + Math.random() * 1600;
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    hopRef.current = () => {
      if (reduce) {
        setPose((v) => !v);
        setTalking(true);
        return;
      }
      state = "hop";
      hopUntil = performance.now() + 1100;
      body.classList.remove("is-hop");
      void body.offsetWidth;
      body.classList.add("is-hop");
      wave(1100);
      window.setTimeout(() => body.classList.remove("is-hop"), 620);
      setTalking(true);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(root);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };
    if (fine && !reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [mode, still]);

  // 气泡 1.6 秒后收起
  useEffect(() => {
    if (!talking) return;
    const id = window.setTimeout(() => setTalking(false), 1600);
    return () => window.clearTimeout(id);
  }, [talking]);

  const cls = ["crab", `crab--${mode}`, still ? "crab--still" : "", className ?? ""].filter(Boolean).join(" ");
  const inner = (
    <span ref={bodyRef} className={`crab__body${pose ? " is-pose" : ""}`} style={{ "--lx": 0, "--ly": 0 } as CSSProperties}>
      <span className={`crab__say${talking ? " is-on" : ""}`} aria-hidden>
        {say}
      </span>
      <CrabArt />
    </span>
  );

  if (still) {
    return (
      <span
        ref={(el) => {
          rootRef.current = el;
        }}
        className={cls}
        aria-hidden
      >
        {inner}
      </span>
    );
  }

  return (
    <button
      ref={(el) => {
        rootRef.current = el;
      }}
      type="button"
      className={cls}
      aria-label={label}
      onClick={() => hopRef.current()}
    >
      {inner}
      <span className="sr-only" aria-live="polite">
        {talking ? say : ""}
      </span>
    </button>
  );
}
