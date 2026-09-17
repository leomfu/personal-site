import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Caveat, Figtree, Ma_Shan_Zheng, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@/components/analytics/Analytics";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { getMusic } from "@/lib/content";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * 字体全部走 next/font/google —— 它在**构建时**把字体下载下来跟着站点一起发，
 * 访客不需要连 Google（国内连不上），所以这就是自托管。**不要改成 <link> 引 CDN。**
 * 中文字体按 unicode-range 切成上百个小文件，浏览器只会下当前页面用得到的那几块。
 */

/** 正文拉丁：Figtree（变量字重），2026-09-17 改版取代原来的 Inter */
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

/**
 * 正文中文。原来靠系统的 PingFang SC 兜底 —— Mac/iOS 上好看，Windows 上没有这个字体，
 * 会掉到宋体去。改版把它也自托管进来，两边一致。
 * 权重只取三档：400 正文 / 500 强调 / 700 加粗。CJK 每多一档就多一整套分片文件。
 */
const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});

/**
 * 手写标题的拉丁部分。
 * ⚠️ Caveat **没有 CJK 字形**，中文标题靠下面的 Ma Shan Zheng 兜底，
 * globals.css 里 --font-hand 的栈序（Caveat → Ma Shan Zheng）不能反：
 * 反过来的话拉丁字母也会被 Ma Shan Zheng 接走，英文标题就不是这个手势了。
 */
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

/** 手写标题的中文部分。这个字体只有 400 一档，设计稿也要求手写标题字重恒为 400 */
const maShanZheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mashanzheng",
  display: "swap",
});

/** markdown 正文和引言继续用的思源宋体 */
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-noto-serif",
  display: "swap",
});

type Params = { locale: string };

/** 静态导出：两种语言都在构建时生成 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${figtree.variable} ${notoSansSC.variable} ${caveat.variable} ${maShanZheng.variable} ${notoSerif.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          {/*
           * 播放器挂在这一层 —— 它是所有页面的共同祖先，客户端跳页不会卸载。
           * 所以从唱片页走开之后音乐照放，右下角换成迷你卡片接着控制。
           * 放进唱片页里就会随页面一起被卸掉，音乐当场断。
           */}
          <PlayerProvider library={getMusic()}>{children}</PlayerProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
