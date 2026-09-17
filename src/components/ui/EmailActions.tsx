"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * 「写邮件 / 复制地址」两个按钮。复制成功后右边浮出「已复制 ✓」，两秒后消失。
 *
 * 2026-09-17 改版：这两个按钮坐在联系页那张**主色实底大卡**上，所以配色是反过来的 ——
 * 主按钮是白底蓝字，次按钮是一层半透明白。别照抄别处那套蓝底白字，那样会和卡面糊在一起。
 */
export function EmailActions({ email }: { email: string }) {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // 剪贴板权限被拒（多见于 http 环境）：退回选中文本让用户自己复制
      window.prompt(tc("copy"), email);
    }
  };

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <a
        href={`mailto:${email}`}
        className="rounded-full bg-neutral-100 px-[26px] py-3 text-[14px] font-medium text-accent-700 transition-colors hover:bg-white"
      >
        {t("write")} →
      </a>
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer rounded-full bg-white/20 px-[26px] py-3 text-[14px] text-neutral-100 backdrop-blur-sm transition-colors hover:bg-white/30"
      >
        {tc("copy")}
      </button>
      <span
        aria-live="polite"
        className={`self-center text-[12px] text-neutral-100/80 transition-opacity duration-300 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        {tc("copied")}
      </span>
    </div>
  );
}
