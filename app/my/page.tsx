"use client";

import { useMemo, useState } from "react";
import { units } from "@/data/units";
import { removeMySentence, useAppState } from "@/lib/store";
import AudioButton from "@/components/AudioButton";

const TABS = ["收藏", "最近学习", "容易错", "Active", "Passive", "Mastered", "My Sentences"] as const;

export default function MyPage() {
  const state = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]>("收藏");

  const byId = useMemo(() => new Map(units.map((u) => [u.id, u])), []);

  const list = useMemo(() => {
    switch (tab) {
      case "收藏":
        return state.favorites.map((id) => byId.get(id)).filter(Boolean);
      case "最近学习":
        return Object.entries(state.reviews)
          .filter(([, r]) => r.status !== "new")
          .sort((a, b) =>
            (b[1].lastRatedAt ?? "").localeCompare(a[1].lastRatedAt ?? "")
          )
          .slice(0, 50)
          .map(([id]) => byId.get(id))
          .filter(Boolean);
      case "容易错":
        return Object.entries(state.reviews)
          .filter(([, r]) => r.wrongCount > 0)
          .sort((a, b) => b[1].wrongCount - a[1].wrongCount)
          .map(([id]) => byId.get(id))
          .filter(Boolean);
      case "Active":
        return units.filter((u) => state.reviews[u.id]?.status === "active");
      case "Passive":
        return units.filter((u) => {
          const s = state.reviews[u.id]?.status;
          return s === "learning" || s === "review";
        });
      case "Mastered":
        return units.filter((u) => state.reviews[u.id]?.status === "mastered");
      default:
        return [];
    }
  }, [tab, state, byId]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">我的词汇</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              tab === t
                ? "bg-[#C62828] text-white"
                : "bg-white border border-black/10 hover:border-[#C62828]/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "My Sentences" ? (
        <div className="space-y-2">
          {state.mySentences.length === 0 && (
            <p className="text-[#182230]/50 text-sm">
              还没有句子。完成每日学习后的「主动输出」会保存在这里。
            </p>
          )}
          {state.mySentences.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center gap-3"
            >
              <div className="flex-1">
                <p>{m.text}</p>
                <p className="text-xs text-[#182230]/40 mt-1">
                  {m.date.slice(0, 10)}
                </p>
              </div>
              <AudioButton text={m.text} size="sm" />
              <button
                onClick={() => removeMySentence(m.id)}
                className="text-xs text-[#182230]/40 hover:text-[#C62828]"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.length === 0 && (
            <p className="text-[#182230]/50 text-sm">这里还没有内容。</p>
          )}
          {list.map(
            (u) =>
              u && (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center gap-3"
                >
                  <span className="font-medium">{u.spanish}</span>
                  <span className="text-[#182230]/50 text-sm flex-1">
                    {u.chinese}
                  </span>
                  <AudioButton text={u.spanish} size="sm" />
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
