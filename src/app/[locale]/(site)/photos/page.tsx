import { setRequestLocale } from "next-intl/server";
import { PhotosSection } from "@/components/photos/PhotosSection";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "photos", "/photos");
}

/** 摄影 —— 内容全在 components/photos/PhotosSection（按辑分组的照片网格）。这一页只负责路由和 metadata。 */
export default async function PhotosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PhotosSection locale={locale} />;
}
