import Link from "next/link";
import { routing } from "@/i18n/routing";

/**
 * 404：静态导出会把它写成 out/404.html。
 * 根 layout 不渲染 html/body（骨架在 [locale]/layout.tsx 里），所以这里自带一份，
 * 底色跟站内一致。中英双语并排，因为这时候还不知道访客要哪种语言。
 * 同样不 import globals.css，颜色只能写字面值：值对应 globals.css 里纸面那一套
 * （--wl-paper / --wl-paper-ink / --wl-paper-ink-soft / 纸面强调色，2026-10 第二版），改 token 时记得同步这一份。
 */
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
        {/* 给 404 的小螃蟹（拳击手套，BRIEF R7）预留的位置：约 80px 见方，另一位代理放进来。此页不带 globals.css，所以只能是内联样式 */}
        <span
          data-crab-slot="404"
          style={{ display: "block", width: 80, height: 80 }}
        />
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
