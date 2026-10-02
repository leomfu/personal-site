import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { PageHead } from "@/components/shell/PageHead";
import { Crab } from "@/components/crab/Crab";
import { getCrabCopy } from "@/lib/crabLines";
import { localized } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "photos", "/photos");
}

/**
 * 全部影集（「暗房」的查看全部）：按辑分组，每辑一行事实标签 + 照片。
 * 照片是作品：原图原色，不裁切。点照片进单辑页，那里可以放大看整帧。
 */
export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("photos");
  const tp = await getTranslations("places");
  const crab = await getCrabCopy(locale);
  const albums = getAlbums();

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead
          place={tp("darkroom.name")}
          title={t("title")}
          lead={t("lead")}
          crab={<Crab variant="photographer" label={crab.label.photographer} lines={crab.lines.darkroom} side="up-left" />}
        />
        <div className="albums">
          {albums.map((album) => {
            const title = localized(locale, album.title, album.titleEn);
            const href = localePath(locale, `/photos/${album.slug}`);
            return (
              <section key={album.slug} className="album" aria-labelledby={`album-${album.slug}`} data-sc-in>
                <header className="album__head">
                  <h2 id={`album-${album.slug}`} className="album__title">
                    <Link href={href}>{title}</Link>
                  </h2>
                  <p className="placard__label mono">{t("albumMeta", { year: album.year, count: album.photos.length })}</p>
                </header>
                <ul className="contact-sheet">
                  {album.photos.map((photo, i) => {
                    const caption = localized(locale, photo.caption ?? "", photo.captionEn);
                    return (
                      <li key={photo.file}>
                        <Link href={href} className="frame">
                          {/* eslint-disable-next-line @next/next/no-img-element -- 摄影作品，原图原色，按原比例 */}
                          <img
                            src={photo.src}
                            width={photo.width}
                            height={photo.height}
                            alt={caption || t("photoAlt", { title, index: i + 1 })}
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>
                        {caption && <p className="frame__caption">{caption}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </ScrollCraftRoot>
  );
}
