import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactRedirect } from "@/components/common/ContactRedirect";
import { localePath } from "@/lib/nav";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pageMeta.contact" });
  return { title: t("title"), description: t("description"), robots: { index: false, follow: true } };
}

/**
 * /contact/ 旧地址（2026-10 改版）：联系方式并入了首页和完整介绍页的结尾「窗边」。
 * 静态导出不能做服务器重定向，所以这里输出一张最小的页面：
 * 有脚本就立刻换到首页（router.replace，不留历史记录），没脚本有 meta refresh 和一个链接兜底。
 */
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactRedirect");
  const home = localePath(locale, "");

  return (
    <main className="redirect">
      <meta httpEquiv="refresh" content={`0; url=${home}`} />
      <ContactRedirect href={home} />
      <p>{t("moved")}</p>
      <Link href={home} className="textlink">
        {t("goHome")}
      </Link>
    </main>
  );
}
