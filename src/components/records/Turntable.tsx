"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { RESIDENT, usePlayer, type Group } from "@/components/player/PlayerProvider";
import { clock } from "@/lib/clock";
import { useProgressPainter } from "@/lib/useAudioPlayer";

/**
 * 唱机（2026-10 改版）：一台真能转、真出声的黑胶唱机，画成从正上方往下看的线稿，
 * 和完整介绍页那张房间平面图是同一种「图纸」语气。
 *
 * ── 唱臂的角度是算出来的 ──
 * 「支点—盘心—针尖」这个三角形用余弦定理反解：唱针落在半径 r 的沟槽上时唱臂该转多少度。
 * 进度 = 唱针从外圈（R_OUT）走到内圈（R_IN），是按半径线性走的。
 *
 * ── 点盘面跳进度 ──
 * 点击位置换算回 SVG 坐标，量它离盘心多远，就知道点的是第几圈：外圈是开头，内圈是结尾。
 *
 * 播放状态不在这里，在 components/player/PlayerProvider（挂在 layout 上，离开这一页音乐不断）。
 */

/** SVG 坐标系 400 × 320，盘心 C，唱臂支点 P */
const C = { x: 160, y: 160 };
const P = { x: 338, y: 52 };
const R_DISC = 132;
const R_OUT = 124;
const R_IN = 60;
const R_LABEL = 46;
const ARM = 200;
/** 唱臂停在托架上时指向正下方（SVG 里 90°） */
const REST = 90;

const D = Math.hypot(C.x - P.x, C.y - P.y);
const BEARING = (Math.atan2(C.y - P.y, C.x - P.x) * 180) / Math.PI;

