import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { localized } from "@/lib/format";
import { localePath } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";

/**
 * 摄影页的全部内容 —— 改版定稿（docs/design/改版规格.md §6.7）。
 *
 *   页头（橙色标签）
 *   按辑分组：28px 手写 h2 +「年份 · N 张」小字，下面 minmax(260px, 1fr) 的照片网格
 *
 * 每张照片一个 figure：圆角 28px、4/3、object-fit cover，底部 12.5px 图注，hover 上浮 6px。
 * 图片统一走 washed（去饱和、降对比、抬亮），鼠标移上去恢复原色。
 * 辑标题和照片都通往这一辑的单辑页（/photos/<slug>/，那里可以点开看整帧原图）。
 */
export async function PhotosSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "photos" });
  const albums = getAlbums();

  return (
    <>
      <PageHeader tag={t("tag")} tone="warm" title={t("title")} lead={t("lead")} />

      <div className="flex flex-col gap-[42px]">
        {albums.map((album, ai) => {
          const title = localized(locale, album.title, album.titleEn);
          const href = localePath(locale, `/photos/${album.slug}`);
          return (
            <section key={album.slug}>
              <Reveal index={ai}>
                <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-hand text-[28px] leading-[1.2] font-normal text-ink">
                    <Link href={href} className="transition-colors hover:text-accent-700">
                      {title}
                    </Link>
                  </h2>
                  <span className="text-[12.5px] tracking-[0.06em] text-ink opacity-55">
                    {t("albumMeta", { year: album.year, count: album.photos.length })}
                  </span>
                </div>
              </Reveal>

              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
                {album.photos.map((photo, i) => {
                  const caption = localized(locale, photo.caption ?? "", photo.captionEn);
                  return (
                    <Reveal key={photo.file} index={i}>
                      <Link href={href} className="group block">
                        <figure className="glass overflow-hidden rounded-[var(--radius-lg)] transition-transform duration-[350ms] group-hover:-translate-y-[6px]">
                          <span className="relative block w-full" style={{ aspectRatio: "4 / 3" }}>
                            <Image
                              src={photo.src}
                              alt={caption || t("photoAlt", { title, index: i + 1 })}
                              fill
                              sizes="(max-width: 640px) 100vw, 560px"
                              className="washed object-cover"
                            />
                          </span>
                          {caption && (
                            <figcaption className="px-4 py-3 text-[12.5px] text-ink opacity-70">
                              {caption}
                            </figcaption>
                          )}
                        </figure>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
