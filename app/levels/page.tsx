"use client";

import Link from "next/link";
import { useAppState } from "@/lib/store";
import { levelProgress } from "@/lib/selectors";

const PLANNED: Record<string, number> = {
  Starter: 200,
  A1: 600,
  A2: 900,
  B1: 1200,
  B2: 1600,
};

export default function LevelsPage() {
  const state = useAppState();
  const progress = levelProgress(state);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">等级路线</h1>
        <p className="mt-1 text-sm text-[#182230]/50">
          Starter → B2，共规划约 4500 个 Learning Units（词、词块、搭配、句型）。
          当前 MVP 版本已上线 {progress.reduce((a, p) => a + p.total, 0)} 个。
        </p>
      </div>

      <div className="space-y-3">
        {progress.map((p) => (
          <div
            key={p.level}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{p.level}</p>
                <p className="text-xs text-[#182230]/50 mt-0.5">
                  已上线 {p.total} ・ 规划约 {PLANNED[p.level]} ・ 已学 {p.done}
                </p>
              </div>
              <span className="text-lg font-semibold text-[#C62828]">
                {p.pct}%
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-black/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F4B400] transition-all"
                style={{ width: `${p.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-[#182230]/50">
        课程不完全锁死，你可以随时通过
        <Link href="/library" className="text-[#C62828] hover:underline mx-1">
          词汇库
        </Link>
        学习任意等级的内容。
      </p>
    </div>
  );
}
