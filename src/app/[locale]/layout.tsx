import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Caveat, Geist, Geist_Mono, Ma_Shan_Zheng, Noto_Sans_SC } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@/components/analytics/Analytics";
import { DiveProvider } from "@/components/dive/DiveProvider";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { PencilDefs } from "@/components/sketch/PencilDefs";
import { getMusic } from "@/lib/content";
import { getScene } from "@/lib/scene";
import { routing } from "@/i18n/routing";
import "../globals.css";

/**
 * 字体全部走 next/font/google：构建时下载下来跟站点一起发，访客不连 Google（国内连不上），
 * 这就是自托管。**不要改成 <link> 引 CDN。**
 *
 * 2026-10 改版（scroll-craft，「精密仪器」的语气）：
 *   Geist       标题和正文的拉丁字母
 *   Geist Mono  事实标签、坐标、日期（等宽是这些数据本身的样子，不是装饰）
 *   Noto Sans SC 中文。按 unicode-range 切成上百个小文件，浏览器只下当前页用得到的那几块。
 *
 *   Caveat      彩铅批注的手写字（英文）
 *   马善政       彩铅批注的手写字（中文）。手写体只用于批注，不用于正文
 *
 * 字体栈顺序（globals.css 的 --sc-font-* 和 --wl-hand）：拉丁字体在前、中文字体在后。
 * Geist / Caveat 没有中文字形，中文字符会自动落到思源黑体 / 马善政上；反过来写的话英文也会被中文字体接走。
 */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
// 可变字重：一套分片管全部字重。preload 关掉：中文分片按需下载，不该抢首屏
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-noto-sc", display: "swap", preload: false });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
// 中文手写同样按 unicode-range 切片，只下批注里用到的那几块
const maShanZheng = Ma_Shan_Zheng({ weight: "400", subsets: ["latin"], variable: "--font-mashan", display: "swap", preload: false });

type Params = { locale: string };

/** 静态导出：两种语言都在构建时生成 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#13110f",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

/** 没有脚本时：引擎不会来，所有「等滚动/等进入视口才出现」的东西直接显示 */
const NO_SCRIPT_CSS =
  "[data-sc-in],[data-sc-stagger]>*,[data-sc-cue]{opacity:1!important;transform:none!important}" +
  "[data-sc-reveal]{clip-path:none!important}[data-draw]{--draw:1!important}";

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<Params> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${geist.variable} ${geistMono.variable} ${notoSansSC.variable} ${caveat.variable} ${maShanZheng.variable}`}>
      <body>
        <noscript dangerouslySetInnerHTML={{ __html: `<style>${NO_SCRIPT_CSS}</style>` }} />
        <PencilDefs />
        <NextIntlClientProvider>
          {/*
           * 播放器和俯冲过渡都挂在这一层：它是所有页面的共同祖先，客户端跳页不会卸载。
           * 播放器在这儿，离开唱片页音乐才不断；俯冲在这儿，盖层才能跨过路由切换一直留在屏幕上。
           */}
          <PlayerProvider library={getMusic()}>
            <DiveProvider scene={getScene()}>{children}</DiveProvider>
          </PlayerProvider>
        </NextIntlClientProvider>
        <div className="sc-grain" aria-hidden />
        <Analytics />
      </body>
    </html>
  );
}
