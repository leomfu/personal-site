import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlbumGrid } from "@/components/photos/AlbumGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { localized } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/nav";
import { getAlbums } from "@/lib/photos";
import { routing } from "@/i18n/routing";

type Params = { locale: string; slug: string };

/** 两种语言 × 所有辑，构建时全量生成 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAlbums().map((album) => ({ locale, slug: album.slug })),
  );
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

/**
 * 单辑页（设计稿没画这一页，沿用摄影页的页头和 figure 网格）：
 * 页头（橙色 PHOTOS 标签 + 辑名 +「年份 · N 张」）→ 照片网格（点开看整帧，← → 翻页、ESC 关闭）→ 上一辑/下一辑
 */
export default async function AlbumPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const albums = getAlbums();
  const index = albums.findIndex((a) => a.slug === slug);
  if (index === -1) notFound();

  const album = albums[index];
  /** 顺序就是摄影页上的顺序：左边是上一辑，右边是下一辑 */
  const prev = albums[index - 1];
  const next = albums[index + 1];

  const t = await getTranslations("photos");
  const title = localized(locale, album.title, album.titleEn);

  return (
    <>
      <PageHeader
        tag={t("tag")}
        tone="warm"
        title={title}
        lead={t("albumMeta", { year: album.year, count: album.photos.length })}
      />

      <Reveal index={0}>
        <AlbumGrid photos={album.photos} title={title} />
      </Reveal>

      {/* 上一辑 / 下一辑 */}
      <Reveal index={1} className="mt-[56px] border-t border-line pt-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
          {prev ? (
            <Link
              href={localePath(locale, `/photos/${prev.slug}`)}
              className="group flex flex-col gap-1.5 sm:max-w-[46%]"
            >
              <span className="text-[11px] tracking-(--tracking-label) text-faint">{t("older")}</span>
              <span className="font-hand text-[22px] text-ink transition-colors group-hover:text-accent-700">
                {localized(locale, prev.title, prev.titleEn)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={localePath(locale, `/photos/${next.slug}`)}
              className="group flex flex-col gap-1.5 sm:max-w-[46%] sm:items-end sm:text-right"
            >
              <span className="text-[11px] tracking-(--tracking-label) text-faint">{t("newer")}</span>
              <span className="font-hand text-[22px] text-ink transition-colors group-hover:text-accent-700">
                {localized(locale, next.title, next.titleEn)}
              </span>
            </Link>
          )}
        </div>
        <Link
          href={localePath(locale, "/photos")}
          className="mt-8 inline-flex min-h-11 items-center text-[13px] text-muted transition-colors hover:text-accent-700"
        >
          ← {t("backToList")}
        </Link>
      </Reveal>
    </>
  );
}
