"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /contact/ 旧地址的客户端跳转：换到首页，不在历史记录里留下这一页 */
export function ContactRedirect({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [href, router]);
  return null;
}
