"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { localized } from "@/lib/format";
import { localePath } from "@/lib/nav";
import type { PostType } from "@/lib/types";

/**
 * 文章列表 —— 改版定稿（docs/design/改版规格.md §6.5）。
 *
 * 顶部筛选按钮组：当前项主按钮，其余次按钮（13px / 8px 20px）。纯前端筛选。
 * 每篇一张玻璃卡，三列 `auto 1fr auto`：
 *   左  58px 宽的日期块 —— 30px 手写的「日」+ 11px 的「月」，颜色 主色 / 橙色 / neutral-600 轮换
 *   中  21px 手写标题 + 14px/1.75 摘要 + 标签行（分类标签 + 标签 + 阅读时长）
 *   右  22px 主色箭头 →
 * hover：整张卡往右挪 8px 并升到 shadow-md。
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

/** 按钮顺序照文案定稿：全部 / 随笔 / 长文 / 想法 */
const FILTERS = ["all", "blog", "essay", "thought"] as const;

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** 日期块那两行：上面是「日」，下面是「N 月」（中）或月份缩写（英） */
function splitDate(date: string, locale: string) {
  const [, m, d] = date.split("-");
  if (!m || !d) return { day: date, month: "" };
  return {
    day: d,
    month: locale === "en" ? MONTHS_SHORT[Number(m) - 1] : `${Number(m)} 月`,
  };
}

/** 日期块三档轮换的颜色（30px 手写大数字，属于大字，可以用主色本体） */
const DATE_TONES = ["text-accent", "text-accent-2", "text-neutral-600"];

/** 分类标签的底色：长文蓝 / 随笔橙 / 想法中性 */
const TYPE_TAG: Record<PostType, string> = {
  essay: "glass-tag",
  blog: "glass-tag-2",
  thought: "glass-tag-neutral",
};

export function BlogList({ posts }: { posts: PostCard[] }) {
  const t = useTranslations("blog");
  const tType = useTranslations("blog.types");
  const locale = useLocale();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const visible = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.type === filter)),
    [filter, posts],
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 text-[13px]">
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={[
                "min-h-11 cursor-pointer rounded-full px-5 py-2 sm:min-h-0",
                active
                  ? "btn-primary-glow bg-accent text-bg"
                  : "glass-soft text-ink transition-colors hover:text-accent-700",
              ].join(" ")}
            >
              {key === "all" ? t("filterAll") : tType(key)}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visible.map((post, i) => {
          const { day, month } = splitDate(post.date, locale);
          return (
            <Reveal key={post.slug} index={i}>
              <Link
                href={localePath(locale, `/blog/${post.slug}`)}
                className="glass grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-5 transition-[transform,box-shadow] duration-[250ms] hover:translate-x-2 hover:shadow-md sm:gap-6 sm:p-6"
              >
                <span className="flex w-[58px] flex-col items-center">
                  <span className={`font-hand text-[30px] leading-none ${DATE_TONES[i % 3]}`}>{day}</span>
                  <span className="text-[11px] tracking-[0.08em] text-ink opacity-55">{month}</span>
                </span>

                <span className="flex min-w-0 flex-col gap-[5px]">
                  <span className="font-hand text-[21px] leading-[1.25] text-ink">
                    {localized(locale, post.title, post.title_en)}
                  </span>
                  <span className="text-[14px] leading-[1.75] text-ink opacity-75">
                    {localized(locale, post.summary, post.summary_en)}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`${TYPE_TAG[post.type]} rounded-full px-[14px] py-[5px] text-[12px]`}>
                      {tType(post.type)}
                    </span>
                    {post.tags.map((tag) => (
                      <span key={tag} className="glass-tag-neutral rounded-full px-[14px] py-[5px] text-[12px]">
                        {tag}
                      </span>
                    ))}
                    <span className="text-[11.5px] text-ink opacity-50">
                      {t("minutes", { minutes: post.minutes })}
                    </span>
                  </span>
                </span>

                <span className="text-[22px] text-accent" aria-hidden>
                  →
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
