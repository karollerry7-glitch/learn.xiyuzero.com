"use client";

import { useAppState } from "@/lib/store";
import {
  accuracy,
  learnedCount,
  mostWrong,
  recentActivity,
  streakDays,
  totalStudyDays,
  vocabularyCounts,
} from "@/lib/selectors";
import AudioButton from "@/components/AudioButton";

function BarChart({ data }: { data: { date: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-[#C62828]/80"
            style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 4 : 0 }}
            title={`${d.date}: ${d.total}`}
          />
          <span className="text-[10px] text-[#182230]/40">{d.date.slice(3)}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const state = useAppState();
  const counts = vocabularyCounts(state);
  const acc = accuracy(state);
  const wrong = mostWrong(state);

  const stats = [
    { label: "总学习天数", value: totalStudyDays(state) },
    { label: "连续学习", value: `${streakDays(state)} 天` },
    { label: "已学习表达", value: learnedCount(state) },
    { label: "Active", value: counts.active },
    { label: "Passive", value: counts.passive },
    { label: "Mastered", value: counts.mastered },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">学习数据</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 text-center"
          >
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-[#182230]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="font-semibold mb-4">最近 7 天学习量</h2>
        <BarChart data={recentActivity(state, 7)} />
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="font-semibold mb-4">最近 30 天学习量</h2>
        <BarChart data={recentActivity(state, 30)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 text-center">
          <p className="text-2xl font-semibold">
            {acc.recall === null ? "—" : `${acc.recall}%`}
          </p>
          <p className="text-xs text-[#182230]/50 mt-1">
            Chinese → Spanish 正确率
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 text-center">
          <p className="text-2xl font-semibold">
            {acc.listening === null ? "—" : `${acc.listening}%`}
          </p>
          <p className="text-xs text-[#182230]/50 mt-1">Listening 正确率</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="font-semibold mb-3">最容易错的 20 个表达</h2>
        {wrong.length === 0 && (
          <p className="text-sm text-[#182230]/50">目前还没有错题记录 🎉</p>
        )}
        <div className="space-y-2">
          {wrong.map(({ unit, wrong: w }) => (
            <div
              key={unit.id}
              className="flex items-center gap-3 py-1.5 border-b border-black/5 last:border-0"
            >
              <span className="text-xs w-8 text-[#C62828] font-medium">
                ×{w}
              </span>
              <span className="font-medium">{unit.spanish}</span>
              <span className="text-sm text-[#182230]/50 flex-1">
                {unit.chinese}
              </span>
              <AudioButton text={unit.spanish} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
