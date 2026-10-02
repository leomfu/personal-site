"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { localized } from "@/lib/format";
import { localePath } from "@/lib/nav";
import type { PostType } from "@/lib/types";

/**
 * 文章列表：顶部按类型筛（全部 / 随笔 / 长文 / 想法，纯前端），下面一篇一行，
 * 像书架上的书脊：日期、标题、摘要、类型和阅读时长、标签。
 *
 * 这里刻意不用引擎的 data-sc-in：筛选会换掉列表里的元素，引擎只在挂载时认得那一批，
 * 新换上来的会一直停在透明。整块列表跟着页头一起出现就够了。
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
    <div className="bloglist">
      <div className="filters" role="group" aria-label={t("filterLabel")}>
        {FILTERS.map((key) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={active}
              className={active ? "filter is-active" : "filter"}
            >
              {key === "all" ? t("filterAll") : tType(key)}
            </button>
          );
        })}
      </div>

      <div
        className="bloglist__sheet scrap"
        style={{ "--tilt": "-0.4deg" } as CSSProperties}
      >
        <span className="tape tape--orange" aria-hidden />
        <div className="scrap__paper deckle bloglist__paper">
          <ol className="spines spines--page">
            {visible.map((post) => (
              <li key={post.slug}>
                <Link
                  href={localePath(locale, `/blog/${post.slug}`)}
                  className="spine"
                >
                  <span className="spine__date mono">{post.date}</span>
                  <span className="spine__title">
                    {localized(locale, post.title, post.title_en)}
                  </span>
                  <span className="spine__summary">
                    {localized(locale, post.summary, post.summary_en)}
                  </span>
                  <span className="spine__meta mono">
                    {tType(post.type)} ·{" "}
                    {t("minutes", { minutes: post.minutes })}
                    {post.tags.length > 0 && ` · ${post.tags.join(" / ")}`}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {visible.length === 0 && <p className="bloglist__empty">{t("empty")}</p>}
    </div>
  );
}
