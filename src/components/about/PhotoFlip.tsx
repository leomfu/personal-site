"use client";

import { useState, type CSSProperties } from "react";

/**
 * 暗房里的一张白边冲印照片，可以翻到背面（BRIEF R4）：点击或回车 / 空格。
 * 背面是手写的地点和年份，来自 content/photos 的真实数据（辑名、年份、照片说明），不编日期。
 * 照片本身是作品：正面原图原色、不裁切。翻面是 transform（rotateY）；
 * 减少动态效果时不转，正反两面直接换（opacity）。
 */
export function PhotoFlip({
  src,
  width,
  height,
  place,
  year,
  caption,
  flipLabel,
  backLabel,
  className,
  style,
}: {
  src: string;
  width: number;
  height: number;
  /** 背面第一行：地点（辑名） */
  place: string;
  year: string;
  /** 背面第二行：照片说明 */
  caption: string;
  /** 读屏：翻到背面 */
  flipLabel: string;
  /** 读屏：翻回正面 */
  backLabel: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [back, setBack] = useState(false);

  return (
    <button
      type="button"
      className={`flip${back ? " is-back" : ""}${height > width ? " is-tall" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-pressed={back}
      aria-label={back ? backLabel : flipLabel}
      onClick={() => setBack((v) => !v)}
    >
      <span className="flip__card">
        <span className="flip__face flip__front print">
          {/* eslint-disable-next-line @next/next/no-img-element -- 摄影作品，原图原色，不裁切 */}
          <img src={src} width={width} height={height} alt="" loading="lazy" decoding="async" />
        </span>
        <span className="flip__face flip__back" aria-hidden={!back}>
          <span className="flip__place hand">
            {place} · {year}
          </span>
          {caption && <span className="flip__caption hand">{caption}</span>}
        </span>
      </span>
    </button>
  );
}
