import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollCraftRoot } from "@/components/engine/ScrollCraftRoot";
import { AlbumGrid } from "@/components/photos/AlbumGrid";
import { PageHead } from "@/components/shell/PageHead";
import { Crab } from "@/components/crab/Crab";
import { getAlbumLines, getCrabCopy } from "@/lib/crabLines";
import { localized } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";
import { routing } from "@/i18n/routing";

type Params = { locale: string; slug: string };

/** 两种语言 × 所有辑，构建时全量生成 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => getAlbums().map((album) => ({ locale, slug: album.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  const album = getAlbums().find((a) => a.slug === slug);
  if (!album) return {};

  const base = await pageMetadata(locale, "photos", `/photos/${slug}`);
  const t = await getTranslations({ locale, namespace: "photos" });
  const title = localized(locale, album.title, album.titleEn);
  const description = t("albumMeta", { year: album.year, count: album.photos.length });
  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, title, description },
    twitter: { ...base.twitter, title, description },
  };
}

/** 单辑：照片（点开看整帧，← → 翻页、Esc 关闭）+ 上一辑 / 下一辑 */
export default async function AlbumPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const albums = getAlbums();
  const index = albums.findIndex((a) => a.slug === slug);
  if (index === -1) notFound();

  const album = albums[index];
  const prev = albums[index - 1];
  const next = albums[index + 1];
  const t = await getTranslations("photos");
  const tp = await getTranslations("places");
  const crab = await getCrabCopy(locale);
  const albumLines = await getAlbumLines(locale, album, crab);
  const title = localized(locale, album.title, album.titleEn);

  return (
    <ScrollCraftRoot>
      <main id="main" className="pagemain">
        <PageHead
          place={tp("darkroom.name")}
          title={title}
          lead={t("albumMeta", { year: album.year, count: album.photos.length })}
          crab={<Crab variant="photographer" label={crab.label.photographer} lines={albumLines} side="up-left" />}
        />
        <AlbumGrid photos={album.photos} title={title} />

        <nav className="article__pager" aria-label={t("pager")}>
          {prev ? (
            <Link href={localePath(locale, `/photos/${prev.slug}`)} className="pager pager--prev">
              <span className="pager__label mono">{t("older")}</span>
              <span className="pager__title">{localized(locale, prev.title, prev.titleEn)}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={localePath(locale, `/photos/${next.slug}`)} className="pager pager--next">
              <span className="pager__label mono">{t("newer")}</span>
              <span className="pager__title">{localized(locale, next.title, next.titleEn)}</span>
            </Link>
          )}
        </nav>
        <Link href={localePath(locale, "/photos")} className="textlink article__back">
          {t("backToList")}
        </Link>
      </main>
    </ScrollCraftRoot>
  );
}
