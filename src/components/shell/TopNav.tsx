"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { NAV_HOME, NAV_TOP, localePath, type NavItem } from "@/lib/nav";
import { siteConfig } from "~/site.config";

/**
 * 顶栏 —— 改版定稿「左右分立」（docs/design/改版规格.md §6.1）。
 *
 *   左   品牌：双色错版 logo + 「伟良」（margin-right:auto 把其余推到右边）
 *   右   八项导航 + 中/EN 胶囊
 *   底   一条 2px 的**渐变下法线**：主色从左侧渐退到右侧透明（globals.css 的 .nav-split）
 *
 * ⚠️ 顶栏本身**透明无底**（不毛玻璃、无阴影），所以它**不 fixed**，跟着页面一起滚走 ——
 * 一条没有底的横条钉在视窗上，内容滚到它下面就糊成一团。
 *
 * 品牌标记「双色错版」：同一张 logo 用 CSS mask 印两遍，橙的那枚在 left:5 top:10、
 * opacity .75，蓝的那枚在 left:10 top:5。用 mask 而不是两张彩色图，颜色跟着 token 走。
 *
 * 断点沿用原来的：<lg 汉堡 + 全屏抽屉；lg 起导航平铺。
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

  /** 一条导航项：13px、字距 .04em、常态 opacity .78。当前项下方一条 2.5px 主色短横（左右内缩 14px） */
  const renderLink = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.key}
        href={localePath(locale, item.path)}
        aria-current={active ? "page" : undefined}
        className={[
          "relative rounded-full px-[14px] py-[7px] text-[13px] tracking-[0.04em] text-ink transition-[opacity,background-color] duration-200 hover:bg-accent-100 hover:opacity-100",
          active ? "opacity-100" : "opacity-[0.78]",
        ].join(" ")}
      >
        {t(`nav.${item.key}`)}
        {active && (
          <span
            className="absolute inset-x-[14px] bottom-[2px] h-[2.5px] origin-left rounded-full bg-accent motion-safe:animate-[wlBar_.32s_ease]"
            aria-hidden
          />
        )}
      </Link>
    );
  };

  /**
   * 中 / EN —— 胶囊组，选中那一枚实色主色填充 + 底色文字 + 700 字重，未选中 opacity .5。
   * ⚠️ 当前语言那一侧的 href 是 `"#"`（空操作），**不是首页**：
   * 写成 homeHref 的话在 /zh/blog/ 上点「中」会被踢回首页。
   * 抽屉里那一份放大到 44px 高（手机触摸目标下限）。
   */
  const localeSwitch = (large: boolean) => (
    <span
      className={`glass-soft flex w-fit items-center gap-[2px] rounded-full p-[5px] tracking-[0.06em] ${
        large ? "text-[14px]" : "text-[12px]"
      }`}
    >
      {(["zh", "en"] as const).map((code) => {
        const current = locale === code;
        return (
          <Link
            key={code}
            href={current ? "#" : otherLocaleHref}
            aria-current={current ? "true" : undefined}
            className={[
              "rounded-full",
              large ? "flex min-h-[34px] min-w-[52px] items-center justify-center px-4" : "px-[11px] py-[3px]",
              current
                ? "bg-accent font-bold text-bg"
                : "text-ink opacity-50 transition-opacity hover:opacity-100",
            ].join(" ")}
          >
            {t(`common.${code}`)}
          </Link>
        );
      })}
    </span>
  );

  return (
    <>
      {/* 透明无底：没有 bg / shadow / backdrop-filter，这是刻意的。底部那条渐变线在 .nav-split::after */}
      <header className="w-full">
        <div className="nav-split mx-auto flex w-full max-w-page flex-wrap items-center gap-x-[13.2px] gap-y-3 px-6 py-[23px]">
          {/* 左：品牌 */}
          <Link
            href={homeHref}
            aria-label={t("nav.toHome")}
            className="group mr-auto flex shrink-0 items-center gap-2.5"
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

          {/* 右：导航组 + 语言切换（桌面端） */}
          <nav className="hidden flex-wrap items-center gap-[2px] lg:flex">{NAV_TOP.map(renderLink)}</nav>
          <span className="hidden lg:flex">{localeSwitch(false)}</span>

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
            <div className="flex items-center justify-between px-6 py-[23px]">
              <span className="text-[19px] tracking-[0.08em]">{name}</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={t("nav.close")}
                className="-mr-1 flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-100"
              >
                <CloseIcon />
              </button>
            </div>

            <nav className="flex flex-col gap-2 px-6 pt-2" onClick={() => setDrawerOpen(false)}>
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

            <div className="px-6 py-10">{localeSwitch(true)}</div>
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
