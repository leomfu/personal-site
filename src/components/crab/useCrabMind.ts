"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Variant } from "./art";

/**
 * 小螃蟹的「自主意识」（BRIEF R9 第 2 条，中度）。每只螃蟹一个实例，互相独立，时间间隔都带随机抖动。
 *
 * 小状态机（全部由 setTimeout 调度，没有常驻 requestAnimationFrame；动画交给 crab.css）：
 *   待机   眨眼、东张西望（.is-blink / .is-look），隔一阵换成下面某一种
 *   走动   在自己的「轨道」里走一段：位置记在 --x，用 CSS transition 滑过去，腿交替（.is-walk），转向时翻面（--dir）
 *          轨道太窄就原地：转身、踮脚、小跳。宇航员不走，是在光点附近慢慢漂（--x / --y / --rot）
 *   专属   每只自己的小行为（SPECIAL），不用点击；点击 / 回车的招牌动作（.is-act）和气泡仍是 Crab.tsx 的老规矩
 *   好奇   鼠标进了附近一圈：朝它走几步，停下看着它（只在有鼠标的设备上）
 *   打瞌睡 整页约 30 秒没有任何滚动 / 鼠标 / 键盘 / 触摸：坐下、冒 zzz（.is-sleep）；一有动静醒来、伸懒腰（.is-stretch）
 *
 * 轨道：CSS 变量 --crab-roam-l / --crab-roam-r（能往左 / 右离开原位多少，默认 0 = 原地）。
 * 各个位置在自己的样式里给；书桌前那只（roam）的轨道是父元素的整个宽度。
 *
 * 暂停：离屏（IntersectionObserver）、页面隐藏（visibilitychange）、在 inert 的容器里（还没上场）时所有计时器停；
 * 上场时对按钮发一个 wl:wake 事件重新排计时器；
 * 减少动态效果：什么都不做。手机 / 粗指针：节奏更慢、走得更短，不做「好奇」。
 * 走动时不会去抢焦点：它正被聚焦、被鼠标悬着、或气泡在冒时，只做原地的小动作，不挪位置。
 */

export type MindOptions = {
  variant: Variant;
  /** 轨道 = 父元素整个宽度（书桌前那只在窗口顶边上走） */
  roam: boolean;
  still: boolean;
  greet: boolean;
  /** 迷你播放器正在放歌（戴耳机那只看它） */
  playingRef: MutableRefObject<boolean>;
};

/** 招牌动作要多久（和 crab.css 里的关键帧对齐） */
export const ACT_MS: Record<Variant, number> = {
  desk: 1200,
  astronaut: 1500,
  builder: 1700,
  reader: 1900,
  director: 1300,
  photographer: 1000,
  dj: 2000,
  mail: 1900,
  boxer: 1250,
};
/** 待机小动作（is-fidget）要多久 */
const FIDGET_MS: Partial<Record<Variant, number>> = {
  astronaut: 900,
  builder: 700,
  reader: 800,
  director: 650,
  photographer: 900,
  dj: 900,
  mail: 700,
  boxer: 700,
};
/** 每只自己的小行为。edge：先走到轨道那一头再做（敲卡片的角、敲邮箱） */
const SPECIAL: Record<Variant, { cls: string; ms: number; edge?: "l" | "r" }> = {
  desk: { cls: "is-hop", ms: 700 },
  astronaut: { cls: "is-roll", ms: 2800 },
  builder: { cls: "is-knock", ms: 1100, edge: "r" },
  reader: { cls: "is-write", ms: 2000 },
  director: { cls: "is-act", ms: ACT_MS.director },
  photographer: { cls: "is-act", ms: ACT_MS.photographer },
  dj: { cls: "is-hum", ms: 2600 },
  mail: { cls: "is-knock", ms: 1100, edge: "r" },
  boxer: { cls: "is-act", ms: ACT_MS.boxer },
};

const SLEEP_AFTER = 30000;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ 全页共享：访客有没有动静 -- */

type Listener = { wake: () => void; pointer: () => void };
const world = { last: 0, px: -1e6, py: -1e6, subs: new Set<Listener>(), off: null as null | (() => void) };

