"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { NAV_HOME, NAV_TOP, localePath, type NavItem } from "@/lib/nav";
import { siteConfig } from "~/site.config";

/**
 * 顶栏 —— 2026-09-17 改版重做（handoff §6.1）。
 *
 * ⚠️ **顶栏是这次唯一不玻璃化的容器**：完全透明，无边框、无阴影、无 backdrop-filter。
 * 也正因为完全透明，它**不再 fixed**，而是跟着页面一起滚走 ——
 * 一条没有底、没有毛玻璃的横条钉在视窗上，内容滚到它下面就糊成一团。
 * 「融入背景」的前提是它真的只是页面顶上的一块，而不是浮在页面上的一层。
 * 相应地 SiteShell 也不再需要 padding-top 给它让位。
 *
 * 品牌标记是「双色错版」：同一张 logo 用 CSS mask 印两遍，橙的那枚压在左下、
 * 蓝的那枚压在右上，错开 5px —— 套印没对准的那种手感。用 mask 而不是两张彩色图，
 * 是因为颜色要跟着 token 走（换主色时 logo 自动跟着换）。
 *
 * 断点沿用原来的：<lg 汉堡 + 全屏抽屉；lg 导航平铺；xl 社交图标一起出来。
 * 抽屉底色从原来的近黑换成雾蓝玻璃 —— 亮侧的页面不该弹出一块暗侧的板。
 */

/** logo 蒙版那两枚方块共用的一份 style */
const maskStyle: CSSProperties = {
  maskImage: `url(${siteConfig.logo})`,
  WebkitMaskImage: `url(${siteConfig.logo})`,
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

export function TopNav() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;

  const [drawerOpen, setDrawerOpen] = useState(false);

  /** 抽屉打开时锁住背景滚动 */
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  /**
   * 首页要精确匹配，否则 `/zh/` 是所有路径的前缀，哪一页都会把首页也点亮。
   * 其余的用前缀匹配，好让 /blog/xxx 这样的详情页也点亮所在板块。
   */
  const isActive = (path: string) => {
    const full = localePath(locale, path);
    return path === "" ? pathname === full : pathname === full || pathname.startsWith(full);
  };

  const otherLocale = locale === "zh" ? "en" : "zh";
  /** 语言切换保持当前路径：/zh/projects/ → /en/projects/ */
  const otherLocaleHref = pathname.replace(/^\/[^/]+/, `/${otherLocale}`) || `/${otherLocale}/`;

  const name = locale === "en" ? siteConfig.nameEn : siteConfig.name;
  const homeHref = localePath(locale, NAV_HOME.path);

  /** 一条导航项。当前项在下方画一条 2.5px 主色短横，左右各内缩 14px */
  const renderLink = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.key}
        href={localePath(locale, item.path)}
        aria-current={active ? "page" : undefined}
        className={[
          "relative rounded-full px-[14px] py-[7px] text-[14px] transition-colors",
          active ? "text-ink" : "text-muted hover:bg-accent-100 hover:text-ink",
        ].join(" ")}
      >
        {t(`nav.${item.key}`)}
        {active && (
          <span
            className="absolute inset-x-[14px] -bottom-0.5 h-[2.5px] origin-left rounded-full bg-accent motion-safe:animate-[wlBar_.32s_ease]"
            aria-hidden
          />
        )}
      </Link>
    );
  };

  /**
   * 中 / EN —— 胶囊组，选中那一枚实色主色填充。
   * ⚠️ 当前语言那一侧的 href 是 `"#"`（空操作），**不是首页**：
   * 写成 homeHref 的话在 /zh/blog/ 上点「中」会被踢回首页。
   */
  const localeSwitch = (
    <span className="glass-soft flex items-center gap-1 rounded-full p-1 text-[12px]">
      {(["zh", "en"] as const).map((code) => {
        const current = locale === code;
        return (
          <Link
            key={code}
            href={current ? "#" : otherLocaleHref}
            aria-current={current ? "true" : undefined}
            className={
              current
                ? "rounded-full bg-accent px-[11px] py-[3px] font-bold text-bg"
                : "rounded-full px-[11px] py-[3px] text-muted opacity-50 transition-opacity hover:opacity-100"
            }
          >
            {t(`common.${code}`)}
          </Link>
        );
      })}
    </span>
  );

  /** 社交图标一排（顶栏里只有图标，标题在 title/aria-label 上） */
  const socialRow = (
    <div className="flex items-center gap-4">
      {siteConfig.socials.map((social) => {
        const label = locale === "en" ? social.labelEn : social.label;
        const href = social.href || undefined;
        const external = Boolean(href) && !social.href.startsWith("/");

        return (
          <a
            key={social.key}
            href={href}
            title={label}
            aria-label={label}
            {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            className={
              href
                ? "text-muted transition-colors hover:text-accent-700"
                : "cursor-default text-line-strong"
            }
          >
            <SocialIcon name={social.key} />
          </a>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 完全透明：没有 bg / border / shadow / backdrop-filter，这是刻意的 */}
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-page flex-wrap items-center gap-y-3 px-6 py-4">
          {/* 品牌：双色错版的 logo + 名字 */}
          <Link
            href={homeHref}
            aria-label={t("nav.toHome")}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="relative block size-[36px]" aria-hidden>
              <span
                className="absolute top-[10px] left-[5px] size-[21px] bg-accent-2 opacity-75 transition-transform duration-300 group-hover:-translate-x-px"
                style={maskStyle}
              />
              <span
                className="absolute top-[5px] left-[10px] size-[21px] bg-accent transition-transform duration-300 group-hover:translate-x-px"
                style={maskStyle}
              />
            </span>
            <span className="text-[19px] tracking-[0.08em] text-ink">{name}</span>
          </Link>

          {/* 导航（桌面端） */}
          <nav className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV_TOP.map(renderLink)}
          </nav>

          {/* 右侧：语言 · 社交 */}
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <span className="hidden lg:flex">{localeSwitch}</span>
            <span className="hidden xl:flex">{socialRow}</span>

            {/* 移动端：汉堡 */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.menu")}
              className="-mr-1 flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-accent-100 lg:hidden"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- 移动端：全屏抽屉 ---------- */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.24 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 text-ink backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-[19px] tracking-[0.08em]">{name}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t("nav.close")}
                className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-100"
              >
                <CloseIcon />
              </button>
            </div>

            <nav
              className="flex flex-col gap-2 px-6 pt-4"
              onClick={() => setDrawerOpen(false)}
            >
              {NAV_TOP.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.key}
                    href={localePath(locale, item.path)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-full px-5 py-3 font-hand text-[30px] leading-none transition-colors",
                      active ? "bg-accent-100 text-accent-700" : "text-ink hover:bg-accent-100",
                    ].join(" ")}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-6 px-6 py-10">
              <div className="text-[11px] tracking-(--tracking-label) text-faint">
                {t("nav.connect")}
              </div>
              {socialRow}
              <div className="pt-2">{localeSwitch}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}
