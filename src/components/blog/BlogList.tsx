"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { localized, yearOf } from "@/lib/format";
import { localePath } from "@/lib/nav";
import type { PostType } from "@/lib/types";

/**
 * 文章列表 —— 2026-09-17 改版重做（handoff §6.5）。
 *
 * 每篇一张玻璃卡，内部三列 `auto 1fr auto`：
 *   左  58px 的日期块 —— 30px 手写的「日」压在 11px 的「月」上面，
 *       颜色按 主色 / 橙色 / neutral-600 三档轮换（`i % 3`），一列卡因此有节奏
 *   中  21px 手写标题 + 14px/1.75 摘要 + 标签行（分类 + 阅读时长）
 *   右  22px 的主色箭头
 * hover：整张卡往右挪 8px 并升到 shadow-md。
 *
 * 全部/博客/长文/想法 四个筛选仍然是纯前端的（文章总量不大，构建时全给到客户端）。
 * 年份变化时在卡外插一条分隔行 —— 年份本来就不是一条内容，不该挤进卡里。
 */

export type PostCard = {
  slug: string;
  title: string;
  title_en?: string;
  summary: string;
  summary_en?: string;
  date: string;
  type: PostType;
  tags: string[];
  minutes: number;
};

const FILTERS = ["all", "blog", "essay", "thought"] as const;

const MONTHS_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/** 日期块那两行：上面是「日」，下面是月份缩写（英）或「N 月」（中） */
function splitDate(date: string, locale: string) {
  const [, m, d] = date.split("-");
  if (!m || !d) return { day: date, month: "" };
  return {
    day: d,
    month: locale === "en" ? MONTHS_SHORT[Number(m) - 1] : `${Number(m)} 月`,
  };
}

/** 日期块三档轮换的颜色 */
const DATE_TONES = ["text-accent", "text-accent-2", "text-neutral-600"];

export function BlogList({ posts }: { posts: PostCard[] }) {
  const t = useTranslations("blog");
  const tType = useTranslations("blog.types");
  const locale = useLocale();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const visible = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.type === filter)),
    [filter, posts],
  );

  /** 按年份把连续的条目揉成一组 */
  const groups = useMemo(() => {
    const list: { year: string; items: PostCard[] }[] = [];
    for (const post of visible) {
      const year = yearOf(post.date);
      const current = list[list.length - 1];
      if (current && current.year === year) current.items.push(post);
      else list.push({ year, items: [post] });
    }
    return list;
  }, [visible]);

  return (
    <>
      {/* 筛选 + 排序说明 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5 text-[13px]">
          {FILTERS.map((key) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={
                  active
                    ? "btn-primary-glow cursor-pointer rounded-full bg-accent px-5 py-2 font-medium text-neutral-100"
                    : "glass-soft cursor-pointer rounded-full px-5 py-2 text-muted transition-colors hover:text-accent-700"
                }
              >
                {key === "all" ? t("filterAll") : tType(key)}
              </button>
            );
          })}
        </div>
        <span className="text-[12px] tracking-[0.06em] text-faint">{t("order")}</span>
      </div>

      {/* 条目 */}
      <div className="mt-8 flex flex-col gap-10">
        {visible.length === 0 && (
          <p className="py-10 text-[15px] leading-[1.9] text-muted">{t("empty")}</p>
        )}

        {groups.map(({ year, items }, gi) => (
          <div key={year + gi}>
            {gi > 0 && (
              <div className="flex items-center gap-[30px] pb-4">
                <span className="text-[12px] tracking-(--tracking-label) text-faint">{year}</span>
                <span className="h-px grow border-t border-dashed border-line" />
              </div>
            )}

            <div className="flex flex-col gap-4">
              {items.map((post, i) => {
                const { day, month } = splitDate(post.date, locale);
                return (
                  <Reveal key={post.slug} index={i}>
                    <Link
                      href={localePath(locale, `/blog/${post.slug}`)}
                      className="card-face grid grid-cols-[58px_1fr_auto] items-start gap-5 p-6 transition-[transform,box-shadow] duration-300 hover:translate-x-2 hover:shadow-md sm:gap-7 sm:p-8"
                    >
                      <span className="flex flex-col items-center">
                        <span
                          className={`font-hand text-[30px] leading-none ${DATE_TONES[i % 3]}`}
                        >
                          {day}
                        </span>
                        <span className="mt-1 text-[11px] tracking-[0.1em] text-faint">
                          {month}
                        </span>
                      </span>

                      <span className="flex min-w-0 flex-col gap-2">
                        <span className="font-hand text-[21px] leading-[1.35] text-ink">
                          {localized(locale, post.title, post.title_en)}
                        </span>
                        <span className="text-[14px] leading-[1.75] text-body">
                          {localized(locale, post.summary, post.summary_en)}
                        </span>
                        <span className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="tag-framed">{tType(post.type)}</span>
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-neutral-200 px-[12px] py-[4px] text-[11.5px] text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="text-[11.5px] text-faint">
                            {t("minutes", { minutes: post.minutes })}
                          </span>
                        </span>
                      </span>

                      <span className="self-center text-[22px] text-accent" aria-hidden>
                        →
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