function joinWorld(l: Listener) {
  world.subs.add(l);
  if (!world.off) {
    world.last = Date.now();
    let lastWake = 0;
    let lastPointer = 0;
    let pointerTimer = 0;
    const firePointer = () => {
      pointerTimer = 0;
      lastPointer = Date.now();
      world.subs.forEach((s) => s.pointer());
    };
    const bump = () => {
      const now = Date.now();
      world.last = now;
      if (now - lastWake > 150) {
        lastWake = now;
        world.subs.forEach((s) => s.wake());
      }
    };
    const onMove = (e: PointerEvent) => {
      bump();
      if (e.pointerType !== "mouse") return;
      world.px = e.clientX;
      world.py = e.clientY;
      const wait = 140 - (Date.now() - lastPointer);
      if (wait <= 0) firePointer();
      else if (!pointerTimer) pointerTimer = window.setTimeout(firePointer, wait);
    };
    const opts = { passive: true, capture: true } as const;
    window.addEventListener("pointermove", onMove, opts);
    window.addEventListener("pointerdown", bump, opts);
    window.addEventListener("keydown", bump, opts);
    window.addEventListener("wheel", bump, opts);
    window.addEventListener("touchstart", bump, opts);
    window.addEventListener("scroll", bump, opts);
    world.off = () => {
      window.removeEventListener("pointermove", onMove, opts);
      window.removeEventListener("pointerdown", bump, opts);
      window.removeEventListener("keydown", bump, opts);
      window.removeEventListener("wheel", bump, opts);
      window.removeEventListener("touchstart", bump, opts);
      window.removeEventListener("scroll", bump, opts);
      window.clearTimeout(pointerTimer);
    };
  }
  return () => {
    world.subs.delete(l);
    if (!world.subs.size && world.off) {
      world.off();
      world.off = null;
    }
  };
}

/* ------------------------------------------------------------------------------- 状态机 -- */

