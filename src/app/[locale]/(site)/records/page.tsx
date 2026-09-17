import { setRequestLocale } from "next-intl/server";
import { RecordsSection } from "@/components/records/RecordsSection";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, "records", "/records");
}

/**
 * 唱片 —— 内容全在 components/records/RecordsSection（黑胶唱机 + 按心情听的榜单）。
 * 不在顶栏，入口是首页「爱好」里的「唱片」胶囊卡。
 */
export default async function RecordsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RecordsSection locale={locale} />;
}
