"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { Video } from "@/lib/types";
import { localized, shortDate } from "@/lib/format";

/**
 * 视频卡片 —— 2026-09-17 改版重做（handoff §6.6）。
 *
 * 一张单列玻璃大卡（页面那边收在 880px）：16:9 封面 + 正中 74px 的主色播放键，
 * 键下面挂一枚深色小胶囊「点击加载播放器」。信息区是 24px 手写标题 + 右对齐日期、
 * 14.5px/1.85 描述、一个次按钮「在哔哩哔哩打开 ↗」。
 *
 * ⚠️ **懒加载逻辑一个字没改**：默认只画封面，点了才真的插入 iframe。
 * 这样一页放十条视频也不会一次性拉十个播放器。
 *
 * 封面走「washed」（去饱和 + 抬亮），让它沉进雾蓝底里；载入播放器之后
 * iframe 里是人家的画面，不做任何处理。
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
      <div className="relative w-full overflow-hidden bg-neutral-300" style={{ aspectRatio: "16 / 9" }}>
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
            className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-5"
          >
            {video.cover ? (
              <Image
                src={video.cover}
                alt=""
                fill
                sizes="(min-width: 900px) 880px, 100vw"
                className="object-cover saturate-[0.72] brightness-[1.06]"
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

            <span className="relative flex size-[74px] items-center justify-center rounded-full bg-accent text-neutral-100 shadow-lg transition-transform duration-300 group-hover:scale-[1.08]">
              <svg width="20" height="22" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
                <path d="M15 9 0 18V0z" />
              </svg>
            </span>

            <span className="relative rounded-full bg-neutral-900/80 px-[14px] py-[6px] text-[11.5px] text-neutral-200 backdrop-blur-sm">
              {t("load")}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 px-7 py-7 sm:px-9">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-hand text-[24px] leading-[1.3] font-normal text-ink">{title}</h3>
          <span className="text-[12.5px] text-faint">{shortDate(video.date, locale)}</span>
        </div>

        <p className="text-[14.5px] leading-[1.85] text-body">{desc}</p>

        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="glass-soft mt-2 w-fit rounded-full px-[22px] py-2.5 text-[13px] text-ink transition-colors hover:text-accent-700"
        >
          {video.platform === "bilibili" ? t("onBilibili") : t("onYoutube")} ↗
        </a>
      </div>
    </article>
  );
}
