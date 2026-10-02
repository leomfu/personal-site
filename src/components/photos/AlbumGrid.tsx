"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { localized } from "@/lib/format";
import type { Photo } from "@/lib/photoTypes";

/**
 * 单辑页的照片 + 放大看图。
 *
 * 网格里照片按原比例摆（不裁切），点开是整帧原图：**放大态里的照片不做任何处理**，那一刻看的就是作品本身。
 * 放大态：← → 翻页、Esc 关闭，打开时焦点进对话框、背景不滚，关上后焦点回到点开它的那张。
 */
export function AlbumGrid({ photos, title }: { photos: Photo[]; title: string }) {
  const t = useTranslations("photos");
  const locale = useLocale();
  const reduced = useReducedMotion() ?? false;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const lastOpened = useRef<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) {
      // 关上之后焦点回到原来那张
      if (lastOpened.current !== null) {
        triggers.current[lastOpened.current]?.focus({ preventScroll: true });
        lastOpened.current = null;
      }
      return;
    }
    if (lastOpened.current === null) lastOpened.current = openIndex;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
      else return;
      event.preventDefault();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openIndex, close, step]);

  const current = openIndex === null ? null : photos[openIndex];
  const captionOf = (photo: Photo) => localized(locale, photo.caption ?? "", photo.captionEn);
  const altOf = (photo: Photo, i: number) => captionOf(photo) || t("photoAlt", { title, index: i + 1 });
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <ul className="contact-sheet contact-sheet--album">
        {photos.map((photo, i) => (
          <li key={photo.file}>
            <button
              ref={(el) => {
                triggers.current[i] = el;
              }}
              type="button"
              className="frame frame--button"
              onClick={() => setOpenIndex(i)}
              aria-label={t("open", { alt: altOf(photo, i) })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 摄影作品，原图原色，按原比例 */}
              <img src={photo.src} width={photo.width} height={photo.height} alt="" loading="lazy" decoding="async" />
            </button>
            {captionOf(photo) && <p className="frame__caption">{captionOf(photo)}</p>}
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && openIndex !== null && (
          <motion.div
            key="lightbox"
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={t("lightbox.label", { title })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={close}
          >
            <div className="lightbox__bar">
              <span className="mono">
                {pad(openIndex + 1)} / {pad(photos.length)}
              </span>
              <button ref={closeRef} type="button" onClick={close} className="lightbox__btn" aria-label={t("lightbox.close")}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
                  <path d="M5 5l10 10M15 5 5 15" />
                </svg>
              </button>
            </div>
            <div className="lightbox__stage">
              <button
                type="button"
                className="lightbox__btn"
                aria-label={t("lightbox.prev")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
              >
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12.2 3.8 6 10l6.2 6.2" />
                </svg>
              </button>
              <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element -- 整帧原图，不做任何处理 */}
                <img key={current.file} src={current.src} width={current.width} height={current.height} alt={altOf(current, openIndex)} />
                {captionOf(current) && <figcaption>{captionOf(current)}</figcaption>}
              </figure>
              <button
                type="button"
                className="lightbox__btn"
                aria-label={t("lightbox.next")}
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
              >
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M7.8 3.8 14 10l-6.2 6.2" />
                </svg>
              </button>
            </div>
            <p className="lightbox__hint mono">{t("lightbox.hint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
