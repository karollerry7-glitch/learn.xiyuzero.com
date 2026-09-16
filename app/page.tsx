"use client";

import Link from "next/link";
import { useAppState, todayKey } from "@/lib/store";
import {
  currentLevel,
  dueQueue,
  levelProgress,
  newQueue,
  streakDays,
  vocabularyCounts,
} from "@/lib/selectors";

export default function Dashboard() {
  const state = useAppState();
  const day = state.activity[todayKey()];
  const dailyNew = state.settings.dailyNew;
  const newTotal = Math.min(dailyNew, newQueue(state).length);
  const dueTotal = dueQueue(state).length;
  const counts = vocabularyCounts(state);
  const streak = streakDays(state);
  const progress = levelProgress(state);

  const tasks = [
    { label: "新表达", done: day?.newLearned ?? 0, total: newTotal },
    { label: "待复习", done: day?.reviewed ?? 0, total: dueTotal },
    { label: "听力", done: day?.listening ?? 0, total: Math.min(10, newTotal + dueTotal) },
    { label: "主动输出", done: day?.output ?? 0, total: 5 },
  ];
  const todayDone = tasks.reduce((a, t) => a + Math.min(t.done, t.total), 0);
  const todayTotal = tasks.reduce((a, t) => a + t.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hola 👋</h1>
        <p className="mt-1 text-[#182230]/60">今天继续学习西班牙语。</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#182230]/50">当前等级</p>
            <p className="text-2xl font-semibold text-[#C62828]">
              {currentLevel(state)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#182230]/50">连续学习</p>
            <p className="text-2xl font-semibold">🔥 {streak} 天</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {tasks.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <span className="w-20 text-sm text-[#182230]/70">{t.label}</span>
              <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C62828] transition-all"
                  style={{
                    width: t.total ? `${Math.min(100, (t.done / t.total) * 100)}%` : "0%",
                  }}
                />
              </div>
              <span className="w-14 text-right text-sm tabular-nums text-[#182230]/60">
                {Math.min(t.done, t.total)} / {t.total}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-[#182230]/50">
          今日进度：{todayDone} / {todayTotal}
        </p>

        <div className="mt-5 flex gap-3">
          <Link
            href="/learn"
            className="flex-1 text-center py-3 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
          >
            开始今日学习
          </Link>
          <Link
            href="/review"
            className="px-5 py-3 rounded-xl border border-[#C62828]/30 text-[#C62828] font-medium hover:bg-[#C62828]/5 transition"
          >
            复习 ({dueTotal})
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: counts.active, desc: "能主动调用" },
          { label: "Passive", value: counts.passive, desc: "能识别" },
          { label: "Mastered", value: counts.mastered, desc: "已掌握" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 text-center"
          >
            <p className="text-xs text-[#182230]/50">{c.label}</p>
            <p className="text-2xl font-semibold mt-1">{c.value}</p>
            <p className="text-xs text-[#182230]/40 mt-0.5">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">等级路线</h2>
          <Link href="/levels" className="text-sm text-[#C62828] hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-3">
          {progress.map((p) => (
            <div key={p.level} className="flex items-center gap-3">
              <span className="w-14 text-sm font-medium">{p.level}</span>
              <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F4B400] transition-all"
                  style={{ width: `${p.pct}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm text-[#182230]/60">
                {p.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
