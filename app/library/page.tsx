"use client";

import { useMemo, useState } from "react";
import { units } from "@/data/units";
import { Level } from "@/types";
import AudioButton from "@/components/AudioButton";
import VocabularyCard from "@/components/VocabularyCard";
import { useAppState } from "@/lib/store";

const LEVELS: (Level | "全部")[] = ["全部", "Starter", "A1", "A2", "B1", "B2"];

export default function LibraryPage() {
  const state = useAppState();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("全部");
  const [topic, setTopic] = useState("全部");
  const [openId, setOpenId] = useState<string | null>(null);

  const topics = useMemo(
    () => ["全部", ...Array.from(new Set(units.map((u) => u.topic)))],
    []
  );

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return units.filter((u) => {
      if (level !== "全部" && u.level !== level) return false;
      if (topic !== "全部" && u.topic !== topic) return false;
      if (!kw) return true;
      return (
        u.spanish.toLowerCase().includes(kw) ||
        u.lemma.toLowerCase().includes(kw) ||
        u.chinese.includes(kw) ||
        u.topic.includes(kw) ||
        u.wordFamily.some((w) => w.toLowerCase().includes(kw))
      );
    });
  }, [q, level, topic]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">词汇库</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索西班牙语 / 中文 / 主题…"
        className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white focus:border-[#C62828] focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              level === l
                ? "bg-[#C62828] text-white"
                : "bg-white border border-black/10 hover:border-[#C62828]/40"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-3 py-1 rounded-full text-xs transition ${
              topic === t
                ? "bg-[#F4B400] text-[#182230]"
                : "bg-white border border-black/10 hover:border-[#F4B400]/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-sm text-[#182230]/50">共 {results.length} 个 Learning Units</p>

      <div className="space-y-2">
        {results.map((u) => {
          const status = state.reviews[u.id]?.status ?? "new";
          const open = openId === u.id;
          return (
            <div key={u.id}>
              <button
                onClick={() => setOpenId(open ? null : u.id)}
                className="w-full bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center gap-3 text-left hover:border-[#C62828]/30 transition"
              >
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4B400]/15 text-[#8a6400] shrink-0">
                  {u.level}
                </span>
                <span className="font-medium">{u.spanish}</span>
                <span className="text-[#182230]/50 text-sm flex-1 truncate">
                  {u.chinese}
                </span>
                <span className="text-xs text-[#182230]/40 shrink-0">
                  {status === "mastered"
                    ? "🟢 已掌握"
                    : status === "active"
                      ? "🔵 Active"
                      : status !== "new"
                        ? "⚪ Passive"
                        : ""}
                </span>
                <AudioButton text={u.spanish} size="sm" />
              </button>
              {open && (
                <div className="mt-2">
                  <VocabularyCard unit={u} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
