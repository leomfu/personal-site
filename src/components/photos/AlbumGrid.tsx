"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { localized } from "@/lib/format";
import type { Photo } from "@/lib/photoTypes";

/**
 * 一辑的缩略图网格 + 放大态。
 * 网格是接触印相式的方阵（缩略图裁成正方，整齐是这一页的主要秩序感来源），
 * 点开之后看到的才是整帧未裁的照片。
 *
 * 2026-09-17 改版（handoff §6.7）：缩略图从正方接触印相改成 4/3 的 figure，
 * 28px 圆角、底下挂一行说明、hover 上浮 6px。图片统一走「washed」（去饱和 + 抬亮），
 * 让它沉进雾蓝底里而不是浮在上面；鼠标移上去恢复原色。
 * **放大态里的整帧照片不做任何处理** —— 那一刻看的就是作品本身。
 */
export function AlbumGrid({ photos, title }: { photos: Photo[]; title: string }) {
  const t = useTranslations("photos");
  const locale = useLocale();
  const reduced = useReducedMotion() ?? false;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  /** 放大态：← → 翻页、ESC 关闭，同时锁住背景滚动 */
  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else return;
      event.preventDefault();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const current = openIndex === null ? null : photos[openIndex];
  const captionOf = (photo: Photo) => localized(locale, photo.caption ?? "", photo.captionEn);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {photos.map((photo, i) => {
          const caption = captionOf(photo);
          return (
            <figure key={photo.file} className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-label={t("photoAlt", { title, index: i + 1 })}
                className="group relative w-full cursor-pointer overflow-hidden rounded-[28px] bg-neutral-300 transition-transform duration-300 hover:-translate-y-1.5"
                style={{ aspectRatio: "4 / 3" }}
              >
                <Image
                  src={photo.thumb}
                  alt={caption || t("photoAlt", { title, index: i + 1 })}
                  width={600}
                  height={Math.max(1, Math.round((600 * photo.height) / photo.width))}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="size-full object-cover saturate-[0.78] brightness-[1.05] transition-[transform,filter] duration-[600ms] ease-out group-hover:scale-[1.04] group-hover:saturate-100 group-hover:brightness-100"
                />
              </button>
              {caption && (
                <figcaption className="px-1 text-[12.5px] leading-[1.6] text-muted opacity-70">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      <AnimatePresence>
        {current && openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.24 }}
            className="fixed inset-0 z-50 flex flex-col bg-shell/97 backdrop-blur-[2px]"
            onClick={close}
          >
            {/* 顶部：计数 + 关闭 */}
            <div className="flex shrink-0 items-center justify-between px-5 py-4 text-[11.5px] tracking-[0.16em] text-shell-dim sm:px-8">
              <span>
                {pad(openIndex + 1)} / {pad(photos.length)}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t("lightbox.close")}
                className="cursor-pointer p-1.5 text-shell-dim transition-colors hover:text-shell-ink"
              >
                <CloseIcon />
              </button>
            </div>

            {/* 中间：整帧照片（点图片本身不关闭，翻页按钮在两侧） */}
            <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-3 sm:gap-5 sm:px-8">
              <ArrowButton
                dir="prev"
                label={t("lightbox.prev")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
              />
              <motion.div
                key={current.file}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0.01 : 0.3 }}
                className="flex min-w-0 flex-1 justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={current.src}
                  alt={captionOf(current) || t("photoAlt", { title, index: openIndex + 1 })}
                  width={current.width}
                  height={current.height}
                  sizes="100vw"
                  className="max-h-[74vh] w-auto max-w-full object-contain"
                />
              </motion.div>
              <ArrowButton
                dir="next"
                label={t("lightbox.next")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
              />
            </div>

            {/* 底部：说明文字 + 键盘提示 */}
            <div className="flex shrink-0 flex-col items-center gap-2 px-6 py-5 text-center">
              {captionOf(current) && (
                <p className="max-w-[560px] text-[13px] leading-[1.7] text-shell-muted">
                  {captionOf(current)}
                </p>
              )}
              <p className="hidden text-[11px] tracking-[0.14em] text-shell-faint sm:block">
                {t("lightbox.hint")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ArrowButton({
  dir,
  label,
  onClick,
}: {
  dir: "prev" | "next";
  label: string;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center text-shell-faint transition-colors hover:text-shell-ink"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {dir === "prev" ? <path d="M12.2 3.8 6 10l6.2 6.2" /> : <path d="M7.8 3.8 14 10l-6.2 6.2" />}
      </svg>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}
