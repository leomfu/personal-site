"use client";

import { useEffect, useRef } from "react";
import { AWAY, FLIGHT_MS, introSkipped, markIntro } from "@/lib/intro";

/** 沿江飞行占整段进度的前多少（flight.css 里 --fly = p / 0.425） */
const FLY_END = 0.425;

/**
 * 第 0 幕「沿江飞行」的播放器（BRIEF R12）。它不再跟着滚动走，而是一段约 4 秒、按时间播的动画：
 *
 *   等着     落到江面（--fp = 0）后画面停住。访客第一次往下滑（滚轮 / 手指 / 方向键 / 空格 / 页面滚动）就开播
 *   播放中   一个 rAF 循环把进度 --fp（0..1）写在覆盖层上，画面全在 flight.css 里从 --fp 算；
 *            同时按进度切小螃蟹的姿势（data-beat：落窗台、左看、右看、踮脚、钻缝）。页面照常可以往下滑，不锁滚动、不抢滚动
 *   滑走了   滑到离开第一屏 0.7 屏以上，开场直接完成（覆盖层收掉，进屋后的动画也直接是最终状态）
 *   播完     覆盖层淡出，发 wl:flightdone，进屋后那段（DeskLanding）接着自动演
 * 直接打开 / 恢复了滚动位置 / 同一次访问里看过 / 减少动态效果：不等不播，覆盖层直接收掉。
 * 页面隐藏时 rAF 自己会停，回来时每帧最多按 50ms 往前走，不会一下跳很远。
 */
export function FlightDriver() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-flight]");
    const desk = root?.closest<HTMLElement>("[data-desk-landing]");
    if (!root || !desk) return;
    const crabSlot = root.querySelector<HTMLElement>(".flight__crabslot");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    type State = "waiting" | "playing" | "done";
    let state: State = "waiting";
    let raf = 0;
    let p = 0;
    let last = 0;
    let beat = "";
    let ground = false;
    let gone = false;

    /* 两面楼群墙的行程交给合成器线程（WAAPI 的 transform 动画）：它的 translateZ 在 3D 透视下每帧都会改变屏幕缩放，
       主线程逐帧改 CSS 变量的话浏览器会一遍遍重新栅格化这两张 4000×1500 的大层，GPU 上来不及铺好就闪黑（R12 量过）。
       交给合成器后栅格化一次，之后只是 GPU 摆位置。其余层仍由 --fp 驱动 */
    const walls: Animation[] = [];
    const startWalls = () => {
      const dur = FLIGHT_MS * FLY_END;
      root.querySelectorAll<HTMLElement>(".flight__wall").forEach((el) => {
        const rot = el.classList.contains("flight__wall--bund") ? "84deg" : "-84deg";
        const a = el.animate(
          [
            { transform: `translateZ(var(--z0)) rotateY(${rot})` },
            { transform: `translateZ(calc(var(--z0) + var(--travel))) rotateY(${rot})` },
          ],
          { duration: dur, easing: "linear", fill: "both" },
        );
        a.pause();
        walls.push(a);
      });
    };
    const seekWalls = (v: number) => walls.forEach((a) => (a.currentTime = Math.min(1, v / FLY_END) * FLIGHT_MS * FLY_END));
    const playWalls = () => walls.forEach((a) => a.play());
    const pauseWalls = () => walls.forEach((a) => a.pause());

    const outside = (on: boolean) => window.dispatchEvent(new CustomEvent("wl:outside", { detail: on }));

    const finish = (instant: boolean) => {
      if (state === "done") return;
      state = "done";
      cancelAnimationFrame(raf);
      removeTrigger();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      root.setAttribute("data-done", "");
      root.classList.remove("is-live");
      walls.forEach((a) => a.cancel());
      document.removeEventListener("visibilitychange", onVisible);
      outside(false);
      markIntro();
      desk.dispatchEvent(new CustomEvent("wl:flightdone", { detail: { instant } }));
    };

    const apply = (v: number) => {
      p = v;
      root.style.setProperty("--fp", v.toFixed(4));
      // 结尾的几个动作（落窗台、左看、右看、踮脚、钻缝）：小螃蟹的姿势按进度切
      const nowBeat = v < 0.49 ? "" : v < 0.575 ? "land" : v < 0.6375 ? "lookl" : v < 0.70 ? "lookr" : v < 0.80 ? "tiptoe" : "slip";
      if (nowBeat !== beat) {
        beat = nowBeat;
        if (nowBeat) root.dataset.beat = nowBeat;
        else delete root.dataset.beat;
      }
      const nowGround = nowBeat !== "";
      if (nowGround !== ground) {
        ground = nowGround;
        root.toggleAttribute("data-ground", nowGround);
      }
      // 沿江飞的时候流光、速度线浓一点；转向外墙以后收住
      root.style.setProperty("--fv", v > 0.02 && v < 0.37 ? "0.6" : "0");
      // 小螃蟹钻进窗缝以后，它的按钮 inert，键盘不会停在一个看不见的东西上
      const nowGone = v > 0.8625;
      if (crabSlot && nowGone !== gone) {
        gone = nowGone;
        crabSlot.inert = nowGone;
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (state !== "playing") return;
      const dt = Math.min(50, now - last);
      last = now;
      const next = Math.min(1, p + dt / FLIGHT_MS);
      apply(next);
      if (next >= 1) finish(false);
      else raf = requestAnimationFrame(tick);
    };

    // 页面藏起来时墙的动画也停；回来时对齐到当前进度
    const onVisible = () => {
      if (state !== "playing") return;
      if (document.hidden) pauseWalls();
      else {
        last = performance.now();
        seekWalls(p);
        playWalls();
      }
    };

    const start = () => {
      if (state !== "waiting") return;
      state = "playing";
      markIntro();
      removeTrigger();
      root.classList.add("is-live");
      last = performance.now();
      seekWalls(p);
      playWalls();
      document.addEventListener("visibilitychange", onVisible);
      raf = requestAnimationFrame(tick);
    };

    /* 第一次往下滑就开播（只认向下；页面滚动本身不拦） */
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) start();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY - (e.touches[0]?.clientY ?? touchY) > 6) start();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " ", "End", "Spacebar"].includes(e.key)) start();
    };
    function removeTrigger() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    }

    const onScroll = () => {
      if (window.scrollY > window.innerHeight * AWAY) finish(true);
      else if (window.scrollY > 4) start();
    };

    /* 鼠标视差（桌面）：写 --mx / --my（-1..1），小螃蟹用 transition 跟过去 */
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      root.style.setProperty("--mx", ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty("--my", ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };

    if (introSkipped()) {
      finish(true);
    } else {
      startWalls();
      outside(true);
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onScroll, { passive: true });
      if (fine) window.addEventListener("pointermove", onPointer, { passive: true });
      // 页面刚打开时就已经滑过一点了（恢复滚动位置等）
      onScroll();
    }

    return () => {
      cancelAnimationFrame(raf);
      removeTrigger();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      walls.forEach((a) => a.cancel());
      document.removeEventListener("visibilitychange", onVisible);
      if (state !== "done") outside(false);
    };
  }, []);

  return <span ref={ref} hidden />;
}
