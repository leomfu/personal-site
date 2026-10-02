"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Video } from "@/lib/types";
import { localized, shortDate } from "@/lib/format";

/**
 * 一条视频：默认只画封面（原图原色），点了播放键才真的插入平台的播放器 iframe。
 * 载入之后 iframe 里是平台的画面，不做任何处理。
 */
export function VideoCard({ video }: { video: Video }) {
  const t = useTranslations("videos");
  const locale = useLocale();
  const [loaded, setLoaded] = useState(false);

  const title = localized(locale, video.title, video.title_en);
  const desc = localized(locale, video.desc, video.desc_en);
  const platform = video.platform === "bilibili" ? t("bilibili") : t("youtube");

  const embed =
    video.platform === "bilibili"
      ? `https://player.bilibili.com/player.html?bvid=${video.id}&autoplay=1&high_quality=1&danmaku=0`
      : `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`;
  const pageUrl =
    video.platform === "bilibili" ? `https://www.bilibili.com/video/${video.id}` : `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <article className="video">
      <div className="video__frame">
        {loaded ? (
          <iframe
            src={embed}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="video__poster" onClick={() => setLoaded(true)} aria-label={t("loadAria", { title })}>
            {video.cover && (
              // eslint-disable-next-line @next/next/no-img-element -- 封面是作品，原图原色
              <img src={video.cover} alt="" width={1280} height={720} loading="lazy" decoding="async" />
            )}
            <span className="video__play" aria-hidden>
              <svg width="22" height="24" viewBox="0 0 16 18" fill="currentColor">
                <path d="M15 9 0 18V0z" />
              </svg>
            </span>
            <span className="video__hint mono" aria-hidden>
              {t("load")}
            </span>
          </button>
        )}
      </div>
      <div className="video__body">
        <p className="placard__label mono">
          {[title, video.date.slice(0, 4), platform, shortDate(video.date, locale)].join(" · ")}
        </p>
        <h2 className="video__title">{title}</h2>
        <p className="video__desc">{desc}</p>
        <a href={pageUrl} target="_blank" rel="noreferrer noopener" className="textlink">
          {t("openOn", { platform })}
        </a>
      </div>
    </article>
  );
}