/** 唱针落在半径 r 的沟槽上，唱臂指向的角度（度） */
function armDeg(r: number) {
  const cos = (D * D + ARM * ARM - r * r) / (2 * D * ARM);
  return BEARING - (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
/** 进度 0–1 → 唱臂相对托架转过的角度 */
const armAngle = (fraction: number) => armDeg(R_OUT - (R_OUT - R_IN) * Math.max(0, Math.min(1, fraction))) - REST;

const GROOVES = Array.from({ length: 13 }, (_, i) => R_IN + 2 + ((R_OUT - R_IN - 4) / 12) * i);

export function Turntable() {
  const t = useTranslations("records.player");
  const locale = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion() ?? false;
  const armRef = useRef<SVGGElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const player = usePlayer();
  const { track, tracks, total, elapsed, broken, shouldPlay, live, group, library, isClip } = player;

  /** 唱针位置就是进度条。停下时唱臂抬回托架 */
  const lastDeg = useRef(Number.NaN);
  const paint = useCallback(
    (fraction: number) => {
      const deg = shouldPlay ? armAngle(fraction) : 0;
      if (Math.abs(deg - lastDeg.current) < 0.04) return;
      lastDeg.current = deg;
      if (armRef.current) armRef.current.style.transform = `rotate(${deg.toFixed(3)}deg)`;
    },
    [shouldPlay],
  );
  useProgressPainter(player.audioRef, total, reduced, paint);

  if (!track) return null;

  const onDiscClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = Math.hypot(point.x - C.x, point.y - C.y);
    if (r < R_IN - 6 || r > R_OUT + 8) return;
    player.seek((R_OUT - r) / (R_OUT - R_IN));
  };

  /** 键盘只在唱片本身拿到焦点时生效：这是一张会滚动的页面，不能全局劫持空格 */
  const onDiscKey = (event: React.KeyboardEvent) => {
    if (event.code === "Space" || event.key === "Enter") {
      event.preventDefault();
      player.toggle();
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      player.nudge(5);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      player.nudge(-5);
    } else if (event.key === "Home") {
      event.preventDefault();
      player.seek(0);
    }
  };

  const title = en ? track.titleEn : track.title;
  const artist = en ? track.artistEn : track.artist;
  const desc = en ? track.descEn : track.desc;
  const fraction = total > 0 ? Math.min(1, elapsed / total) : 0;
  const spinning = (shouldPlay || live) && !reduced;

  const groups: Array<{ key: Group; label: string; count: number }> = [
    ...library.scenes.map((scene) => ({ key: scene.key, label: en ? scene.labelEn : scene.label, count: scene.tracks.length })),
    { key: RESIDENT, label: t("groupResident"), count: library.resident.length },
  ];
  const discName = groups.find((item) => item.key === group)?.label ?? t("groupResident");

  return (
    <section className="deck" aria-label={t("regionLabel")}>
      <div className="deck__main">
        <div className="deck__plan">
          <svg
            ref={svgRef}
            className="deck__svg"
            viewBox="0 0 400 320"
            role="slider"
            tabIndex={0}
            aria-label={t("seek")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            aria-valuetext={`${clock(elapsed)} / ${clock(total)}`}
            onClick={onDiscClick}
            onKeyDown={onDiscKey}
          >
            <defs>
              <clipPath id="deck-label">
                <circle cx={C.x} cy={C.y} r={R_LABEL} />
              </clipPath>
            </defs>
            {/* 机座 */}
            <rect x="8" y="8" width="384" height="304" rx="10" className="deck__plinth" />
            <circle cx={C.x} cy={C.y} r={R_DISC + 6} className="deck__platter" />

            {/* 唱片：这一组在转 */}
            <g
              className={spinning ? "deck__disc is-spinning" : "deck__disc"}
              style={{ transformBox: "view-box", transformOrigin: `${C.x}px ${C.y}px` }}
            >
              <circle cx={C.x} cy={C.y} r={R_DISC} className="deck__vinyl" />
              {GROOVES.map((r) => (
                <circle key={r} cx={C.x} cy={C.y} r={r} className="deck__groove" />
              ))}
              {track.cover ? (
                <image
                  href={track.cover}
                  x={C.x - R_LABEL}
                  y={C.y - R_LABEL}
                  width={R_LABEL * 2}
                  height={R_LABEL * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#deck-label)"
                />
              ) : (
                <g>
                  <circle cx={C.x} cy={C.y} r={R_LABEL} className="deck__label" />
                  <text x={C.x} y={C.y - 14} textAnchor="middle" className="deck__label-text">
                    {discName}
                  </text>
                  <text x={C.x} y={C.y + 24} textAnchor="middle" className="deck__label-small">
                    33⅓ RPM
                  </text>
                </g>
              )}
              {/* 一道反光，转起来才看得出在转 */}
              <path d={`M${C.x - 96} ${C.y - 84}A128 128 0 0 1 ${C.x + 10} ${C.y - 126}`} className="deck__sheen" />
              <circle cx={C.x} cy={C.y} r={3.5} className="deck__spindle" />
            </g>

            {/* 唱臂：按托架姿态（指向正下方）画好，整体绕支点旋转 */}
            <rect x={P.x - 6} y={P.y + ARM - 30} width="12" height="22" rx="3" className="deck__rest" />
            <circle cx={P.x} cy={P.y} r="20" className="deck__pivot" />
            <g
              ref={armRef}
              className="deck__arm"
              style={{
                transformBox: "view-box",
                transformOrigin: `${P.x}px ${P.y}px`,
                transform: "rotate(0deg)",
                transition: reduced ? "none" : "transform 1s cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              <path d={`M${P.x} ${P.y - 34}V${P.y + ARM - 26}`} className="deck__tube" />
              <rect x={P.x - 9} y={P.y - 46} width="18" height="14" rx="2" className="deck__weight" />
              <path d={`M${P.x - 7} ${P.y + ARM - 26}h14l-3 22h-8z`} className="deck__head" />
            </g>
            <circle cx={P.x} cy={P.y} r="6" className="deck__cap" />
          </svg>
        </div>

        <div className="deck__info">
          <p className="placard__label mono">{discName}</p>
          <h2 className="deck__title">{title}</h2>
          <p className="deck__artist">
            {artist}
            {track.album && <span> · {track.album}</span>}
          </p>
          {desc && <p className="deck__desc">{desc}</p>}

          <div className="deck__controls">
            <button type="button" className="iconbtn" onClick={() => player.goto(player.index - 1)} aria-label={t("prev")}>
              <svg width="16" height="14" viewBox="0 0 17 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                <path d="M15.5 1 5.5 7l10 6z" />
                <path d="M1.5 1v12" />
              </svg>
            </button>
            <button type="button" className="iconbtn iconbtn--primary" onClick={player.toggle} aria-label={shouldPlay ? t("pause") : t("play")} aria-pressed={shouldPlay}>
              {shouldPlay ? (
                <svg width="14" height="16" viewBox="0 0 13 15" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M4 1v13M9 1v13" />
                </svg>
              ) : (
                <svg width="14" height="16" viewBox="0 0 13 15" fill="currentColor" aria-hidden>
                  <path d="M12 7.5 0 15V0z" />
                </svg>
              )}
            </button>
            <button type="button" className="iconbtn" onClick={() => player.goto(player.index + 1)} aria-label={t("next")}>
              <svg width="16" height="14" viewBox="0 0 17 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                <path d="M1.5 1 11.5 7l-10 6z" />
                <path d="M15.5 1v12" />
              </svg>
            </button>
            <span className="deck__time mono">
              {clock(elapsed)} / {clock(total)}
            </span>
          </div>
          <p className="deck__state mono">
            {shouldPlay ? t("nowPlaying") : t("stopped")}
            {isClip && ` · ${t("previewTag")}`}
          </p>
          {isClip && <p className="deck__note">{t("previewNote")}</p>}
          {isClip && track.platformUrl && (
            <a href={track.platformUrl} target="_blank" rel="noreferrer" className="textlink">
              {t("fullVersion")}
            </a>
          )}
        </div>
      </div>

      <div className="deck__shelf">
        <label className="deck__volume">
          <span className="mono">{t("volume")}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(player.volume * 100)}
            onChange={(e) => player.setVolume(Number(e.target.value) / 100)}
          />
        </label>
        <div className="deck__discs" role="group" aria-label={t("shelf")}>
          {groups.map((item) => {
            const on = item.key === group;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => player.switchGroup(item.key)}
                aria-pressed={on}
                className={on ? "chip is-active" : "chip"}
              >
                {item.label}
                <span className="chip__count mono">{item.count}</span>
              </button>
            );
          })}
        </div>
        <p className="deck__hint">{t("hint")}</p>
      </div>

      {group === RESIDENT && (
        <div className="deck__list">
          <button type="button" className="textlink" onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen}>
            {listOpen ? t("hideList") : t("showList")} ({tracks.length})
          </button>
          {listOpen && (
            <ol className="tracklist">
              {tracks.map((item, i) => {
                const on = i === player.index;
                const dead = Boolean(broken[item.id]);
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => player.goto(i)} disabled={dead} className={on ? "track is-current" : "track"} aria-current={on ? "true" : undefined}>
                      <span className="track__no mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="track__title">
                        {en ? item.titleEn : item.title}
                        {dead && <span className="track__dead"> {t("unplayable")}</span>}
                      </span>
                      <span className="track__artist">{en ? item.artistEn : item.artist}</span>
                      <span className="track__time mono">{clock(item.duration)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      <p className="deck__credit">
        {group === RESIDENT
          ? t("residentCredit", { credit: (en && library.residentCreditEn) || library.residentCredit })
          : t("chartNote")}
      </p>
    </section>
  );
}
