"use client";

import { useRef, type PointerEvent } from "react";
import Image from "next/image";

/**
 * 首页右列那张「拱门头像卡」（handoff §6.2.1）。
 *
 * 形状：3/4 竖幅，圆角 `120px 120px 28px 28px` —— 上面两角圆成半圆，下面两角只收一点，
 * 所以它读起来是一道拱门而不是一张圆角图。右下偏移 18px 再画一圈同形的橙色描边，
 * 像没对准的第二次套印（和顶栏那枚双色错版 logo 是同一个手势）。
 *
 * 鼠标视差四层各走各的量，越靠前的动得越多：
 *   容器   rotateY(dx*11deg) rotateX(-dy*11deg) scale(1.025)
 *   图片   scale(1.09) 再朝**反方向**位移 14px（反向才有「窗外的景在动」的深度）
 *   描边圈 顺着鼠标位移 16px
 *   胶囊   translateY(-7px) rotate(-4deg) scale(1.07)
 *
 * ⚠️ 全程**直接写 DOM style，不进 React state**：pointermove 每帧都在发，
 * 进 state 等于每帧重渲染一次这棵树。
 *
 * 「减少动态效果」下整个视差不挂 —— 卡还在，只是不动。
 */

const EASE = "transform .4s cubic-bezier(.2,.8,.3,1)";

export function HeroAvatar({ badge, alt }: { badge: string; alt: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const reduced = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduced()) return;
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    /** −0.5 … +0.5，鼠标离卡中心有多远 */
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;

    if (cardRef.current)
      cardRef.current.style.transform = `perspective(900px) rotateY(${dx * 11}deg) rotateX(${-dy * 11}deg) scale(1.025)`;
    if (imgRef.current)
      imgRef.current.style.transform = `scale(1.09) translate(${-dx * 14}px, ${-dy * 14}px)`;
    if (ringRef.current)
      ringRef.current.style.transform = `translate(${dx * 16}px, ${dy * 16}px)`;
    if (badgeRef.current)
      badgeRef.current.style.transform = "translateY(-7px) rotate(-4deg) scale(1.07)";
  };

  const onLeave = () => {
    for (const ref of [cardRef, imgRef, ringRef, badgeRef]) {
      if (ref.current) ref.current.style.transform = "";
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto w-full max-w-[310px] lg:mx-0 lg:ml-auto"
    >
      {/* 右下偏移的那圈橙色描边。放在卡下面一层，所以卡抬起来时它露在右下角 */}
      <span
        ref={ringRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 translate-x-[18px] translate-y-[18px] rounded-[120px_120px_28px_28px] border-2 border-accent-2-400"
        style={{ transition: EASE }}
      />

      <div
        ref={cardRef}
        className="glass relative overflow-hidden rounded-[120px_120px_28px_28px]"
        style={{ aspectRatio: "3 / 4", transition: EASE }}
      >
        <div ref={imgRef} className="absolute inset-0" style={{ transition: EASE }}>
          <Image
            src="/images/hero/road.webp"
            alt={alt}
            fill
            sizes="310px"
            priority
            className="object-cover"
          />
        </div>
      </div>

      <span
        ref={badgeRef}
        aria-hidden
        className="absolute -right-2 bottom-5 rounded-full bg-accent-2 px-[15px] py-[7px] font-hand text-[19px] leading-none text-neutral-100 shadow-md"
        style={{ transition: EASE }}
      >
        {badge}
      </span>
    </div>
  );
}
