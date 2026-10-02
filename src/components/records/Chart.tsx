"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePlayer } from "@/components/player/PlayerProvider";
import { clock } from "@/lib/clock";
import type { MusicScene } from "@/lib/types";

/**
 * 「按心情听」榜单：content/music/chart.json 的几个心情组，铺开全部曲目。
 * **整行可点 = 装到唱机上播放**，不是跳转；去平台是行尾一个单独的链接（不嵌在按钮里）。
 * 封面是作品，原图原色。
 */
export function Chart({ scenes }: { scenes: MusicScene[] }) {
  const t = useTranslations("records");
  const locale = useLocale();
  const en = locale === "en";
  const player = usePlayer();

  if (scenes.length === 0) return null;

  return (
    <section className="chart" aria-labelledby="chart-title">
      <header className="chart__head">
        <h2 id="chart-title" className="chart__title">
          {t("chart.title")}
        </h2>
        <p className="chart__note">{t("chart.note")}</p>
      </header>
      <div className="chart__groups">
        {scenes.map((scene) => (
          <div key={scene.key} className="chart__group">
            <h3 className="placard__label mono">
              {en ? scene.labelEn : scene.label} · {t("chart.count", { count: scene.tracks.length })}
            </h3>
            <ol>
              {scene.tracks.map((track, i) => {
                const current = player.group === scene.key && player.index === i;
                const dead = Boolean(player.broken[track.id]);
                const title = en ? track.titleEn : track.title;
                const artist = en ? track.artistEn : track.artist;
                return (
                  <li key={track.id} className={current ? "row is-current" : "row"}>
                    <button
                      type="button"
                      className="row__play"
                      onClick={() => player.playAt(scene.key, i)}
                      disabled={dead}
                      aria-pressed={current}
                      aria-label={t("chart.playRow", { title, artist })}
                    >
                      <span className="row__cover">
                        {track.cover && (
                          // eslint-disable-next-line @next/next/no-img-element -- 封面是作品，原图原色
                          <img src={track.cover} alt="" width={48} height={48} loading="lazy" decoding="async" />
                        )}
                      </span>
                      <span className="row__text">
                        <span className="row__title">
                          {title}
                          {dead && <span className="row__dead"> {t("player.unplayable")}</span>}
                        </span>
                        <span className="row__artist">{artist}</span>
                      </span>
                      <span className="row__time mono">{clock(track.duration)}</span>
                    </button>
                    {track.platformUrl && (
                      <a href={track.platformUrl} target="_blank" rel="noreferrer" className="row__out" aria-label={t("chart.openPlatformAria", { title })}>
                        ↗
                      </a>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
