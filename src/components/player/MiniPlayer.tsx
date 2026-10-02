"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePlayer } from "./PlayerProvider";
import { clock } from "@/lib/clock";
import { useProgressPainter } from "@/lib/useAudioPlayer";
import { localePath } from "@/lib/nav";

/**
 * 右下角的迷你播放器：离开唱片页之后音乐还在放，这张小卡片就是它的界面。
 *
 * 只有**用户碰过播放器**（在放，或者放过之后按了暂停）才出现，没播过整站看不到它。
 * 唱片页（已经有大唱机）和首页（单屏的轨道，底部是入口按钮）上不出现。
 * 完整介绍页右下角有房间平面图，卡片会摞在它上面（--plan-offset，由平面图写）。
 * 关掉 = 停止播放（player.stop()），不是把声音藏起来继续放。
 */
const HIDE_ON = [/\/records\/?$/, /^\/(zh|en)\/?$/];

export function MiniPlayer() {
  const t = useTranslations("player");
  const locale = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname() ?? "";
  const player = usePlayer();

  const fillRef = useRef<HTMLSpanElement | null>(null);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const { track, touched, shouldPlay, live, elapsed, total, isClip } = player;

  /** 进度条逐帧画，不走重渲染 */
  const paint = useCallback((fraction: number, done: number) => {
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${fraction.toFixed(4)})`;
    if (timeRef.current) timeRef.current.textContent = clock(done);
  }, []);
  useProgressPainter(player.audioRef, total, reduced, paint);

  const hidden = HIDE_ON.some((re) => re.test(pathname));
  const show = Boolean(track) && touched && !hidden;

  return (
    <AnimatePresence>
      {show && track && (
        <motion.div
          className="mini"
          role="region"
          aria-label={t("regionLabel")}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: reduced ? 0 : 0.24, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="mini__row">
            <Link href={localePath(locale, "/records")} className="mini__disc" aria-label={t("toRecords")}>
              <span className={(shouldPlay || live) && !reduced ? "mini__vinyl is-spinning" : "mini__vinyl"} aria-hidden />
            </Link>
            <Link href={localePath(locale, "/records")} className="mini__text">
              <span className="mini__title">{en ? track.titleEn : track.title}</span>
              <span className="mini__artist">
                {en ? track.artistEn : track.artist}
                {isClip && ` · ${t("preview")}`}
              </span>
            </Link>
            <button
              type="button"
              className="iconbtn iconbtn--small iconbtn--primary"
              onClick={player.toggle}
              aria-label={shouldPlay ? t("pause") : t("play")}
              aria-pressed={shouldPlay}
            >
              {shouldPlay ? (
                <svg width="10" height="12" viewBox="0 0 9 11" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M2.5.5v10M6.5.5v10" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 9 11" fill="currentColor" aria-hidden>
                  <path d="M8.5 5.5 0 11V0z" />
                </svg>
              )}
            </button>
            <button type="button" className="iconbtn iconbtn--small" onClick={player.stop} aria-label={t("close")}>
              <svg width="10" height="10" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                <path d="M.5.5l8 8M8.5.5l-8 8" />
              </svg>
            </button>
          </div>
          <div className="mini__progress">
            <span className="mini__track" aria-hidden>
              <span ref={fillRef} className="mini__fill" />
            </span>
            <input
              type="range"
              min={0}
              max={1000}
              value={total > 0 ? Math.round((elapsed / total) * 1000) : 0}
              onChange={(e) => player.seek(Number(e.target.value) / 1000)}
              aria-label={t("seek")}
              aria-valuetext={`${clock(elapsed)} / ${clock(total)}`}
            />
            <span className="mini__time mono">
              <span ref={timeRef}>{clock(elapsed)}</span> / {clock(total)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
