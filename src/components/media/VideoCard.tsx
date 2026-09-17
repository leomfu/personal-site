"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { Video } from "@/lib/types";
import { localized, shortDate } from "@/lib/format";

/**
 * 视频卡片 —— 改版定稿（docs/design/改版规格.md §6.6）。
 *
 * 一张玻璃大卡（页面那边收在 880px）：16:9 封面（washed）+ 正中 74px 主色播放键（hover 放大 1.08），
 * 键下面一枚深色小胶囊「点击加载播放器」。信息区：24px 手写标题 + 右对齐日期、
 * 14.5px/1.85 描述、次按钮「在哔哩哔哩打开 ↗」。
 *
 * ⚠️ **懒加载逻辑不动**：默认只画封面，点了才真的插入 iframe。
 * 载入播放器之后 iframe 里是人家的画面，不做任何处理。
 */
export function VideoCard({ video }: { video: Video }) {
  const t = useTranslations("videos");
  const locale = useLocale();
  const [loaded, setLoaded] = useState(false);

  const title = localized(locale, video.title, video.title_en);
  const desc = localized(locale, video.desc, video.desc_en);

  const embed =
    video.platform === "bilibili"
      ? `https://player.bilibili.com/player.html?bvid=${video.id}&autoplay=1&high_quality=1&danmaku=0`
      : `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;

  const pageUrl =
    video.platform === "bilibili"
      ? `https://www.bilibili.com/video/${video.id}`
      : `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <article className="glass overflow-hidden">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        {loaded ? (
          <iframe
            src={embed}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={`${t("load")} — ${title}`}
            className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3"
          >
            {video.cover ? (
              <Image
                src={video.cover}
                alt=""
                fill
                sizes="(min-width: 940px) 880px, 100vw"
                className="washed object-cover"
                aria-hidden
              />
            ) : (
              <span
                className="absolute inset-0"
                aria-hidden
                style={{
                  backgroundImage:
                    "radial-gradient(72% 60% at 50% 40%, var(--color-accent-200) 0%, var(--color-accent-300) 55%, var(--color-accent-400) 100%)",
                }}
              />
            )}

            <span className="relative flex size-[74px] items-center justify-center rounded-full bg-accent pl-[5px] text-bg shadow-lg transition-transform duration-[250ms] group-hover:scale-[1.08]">
              <svg width="24" height="26" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
                <path d="M15 9 0 18V0z" />
              </svg>
            </span>

            <span className="relative rounded-full bg-neutral-900 px-4 py-[5px] font-hand text-[13px] text-bg opacity-[0.82]">
              {t("load")}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-hand text-[24px] leading-[1.3] font-normal text-ink">{title}</h2>
          <span className="text-[12.5px] whitespace-nowrap text-ink opacity-50">
            {shortDate(video.date, locale)}
          </span>
        </div>

        <p className="text-[14.5px] leading-[1.85] text-ink opacity-[0.78]">{desc}</p>

        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="glass-soft mt-2 inline-flex min-h-11 w-fit items-center rounded-full px-5 py-2 text-[13px] text-ink transition-colors hover:text-accent-700 sm:min-h-0"
        >
          {video.platform === "bilibili" ? t("onBilibili") : t("onYoutube")}
        </a>
      </div>
    </article>
  );
}
