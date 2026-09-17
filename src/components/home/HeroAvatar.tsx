"use client";

import { useRef, type PointerEvent } from "react";
import Image from "next/image";

/**
 * 首页右列那张「拍立得」头像卡（改版规格 §6.2.1）。
 *
 * 白色卡纸体（--color-surface，**不是玻璃**：拍立得就是一张实纸），padding `14px 14px 52px`，
 * 底部那条宽边上居中一行手写图注 `better stronger me`（15px，accent-2-700）。
 * 卡面圆角 --radius-md、--shadow-lg，整张卡基准倾斜 `rotate(-2.5deg)`。
 * 内嵌图片 3/4、圆角 radius-md / 2、object-position 50% 28%。
 * 没有描边圈、没有「come on」胶囊。
 *
 * ⚠️ 这张海报**不走 washed**：它是首页的主角，原色出现。
 *
 * 鼠标视差（叠在 -2.5deg 基准倾斜上）：
 *   卡片  perspective(1000px) rotateY(dx*11deg) rotateX(-dy*11deg) rotate(-2.5deg) scale(1.025)
 *   图片  scale(1.09) 再朝**反方向**位移 14px
 * 离开时复位到基准倾斜。全程**直接写 DOM style，不进 React state**。
 * 「减少动态效果」下整个视差不挂 —— 卡还斜着，只是不动。
 */

const BASE = "rotate(-2.5deg)";

export function HeroAvatar({ alt, caption }: { alt: string; caption: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    /** −0.5 … +0.5，鼠标离卡中心有多远 */
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.transform = `perspective(1000px) rotateY(${dx * 11}deg) rotateX(${-dy * 11}deg) ${BASE} scale(1.025)`;
    if (imgRef.current)
      imgRef.current.style.transform = `scale(1.09) translate(${-dx * 14}px, ${-dy * 14}px)`;
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = BASE;
    if (imgRef.current) imgRef.current.style.transform = "none";
  };

  return (
    <div className="flex items-center justify-center">
      <div
        ref={cardRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative w-full max-w-[310px] rounded-[var(--radius-md)] bg-surface px-[14px] pt-[14px] pb-[52px] shadow-lg will-change-transform"
        style={{ transform: BASE, transition: "transform .35s cubic-bezier(.2,.8,.3,1)" }}
      >
        <div
          className="relative w-full overflow-hidden rounded-[calc(var(--radius-md)/2)] bg-neutral-200"
          style={{ aspectRatio: "3 / 4" }}
        >
          <div
            ref={imgRef}
            className="absolute inset-0"
            style={{ transition: "transform .4s cubic-bezier(.2,.8,.3,1)" }}
          >
            <Image
              src="/images/hero/poster.webp"
              alt={alt}
              fill
              sizes="310px"
              priority
              className="object-cover object-[50%_28%]"
            />
          </div>
        </div>
        <span className="absolute inset-x-0 bottom-4 text-center font-hand text-[15px] text-accent-2-700">
          {caption}
        </span>
      </div>
    </div>
  );
}
