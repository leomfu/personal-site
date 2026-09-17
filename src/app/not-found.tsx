import Link from "next/link";
import { routing } from "@/i18n/routing";

/**
 * 404 —— 静态导出会把它写成 out/404.html。
 * 根 layout 不渲染 html/body（骨架在 [locale]/layout.tsx 里），所以这里自带一份，
 * 底色跟站内一致。中英双语并排，因为这时候还不知道访客要哪种语言。
 * 同样不 import globals.css，颜色只能写字面值：值分别对应
 * --color-bg / --color-ink / --color-faint / --color-muted / --color-accent-700 /
 * --color-accent-300，改 token 时记得同步这一份。
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
          background: "#EDF1F7",
          color: "#171B22",
          fontFamily: "'PingFang SC', system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.3em", color: "#78818F" }}>
          404
        </span>
        <span style={{ fontSize: 15, color: "#5B636F" }}>
          这里什么都没有 · Nothing here
        </span>
        <span style={{ display: "flex", gap: 18, fontSize: 13 }}>
          <Link href="/zh/" style={{ color: "#2A4A95", textDecoration: "none", borderBottom: "1px solid #B8CCF5" }}>
            回首页
          </Link>
          <Link href="/en/" style={{ color: "#2A4A95", textDecoration: "none", borderBottom: "1px solid #B8CCF5" }}>
            Home
          </Link>
        </span>
      </body>
    </html>
  );
}
