"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hydrate, useAppState, useHydrated } from "@/lib/store";

const NAV = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/learn", label: "今日学习", icon: "📖" },
  { href: "/levels", label: "等级", icon: "🪜" },
  { href: "/library", label: "词汇库", icon: "🔍" },
  { href: "/listening", label: "听力", icon: "🎧" },
  { href: "/review", label: "复习", icon: "🔁" },
  { href: "/my", label: "我的词汇", icon: "⭐" },
  { href: "/stats", label: "学习数据", icon: "📊" },
  { href: "/settings", label: "设置", icon: "⚙️" },
];

const MOBILE_NAV = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/learn", label: "学习", icon: "📖" },
  { href: "/review", label: "复习", icon: "🔁" },
  { href: "/library", label: "词库", icon: "🔍" },
  { href: "/my", label: "我的", icon: "⭐" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useAppState();
  const hydrated = useHydrated();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // 必须等 LocalStorage 恢复完成后再判断，否则刷新会被错误地踢回 Onboarding
    if (hydrated && !state.onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [hydrated, state.onboarded, pathname, router]);

  if (pathname === "/onboarding") return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-[#182230]/40 text-sm">加载中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#182230]">
      {/* Desktop 侧边导航 */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-black/5 p-4">
        <a
          href="https://xiyuzero.com"
          className="flex items-center gap-2 px-3 py-4"
          title="返回主站 xiyuzero.com"
        >
          <span className="text-2xl font-bold text-[#C62828]">西语Zero</span>
          <span className="text-xs text-[#182230]/50 mt-1">Learn</span>
        </a>
        <nav className="mt-4 flex-1 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-[#C62828]/10 text-[#C62828] font-medium"
                    : "text-[#182230]/70 hover:bg-black/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <a
          href="https://xiyuzero.com"
          className="px-3 py-2 text-xs text-[#182230]/40 hover:text-[#C62828]"
        >
          ← 返回主站 xiyuzero.com
        </a>
      </aside>

      {/* 主内容 */}
      <main className="md:ml-60 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">{children}</div>
      </main>

      {/* Mobile 底部导航 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-black/5 flex justify-around py-2 z-50">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                active ? "text-[#C62828] font-medium" : "text-[#182230]/50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
