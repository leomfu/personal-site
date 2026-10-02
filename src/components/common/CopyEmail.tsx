"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * 邮箱：地址本身是 mailto 链接，旁边一个「复制」按钮（一键复制，按完显示「已复制」两秒）。
 * 剪贴板 API 不可用（http、老浏览器）时退回到选中文字 + execCommand。
 */
export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      const area = document.createElement("textarea");
      area.value = email;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
    }
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className={className ? `email ${className}` : "email"}>
      <a className="email__addr" href={`mailto:${email}`} aria-label={t("emailAria", { email })}>
        {email}
      </a>
      <button type="button" className="email__copy" onClick={copy} aria-label={t("copyAria")}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          {copied ? (
            <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <>
              <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
              <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" />
            </>
          )}
        </svg>
        <span>{copied ? t("copied") : t("copy")}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? t("copiedStatus") : ""}
      </span>
    </span>
  );
}