export function useCrabMind(rootRef: RefObject<HTMLElement | null>, o: MindOptions) {
  const { variant, roam, still, greet, playingRef } = o;
  /** 招牌动作（点击、进入视口、外部触发都走这个） */
  const actRef = useRef<() => void>(() => {});
  const reduceRef = useRef(false);

  useEffect(() => {
    const found = rootRef.current;
    if (!found) return;
    const root: HTMLElement = found;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = reduce;

    // 书桌前那只：起点在父元素 72% 处
    const range = () => {
      const floor = root.parentElement;
      return floor ? Math.max(0, floor.clientWidth - root.offsetWidth) : 0;
    };
    const lenVar = (name: string) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
    const bounds = (): [number, number] => (roam ? [0, range()] : [-lenVar("--crab-roam-l"), lenVar("--crab-roam-r")]);
    let x = roam ? range() * 0.72 : 0;
    const setX = (v: number) => root.style.setProperty("--x", `${v.toFixed(1)}px`);
    if (roam) setX(x);
    if (still || reduce) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // 手机 / 粗指针 / 窄屏：节奏慢一半、走得短、不做好奇
    const calm = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 640 ? 1.9 : 1;
    const speed = calm > 1 ? 0.03 : 0.042; // px / ms
    // 宇航员不走路，是在原地附近慢慢漂
    const drift = variant === "astronaut";
    const spec = SPECIAL[variant];

    let visible = false;
    let greeted = !greet;
    let acting = false; // 在做招牌 / 专属 / 伸懒腰 / 看着你（这段时间不换新花样）
    let walking = false;
    let asleep = false;
    let sleptAt = 0;
    let dir = 1;
    let lastSpecial = Date.now() - rand(0, 6000);
    let lastAct = Date.now();
    let lastCurious = 0;
    const timers = new Set<number>();
    let thinkTimer = 0;
    let blinkTimer = 0;
    let sleepTimer = 0;
    let walkTimer = 0;
    let curiousTimer = 0;
    let actTimer = 0;
    let sleepLimit = SLEEP_AFTER;

    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };
    const flash = (name: string, ms: number) => {
      root.classList.remove(name);
      void root.getBoundingClientRect();
      root.classList.add(name);
      after(ms, () => root.classList.remove(name));
    };
    // 放在 inert 的地方 = 还没上场：不想事、不走动，被叫醒（wl:wake）再开始
    const running = () => visible && !document.hidden && !root.closest("[inert]");
    const pinned = () =>
      document.activeElement === root || root.matches(":hover") || Boolean(root.querySelector(".crab__say.is-on"));
    const setDir = (d: number) => {
      dir = d;
      root.style.setProperty("--dir", String(d));
    };
    const busyFor = (ms: number) => {
      acting = true;
      window.clearTimeout(actTimer);
      actTimer = window.setTimeout(() => {
        acting = false;
      }, ms);
    };

    // ---- 走 ----
    /** 走到一半被打断：停在当前位置 */
    const freeze = () => {
      if (!walking) return;
      window.clearTimeout(walkTimer);
      walking = false;
      const cur = parseFloat(getComputedStyle(root).translate) || x;
      x = cur;
      root.style.setProperty("--walk-ms", "0ms");
      setX(x);
      root.classList.remove("is-walk");
    };
    const walkTo = (to: number, then?: () => void) => {
      const [mn, mx] = bounds();
      to = Math.max(mn, Math.min(mx, to));
      const dx = to - x;
      if (Math.abs(dx) < 6) {
        then?.();
        return false;
      }
      setDir(dx > 0 ? 1 : -1);
      const ms = Math.abs(dx) / speed;
      root.style.setProperty("--walk-ms", `${ms.toFixed(0)}ms`);
      root.style.setProperty("--walk-ease", "linear");
      x = to;
      setX(x);
      root.classList.add("is-walk");
      walking = true;
      walkTimer = window.setTimeout(() => {
        walking = false;
        root.classList.remove("is-walk");
        then?.();
      }, ms + 40);
      return true;
    };
    /** 宇航员：在光点附近慢慢漂一小段，加轻微旋转 */
    const driftOnce = (towards?: number) => {
      const [mn, mx] = bounds();
      const to = towards === undefined ? rand(mn, mx) : Math.max(mn, Math.min(mx, x + towards));
      const ms = rand(2600, 4200) * calm;
      root.style.setProperty("--walk-ms", `${ms.toFixed(0)}ms`);
      root.style.setProperty("--walk-ease", "ease-in-out");
      x = to;
      setX(x);
      root.style.setProperty("--y", `${rand(-12, 6).toFixed(1)}px`);
      root.style.setProperty("--rot", `${rand(-7, 7).toFixed(1)}deg`);
    };
    const wander = () => {
      if (drift) return driftOnce();
      const [mn, mx] = bounds();
      const span = Math.min(mx - mn, 110 / (calm > 1 ? 1.6 : 1)) * rand(0.35, 1);
      let to = x + (Math.random() < 0.5 ? -span : span);
      if (to < mn || to > mx) to = x - (to - x); // 碰到边就往回
      walkTo(to);
    };
    const canMove = () => (drift || bounds()[1] - bounds()[0] >= 24) && !pinned();
    const inPlace = () => {
      const r = Math.random();
      if (r < 0.4) setDir(-dir);
      else if (r < 0.75) flash("is-tiptoe", 1100);
      else flash("is-hop", 700);
    };

    // ---- 做动作 ----
    const play = (cls: string, ms: number) => {
      freeze();
      setDir(1);
      busyFor(ms);
      root.classList.remove("is-act", "is-fidget", "is-hum", "is-roll", "is-knock", "is-write", "is-hop");
      flash(cls, ms);
    };
    const act = () => {
      if (asleep) endSleep(false);
      lastAct = Date.now();
      play("is-act", ACT_MS[variant]);
    };
    actRef.current = act;
    const doSpecial = () => {
      lastSpecial = Date.now();
      const cls = variant === "dj" && playingRef.current ? "is-act" : spec.cls;
      const ms = cls === "is-act" ? ACT_MS[variant] : spec.ms;
      if (spec.edge && !drift) {
        const [mn, mx] = bounds();
        const edge = spec.edge === "r" ? mx : mn;
        if (!pinned() && Math.abs(edge - x) >= 6) {
          busyFor(Math.abs(edge - x) / speed + ms + 200);
          walkTo(edge, () => play(cls, ms));
          return;
        }
      }
      play(cls, ms);
    };

    // ---- 想下一件事 ----
    const think = () => {
      thinkTimer = 0;
      if (!running() || asleep) return;
      if (!acting && !walking) {
        const now = Date.now();
        const r = Math.random();
        const specialGap = (playingRef.current ? 6500 : 10000) * calm;
        const actGap = 26000 * calm;
        if (r < 0.34) {
          if (canMove()) wander();
          else inPlace();
        } else if (r < 0.52 && now - lastSpecial > specialGap) {
          doSpecial();
        } else if (r < 0.58 && spec.cls !== "is-act" && now - lastAct > actGap) {
          lastAct = now;
          play("is-act", ACT_MS[variant]);
        } else if (r < 0.78) {
          flash("is-look", 1200);
        } else if (FIDGET_MS[variant] && Math.random() < 0.5) {
          flash("is-fidget", FIDGET_MS[variant] as number);
        } else if (!canMove()) {
          inPlace();
        }
      }
      scheduleThink();
    };
    const scheduleThink = () => {
      window.clearTimeout(thinkTimer);
      if (!running() || asleep) return;
      thinkTimer = window.setTimeout(think, rand(2400, 5600) * calm);
    };
    const scheduleBlink = () => {
      window.clearTimeout(blinkTimer);
      if (!running() || asleep) return;
      blinkTimer = window.setTimeout(() => {
        if (!running() || asleep) return;
        flash("is-blink", 160);
        scheduleBlink();
      }, rand(2400, 5600));
    };

    // ---- 打瞌睡 ----
    const armSleep = () => {
      window.clearTimeout(sleepTimer);
      if (!running() || asleep) return;
      sleepLimit = SLEEP_AFTER + rand(0, 4000);
      const due = world.last + sleepLimit - Date.now();
      sleepTimer = window.setTimeout(fireSleep, Math.max(600, due));
    };
    const fireSleep = () => {
      if (!running() || asleep) return;
      const idle = Date.now() - world.last;
      if (idle < sleepLimit - 300 || (variant === "dj" && playingRef.current)) return armSleep();
      if (acting || walking) {
        sleepTimer = window.setTimeout(fireSleep, 1500);
        return;
      }
      asleep = true;
      sleptAt = Date.now();
      window.clearTimeout(thinkTimer);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(curiousTimer);
      root.classList.remove("is-look", "is-blink", "is-fidget", "is-tiptoe", "is-hop", "is-watch");
      root.style.setProperty("--lx", "0");
      root.style.setProperty("--ly", "0");
      root.classList.add("is-sleep");
    };
    function endSleep(stretch: boolean) {
      if (!asleep) return;
      asleep = false;
      root.classList.remove("is-sleep");
      if (stretch) {
        busyFor(950);
        flash("is-stretch", 950);
      }
      scheduleBlink();
      scheduleThink();
      armSleep();
    }

    // ---- 好奇 ----
    const updateLook = () => {
      if (!visible || asleep) return;
      const r = root.getBoundingClientRect();
      const dx = world.px - (r.left + r.width / 2);
      const dy = world.py - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < Math.max(220, r.width * 2.5);
      const lx = near && Math.abs(dx) > r.width * 0.25 ? Math.sign(dx) : 0;
      const ly = near && Math.abs(dy) > r.height * 0.4 ? Math.sign(dy) : 0;
      root.style.setProperty("--lx", String(lx * dir)); // 身体翻了面，眼睛的左右也跟着翻
      root.style.setProperty("--ly", String(ly));
    };
    const curiousGo = () => {
      if (!running() || asleep || acting || walking) return;
      const r = root.getBoundingClientRect();
      const dx = world.px - (r.left + r.width / 2);
      const toward = Math.sign(dx) || 1;
      const step = Math.min(Math.max(0, Math.abs(dx) - r.width * 0.6), rand(34, 70));
      const watch = () => {
        busyFor(2600);
        root.classList.add("is-watch");
        after(2600, () => root.classList.remove("is-watch"));
        setDir(toward);
        updateLook();
      };
      if (drift) {
        driftOnce(toward * Math.min(step, 14));
        busyFor(3000);
        setDir(1);
        return;
      }
      if (step > 8 && canMove()) {
        busyFor(step / speed + 2800);
        if (!walkTo(x + toward * step, watch)) watch();
      } else {
        setDir(toward);
        busyFor(1800);
        flash("is-hop", 700);
        updateLook();
      }
    };
    const onPointer = () => {
      updateLook();
      if (!fine || !running() || asleep || acting || walking) return;
      const now = Date.now();
      if (now - lastCurious < 9000) return;
      const r = root.getBoundingClientRect();
      const dist = Math.hypot(world.px - (r.left + r.width / 2), world.py - (r.top + r.height / 2));
      if (dist > 300 || dist < r.width * 0.7) return;
      lastCurious = now + rand(0, 3000);
      window.clearTimeout(curiousTimer);
      curiousTimer = window.setTimeout(curiousGo, rand(250, 650));
    };

    const sync = () => {
      const on = visible && !document.hidden;
      root.classList.toggle("is-on", on);
      root.classList.toggle("is-off", !on);
      if (on) {
        if (asleep && world.last > sleptAt) endSleep(true);
        scheduleBlink();
        scheduleThink();
        armSleep();
      } else {
        window.clearTimeout(thinkTimer);
        window.clearTimeout(blinkTimer);
        window.clearTimeout(sleepTimer);
        window.clearTimeout(curiousTimer);
        freeze();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        // 阈值每被穿过一次回调一次（漂浮的宇航员贴着边时会连着触发）：只有「在不在视口」变了才重排计时器
        if (e.isIntersecting !== visible) {
          visible = e.isIntersecting;
          sync();
        }
        if (visible && !greeted && e.intersectionRatio >= 0.5) {
          greeted = true;
          after(450, () => running() && act());
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    root.classList.add("is-off");
    io.observe(root);
    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);
    root.addEventListener("wl:wake", onVisibility);
    const leave = joinWorld({ wake: () => endSleep(true), pointer: fine ? onPointer : () => {} });

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.removeEventListener("wl:wake", onVisibility);
      leave();
      [thinkTimer, blinkTimer, sleepTimer, walkTimer, curiousTimer, actTimer, ...timers].forEach((id) =>
        window.clearTimeout(id),
      );
      actRef.current = () => {};
    };
  }, [rootRef, variant, still, roam, greet, playingRef]);

  return { actRef, reduceRef };
}
