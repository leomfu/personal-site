import Link from "next/link";
import { Crab } from "@/components/crab/Crab";
import { routing } from "@/i18n/routing";
import zh from "~/messages/zh.json";
import en from "~/messages/en.json";

/**
 * 404：静态导出会把它写成 out/404.html。
 * 根 layout 不渲染 html/body（骨架在 [locale]/layout.tsx 里），所以这里自带一份，
 * 底色跟站内一致。中英双语并排，因为这时候还不知道访客要哪种语言。
 * 同样不 import globals.css，颜色只能写字面值：值对应 globals.css 里纸面那一套
 * （--wl-paper / --wl-paper-ink / --wl-paper-ink-soft / 纸面强调色，2026-10 第二版），改 token 时记得同步这一份。
 *
 * 门口站着一只戴拳击手套的 Claude 小螃蟹（BRIEF R7，站主海报上的拳击）：进来就出一套拳，点它再出拳、冒气泡。
 * 这一页拿不到 next-intl（不在 [locale] 下面），所以直接读两份字典，气泡和读屏文字都中英并排。
 * 小螃蟹的样式在 components/crab/crab.css，自给自足，不靠 globals.css。
 */
const crabLabel = `${zh.crab.label.boxer} / ${en.crab.label.boxer}`;
const crabLines = (["nothing", "home"] as const).map((k) => `${zh.crab.lines.notFound[k]}\n${en.crab.lines.notFound[k]}`);

export default function NotFound() {
  return (
    <html lang={routing.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          background: "#F5EEE1",
          color: "#221C15",
          fontFamily: "'PingFang SC', system-ui, sans-serif",
        }}
      >
        {/* 戴拳击手套的小螃蟹：约 80px 见方。此页不带 globals.css，位置只能写内联样式 */}
        <span
          data-crab-slot="404"
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: 96, height: 80 }}
        >
          <Crab variant="boxer" size={60} label={crabLabel} lines={crabLines} side="up" />
        </span>
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#221C15",
            fontFamily: "ui-monospace, monospace",
            lineHeight: 1,
          }}
        >
          404
        </span>
        <span style={{ fontSize: 17, color: "#4D4337" }}>
          这里什么都没有 · Nothing here
        </span>
        <span style={{ display: "flex", gap: 18, fontSize: 15 }}>
          <Link
            href="/zh/"
            style={{
              color: "#9A420C",
              textDecoration: "none",
              borderBottom: "1px solid #D2672A",
            }}
          >
            回首页
          </Link>
          <Link
            href="/en/"
            style={{
              color: "#9A420C",
              textDecoration: "none",
              borderBottom: "1px solid #D2672A",
            }}
          >
            Home
          </Link>
        </span>
      </body>
    </html>
  );
}
