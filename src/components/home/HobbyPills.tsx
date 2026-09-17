import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { localePath } from "@/lib/nav";

/**
 * 首页最后一块「爱好」（handoff §6.2.4）—— 999px 胶囊行（摄影 / 唱片），
 * 52px 圆形图标底分别是主色 / 第二主色，行底色对应两档浅底。
 * 原来还有第三条「书影音」，2026-09-17 全站改版第一阶段随书架页一起下线。
 * hover 整行往右挪 6px。
 *
 * 图标是 Lucide 的画法（24×24 网格、stroke-width 2.75、圆头圆角），
 * 但**没有装 lucide 这个包** —— 图标直接把路径写进来就够了，
 * 为几条线引一整个图标库不划算（技术栈也是锁死的，见 CLAUDE.md）。
 *
 * 文字沿用原关于页轨道图那份字典（about.orbit.*）。轨道图本身已经下线，
 * 字典里只留下这里还在用的几个键。
 */

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** lucide `camera` */
function CameraIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/** lucide `disc-3` */
function DiscIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12a6 6 0 0 1 6-6M18 12a6 6 0 0 1-6 6" />
    </svg>
  );
}

const HOBBIES = [
  {
    key: "photos" as const,
    path: "/photos",
    icon: <CameraIcon />,
    row: "bg-accent-100 hover:bg-accent-200",
    badge: "bg-accent text-neutral-100",
  },
  {
    key: "records" as const,
    path: "/records",
    icon: <DiscIcon />,
    row: "bg-accent-2-100 hover:bg-accent-2-200",
    badge: "bg-accent-2 text-neutral-100",
  },
];

export async function HobbyPills({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "about.orbit" });

  return (
    <div className="mt-8 flex flex-col gap-3">
      {HOBBIES.map((hobby) => (
        <Link
          key={hobby.key}
          href={localePath(locale, hobby.path)}
          className={`flex items-center gap-4 rounded-full py-3 pr-7 pl-3 transition-[background-color,transform] duration-300 hover:translate-x-1.5 ${hobby.row}`}
        >
          <span
            className={`flex size-[52px] shrink-0 items-center justify-center rounded-full ${hobby.badge}`}
          >
            {hobby.icon}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[16px] font-medium text-ink">{t(hobby.key)}</span>
            <span className="truncate text-[13px] text-muted">{t(`${hobby.key}Note`)}</span>
          </span>
          <span className="ml-auto shrink-0 text-[18px] text-accent-700">→</span>
        </Link>
      ))}
    </div>
  );
}
