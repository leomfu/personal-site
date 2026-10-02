"use client";

import { useTranslations } from "next-intl";
import { usePlayer, type Group } from "@/components/player/PlayerProvider";

/**
 * 唱片架上的一张唱片封套（第 6 幕）。点一下 = 放进全站那台唱机里放（右下角会出迷你播放器），
 * 不跳页。鼠标移上去的微微翻动是引擎的 data-sc-tilt（只在精确指针、没开减少动态效果时生效）。
 */
export function RecordSleeve({
  group,
  index,
  title,
  artist,
  cover,
  shelf,
}: {
  group: Group;
  index: number;
  title: string;
  artist: string;
  cover?: string;
  /** 没有封面时，封套上印的碟名（常驻那张） */
  shelf: string;
}) {
  const t = useTranslations("tour");
  const player = usePlayer();
  const current = player.group === group && player.index === index && player.shouldPlay;

  return (
    <div className="sleeve" data-sc-tilt="6">
      <button
        type="button"
        className={current ? "sleeve__button is-current" : "sleeve__button"}
        onClick={() => (current ? player.pause() : player.playAt(group, index))}
        aria-pressed={current}
        aria-label={current ? t("pauseSleeve", { title }) : t("playSleeve", { title, artist })}
      >
        <span className="sleeve__art">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- 封面是作品，原图原色，尺寸固定
            <img src={cover} alt="" width={300} height={300} loading="lazy" decoding="async" />
          ) : (
            <span className="sleeve__blank" aria-hidden>
              <span className="mono">{shelf}</span>
              <span>{title}</span>
            </span>
          )}
          <span className="sleeve__state mono" aria-hidden>
            {current ? t("nowPlaying") : ""}
          </span>
        </span>
        <span className="sleeve__caption">
          <span className="sleeve__title">{title}</span>
          <span className="sleeve__artist">{artist}</span>
        </span>
      </button>
    </div>
  );
}
