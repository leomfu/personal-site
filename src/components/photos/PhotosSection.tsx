import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MediaCard } from "@/components/ui/MediaCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { localized } from "@/lib/format";
import { localePath } from "@/lib/nav";
import { archiveByYear, featureAlbums, getAlbums } from "@/lib/photos";
import { albumDates, type Album } from "@/lib/photoTypes";
import { PosterHero } from "./PosterHero";

/**
 * 摄影页的全部内容。两级组织：
 * 上半「专题」（成组的作品，大图卡片），下半「档案」（按年份分组的辑清单）。
 *
 * 开头那张双色调海报是 2026-09-08 从首页搬来的（站主要求首页不再放照片，
 * 它更该当摄影的开场）——它本来就是站主自己那张背影照。
 *
 * 内容抽在这个组件里而不是直接写在 page.tsx 上：同一天这一块先被并进 /hobbies、
 * 又被拆回独立页，抽出来之后那两次改动都只是换个外壳。
 */
export async function PhotosSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "photos" });

  const albums = getAlbums();
  const features = featureAlbums(albums);
  const archive = archiveByYear(albums);

  /** 「地点 · 2026.07.11 — 07.13 · 12 帧」 */
  const metaLine = (album: Album) =>
    [
      localized(locale, album.location ?? "", album.locationEn),
      albumDates(album.date, album.dateEnd),
      t("frames", { count: album.photos.length }),
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      {/* 开场大图：负边距顶掉 main 的左右内边距，让海报铺满整个版心还多出一点 */}
      <div className="-mx-6 mb-6">
        <PosterHero />
      </div>

      <PageHeader tag="PHOTOS" tone="warm" title={t("title")} lead={t("lead")} />

      {albums.length === 0 && (
        <Reveal index={0}>
          <p className="text-[15px] leading-[1.9] text-muted">{t("empty")}</p>
        </Reveal>
      )}

      {/* ---------------- 专题：图片卡 ---------------- */}
      {features.length > 0 && (
        <Reveal index={0} className="pb-14">
          <SectionLabel label={t("feature")} note={t("featureNote")} />
          <div className="mt-8 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            {features.map((album) => {
              const cover = album.photos[0];
              const title = localized(locale, album.title, album.titleEn);
              const summary = localized(locale, album.summary ?? "", album.summaryEn);

              return (
                <MediaCard
                  key={album.slug}
                  href={localePath(locale, `/photos/${album.slug}`)}
                  media={
                    cover && (
                      <Image
                        src={cover.src}
                        alt={title}
                        width={cover.width}
                        height={cover.height}
                        loading="lazy"
                        sizes="(max-width: 1280px) 100vw, 50vw"
                        className="absolute inset-0 size-full object-cover saturate-[0.78] brightness-[1.05] transition-[transform,filter] duration-[900ms] ease-out group-hover:scale-[1.02] group-hover:saturate-100 group-hover:brightness-100"
                      />
                    )
                  }
                  title={title}
                  meta={metaLine(album)}
                  desc={summary || undefined}
                />
              );
            })}
          </div>
        </Reveal>
      )}

      {/* ---------------- 档案 ---------------- */}
      {archive.length > 0 && (
        <Reveal index={1}>
          <SectionLabel label={t("archive")} note={t("archiveNote")} />

          <div className="mt-2">
            {archive.map(({ year, albums: list }) => (
              <div key={year} className="mt-10">
                {/* 分辑标题：28px 那一档手写体（比板块标题小，比卡片标题大）*/}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="font-hand text-[28px] leading-[1.2] font-normal text-ink">
                    {year}
                  </h3>
                  <span className="text-[12.5px] text-faint">
                    {t("albumCount", { count: list.length })}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                  {list.map((album) => {
                    const cover = album.photos[0];
                    const title = localized(locale, album.title, album.titleEn);
                    return (
                      <MediaCard
                        key={album.slug}
                        href={localePath(locale, `/photos/${album.slug}`)}
                        media={
                          cover && (
                            <Image
                              src={cover.thumb}
                              alt={title}
                              width={cover.width}
                              height={cover.height}
                              loading="lazy"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="absolute inset-0 size-full object-cover saturate-[0.78] brightness-[1.05] transition-[transform,filter] duration-[900ms] ease-out group-hover:scale-[1.02] group-hover:saturate-100 group-hover:brightness-100"
                            />
                          )
                        }
                        title={title}
                        meta={t("frames", { count: album.photos.length })}
                        desc={
                          [
                            localized(locale, album.location ?? "", album.locationEn),
                            albumDates(album.date, album.dateEnd),
                          ]
                            .filter(Boolean)
                            .join(" · ") || undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </>
  );
}

/** 板块标题：手写大字 + 一行小注记（和 ui/PageHeader 的 SectionTitle 同一档） */
function SectionLabel({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="font-hand text-[clamp(34px,4.4vw,54px)] leading-[1.1] font-normal text-ink">
        {label}
      </h2>
      {note && <span className="text-[13px] text-faint">{note}</span>}
    </div>
  );
}
