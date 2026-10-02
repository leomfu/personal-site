import { routing } from "@/i18n/routing";

/**
 * 根路径 /：跳到默认语言。
 * 静态导出不能用 middleware / redirect()，所以这里输出一张最小的跳转页
 * （meta refresh + location.replace 双保险，禁用 JS 也能走）。
 * 底色跟站内一致（近黑 #0A0C0F，2026-10 改版），跳转过程中不会闪色。
 */
export default function RootRedirectPage() {
  const target = `/${routing.defaultLocale}/`;

  return (
    <html lang={routing.defaultLocale}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      {/* 这一页自带 html/body，不 import globals.css，所以拿不到 CSS 变量，
          颜色只能写字面值。值 = --sc-canvas / --sc-accent（globals.css），改 token 时记得同步。 */}
      <body style={{ margin: 0, background: "#0A0C0F" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `location.replace(${JSON.stringify(target)})`,
          }}
        />
        <noscript>
          <a href={target} style={{ color: "#E8A23A", fontFamily: "system-ui" }}>
            进入 / Enter
          </a>
        </noscript>
      </body>
    </html>
  );
}
