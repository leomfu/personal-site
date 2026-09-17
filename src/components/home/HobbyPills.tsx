import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { localePath } from "@/lib/nav";

/**
 * 首页最后一块「爱好」（改版规格 §6.2.4）—— 两个 999px 胶囊行：
 *   摄影 → /photos   行底 accent-100，52px 图标圆底主色
 *   唱片 → /records  行底 accent-2-100，图标圆底第二主色（这是音乐页**唯一的入口**）
 * hover 整行往右挪 6px。
 *
 * 图标是 Lucide 的画法（24×24 网格、stroke-width 2.75、圆头圆角），
 * **没有装 lucide 这个包**（技术栈锁死）—— 路径直接写进来。
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

/** lucide `music` */
function MusicIcon() {
  return (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

const HOBBIES = [
  {
    key: "photos" as const,
    path: "/photos",
    icon: <CameraIcon />,
    row: "bg-accent-100",
    badge: "bg-accent",
  },
  {
    key: "records" as const,
    path: "/records",
    icon: <MusicIcon />,
    row: "bg-accent-2-100",
    badge: "bg-accent-2",
  },
];

export async function HobbyPills({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.hobbies" });

  return (
    <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {HOBBIES.map((hobby) => (
        <Link
          key={hobby.key}
          href={localePath(locale, hobby.path)}
          className={`flex items-center gap-4 rounded-full px-6 py-4 transition-transform duration-[250ms] ease-out hover:translate-x-[6px] ${hobby.row}`}
        >
          <span
            className={`flex size-[52px] shrink-0 items-center justify-center rounded-full text-bg ${hobby.badge}`}
          >
            {hobby.icon}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-hand text-[18px] leading-[1.3] text-ink">{t(hobby.key)}</span>
            <span className="text-[12.5px] text-ink opacity-60">{t(`${hobby.key}Note`)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
