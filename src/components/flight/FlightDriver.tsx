"use client";

import { useEffect, useRef } from "react";
import { AWAY, SNEAK_MS, VIDEO_MS, introSkipped, markIntro } from "@/lib/intro";

/** 开播后这么久还没有看到画面在动（加载慢、自动播放被拦），就当视频播不了，直接跳到最后一帧 */
const START_TIMEOUT = 3000;
/** 播到一半卡住（currentTime 这么久不动）也当播不了 */
const STALL_TIMEOUT = 2500;

/**
 * 第 0 幕「沿江飞行」的播放器（BRIEF R12 / R14）。开场是一段按时间播的真视频，后面接一小段动画：
 *
 *   等着     落到江面后画面停在视频第一帧（静帧）。访客第一次往下滑（滚轮 / 手指 / 方向键 / 空格 / 页面滚动）就开播
 *   视频     视频静音、按 VIDEO_MS 加速播放，小宇航员叠在前面飞。rAF 每帧把视频进度写成 --vp（0..1）。
 *            视频播不了（自动播放被拦、加载失败、卡住）就直接当它已经播完，用最后一帧静帧顶上
 *   落窗台   视频停在最后一帧（窗户）。这一段按 SNEAK_MS 走，进度 --sp（0..1）：落窗台、左看右看、踮脚、钻缝、穿窗进屋
 *            （data-beat 切小螃蟹的姿势）。页面照常可以往下滑，不锁滚动、不抢滚动
 *   滑走了   滑到离开第一屏 0.7 屏以上，开场直接完成（覆盖层收掉，进屋后的动画也直接是最终状态）
 *   播完     覆盖层淡出，发 wl:flightdone，进屋后那段（DeskLanding）接着自动演
 * 直接打开 / 恢复了滚动位置 / 同一次访问里看过 / 减少动态效果：不等不播，覆盖层直接收掉，视频连下载都不开始。
 * 页面隐藏时 rAF 自己会停，回来时每帧最多按 50ms 往前走，不会一下跳很远。
 */
export function FlightDriver() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>("[data-flight]");
    const desk = root?.closest<HTMLElement>("[data-desk-landing]");
    if (!root || !desk) return;
    const crabSlot = root.querySelector<HTMLElement>(".flight__crabslot");
    const video = root.querySelector<HTMLVideoElement>(".flight__video");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    type State = "waiting" | "video" | "sneak" | "done";
    let state: State = "waiting";
    let raf = 0;
    let sp = 0;
    let last = 0;
    let beat = "";
    let ground = false;
    let gone = false;
    let videoStarted = 0;
    let lastTime = 0;
    let lastMove = 0;

    const setVState = (v: "playing" | "ended" | "failed") => root.setAttribute("data-vstate", v);
    const outside = (on: boolean) => window.dispatchEvent(new CustomEvent("wl:outside", { detail: on }));

    const finish = (instant: boolean) => {
      if (state === "done") return;
      state = "done";
      cancelAnimationFrame(raf);
      removeTrigger();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      root.setAttribute("data-done", "");
      stopVideo();
      outside(false);
      markIntro();
      desk.dispatchEvent(new CustomEvent("wl:flightdone", { detail: { instant } }));
    };

    function stopVideo() {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    /** 视频进度（--vp）和落窗台进度（--sp）写到覆盖层上；小螃蟹的姿势按它们切 */
    const apply = (vp: number, s: number) => {
      root.style.setProperty("--vp", vp.toFixed(4));
      root.style.setProperty("--sp", s.toFixed(4));
      // 落窗台以后的几个动作：落稳、左看、右看、踮脚、钻缝。视频最后一小段（--gl 接近 1）小螃蟹已经滑到窗台上，也算落地
      const nowBeat =
        s > 0
          ? s < 0.08
            ? "land"
            : s < 0.22
              ? "lookl"
              : s < 0.36
                ? "lookr"
                : s < 0.62
                  ? "tiptoe"
                  : "slip"
          : vp > 0.96
            ? "land"
            : "";
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
      // 小螃蟹钻进窗缝以后，它的按钮 inert，键盘不会停在一个看不见的东西上
      const nowGone = s > 0.7;
      if (crabSlot && nowGone !== gone) {
        gone = nowGone;
        crabSlot.inert = nowGone;
      }
    };

    /** 视频这一段结束（播完 / 播不了）：停在最后一帧，接落窗台那一段 */
    const toSneak = (ok: boolean) => {
      if (state !== "video") return;
      state = "sneak";
      setVState(ok ? "ended" : "failed");
      if (video) video.pause();
      apply(1, 0);
      sp = 0;
      last = performance.now();
    };

    const tick = (now: number) => {
      raf = 0;
      if (state === "done" || state === "waiting") return;
      if (state === "video") {
        if (!video) {
          toSneak(false);
        } else if (video.ended || (video.duration > 0 && video.currentTime >= video.duration - 0.02)) {
          toSneak(true);
        } else {
          const t = video.currentTime;
          if (t > lastTime + 0.001) {
            lastTime = t;
            lastMove = now;
          }
          const dur = video.duration;
          if (dur > 0) apply(Math.min(1, t / dur), 0);
          const stuck = lastTime === 0 ? now - videoStarted > START_TIMEOUT : now - lastMove > STALL_TIMEOUT;
          if (stuck && !document.hidden) toSneak(false);
        }
        last = now;
      } else {
        const dt = Math.min(50, now - last);
        last = now;
        sp = Math.min(1, sp + dt / SNEAK_MS);
        apply(1, sp);
        if (sp >= 1) {
          finish(false);
          return;
        }
      }
      if ((state as State) !== "done") raf = requestAnimationFrame(tick);
    };

    const loadVideo = () => {
      if (!video || video.getAttribute("src")) return;
      const src = video.dataset.src;
      if (!src) return;
      video.preload = "auto";
      video.src = src;
      video.load();
    };

    const playVideo = () => {
      if (!video) return;
      const go = () => {
        // 按视频实际时长算倍速，播完正好是 VIDEO_MS
        const rate = video.duration / (VIDEO_MS / 1000);
        video.playbackRate = Math.min(16, Math.max(0.0625, rate));
        video.defaultPlaybackRate = video.playbackRate;
        const pr = video.play();
        if (pr) pr.catch(() => toSneak(false));
      };
      if (video.readyState >= 1) go();
      else video.addEventListener("loadedmetadata", go, { once: true });
    };

    const start = () => {
      if (state !== "waiting") return;
      state = "video";
      markIntro();
      removeTrigger();
      videoStarted = performance.now();
      lastMove = videoStarted;
      last = videoStarted;
      if (!video || video.error) {
        toSneak(false);
      } else {
        loadVideo();
        playVideo();
      }
      raf = requestAnimationFrame(tick);
    };

    const onPlaying = () => state === "video" && setVState("playing");
    const onVideoError = () => toSneak(false);
    const onEnded = () => toSneak(true);
    video?.addEventListener("playing", onPlaying);
    video?.addEventListener("error", onVideoError);
    video?.addEventListener("ended", onEnded);

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
      outside(true);
      // 视频提前开始下载（首页悬停入口时已经预加载过一次，这里多半是从缓存里出来）：等访客下滑时第一帧就能出
      loadVideo();
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
      video?.removeEventListener("playing", onPlaying);
      video?.removeEventListener("error", onVideoError);
      video?.removeEventListener("ended", onEnded);
      if (state !== "done") outside(false);
    };
  }, []);

  return <span ref={ref} hidden />;
}
