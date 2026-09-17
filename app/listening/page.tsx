"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { units } from "@/data/units";
import { recordListening, useAppState } from "@/lib/store";
import { acceptedForms, checkAnswer } from "@/lib/answer";
import { useSpeech } from "@/hooks/useSpeech";

export default function ListeningPage() {
  const state = useAppState();
  const { speak } = useSpeech();

  // 优先练习已学过的；一个都没学过则用全部
  const pool = useMemo(() => {
    const learned = units.filter(
      (u) => (state.reviews[u.id]?.status ?? "new") !== "new"
    );
    const base = learned.length >= 5 ? learned : units;
    return [...base].sort(() => Math.random() - 0.5).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<"choice" | "type">("type");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [done, setDone] = useState(false);
  // 防连击：判定刚出现的瞬间，同一次 Enter 的后续事件不应触发"下一个"
  const judgedAt = useRef(0);

  const unit = pool[idx];

  const choices = useMemo(() => {
    if (!unit) return [];
    const others = pool
      .filter((u) => u.id !== unit.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [...others, unit].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!unit) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl">🎧</p>
        <p className="mt-4 text-[#182230]/60">词库为空。</p>
      </div>
    );
  }

  const judge = (ok: boolean) => {
    setResult(ok);
    judgedAt.current = Date.now();
    recordListening(ok);
  };

  const next = () => {
    if (Date.now() - judgedAt.current < 400) return;
    setResult(null);
    setInput("");
    if (idx + 1 < pool.length) {
      setIdx(idx + 1);
      setTimeout(() => speak(pool[idx + 1].spanish), 400);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold">听力训练完成</h1>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#C62828] text-white font-medium"
        >
          回到首页
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-[#182230]/50">
        <span>
          🎧 听力 {idx + 1} / {pool.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("type")}
            className={`px-3 py-1 rounded-full text-xs ${mode === "type" ? "bg-[#C62828] text-white" : "bg-black/5"}`}
          >
            听写
          </button>
          <button
            onClick={() => setMode("choice")}
            className={`px-3 py-1 rounded-full text-xs ${mode === "choice" ? "bg-[#C62828] text-white" : "bg-black/5"}`}
          >
            选意思
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
        <div className="flex justify-center">
          <button
            onClick={() => speak(unit.spanish)}
            className="w-20 h-20 rounded-full bg-[#C62828] text-white text-3xl hover:bg-[#a91f1f] transition"
          >
            ▶
          </button>
        </div>

        {result === null && mode === "type" && (
          <div className="mt-6 space-y-3">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                judge(
                  checkAnswer(input, unit.spanish, acceptedForms(unit.spanish, unit.article)) !==
                    "wrong"
                )
              }
              placeholder="输入你听到的西班牙语…"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg"
            />
            <button
              onClick={() =>
                judge(
                  checkAnswer(input, unit.spanish, acceptedForms(unit.spanish, unit.article)) !==
                    "wrong"
                )
              }
              className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition"
            >
              检查
            </button>
          </div>
        )}

        {result === null && mode === "choice" && (
          <div className="mt-6 grid grid-cols-1 gap-2">
            {choices.map((c) => (
              <button
                key={c.id}
                onClick={() => judge(c.id === unit.id)}
                className="py-3 rounded-xl border border-black/10 hover:border-[#C62828] transition"
              >
                {c.chinese}
              </button>
            ))}
          </div>
        )}

        {result !== null && (
          <div className="mt-6 space-y-4 text-center">
            <p className={result ? "text-green-600 font-medium" : "text-[#C62828] font-medium"}>
              {result ? "✓ 正确" : "✗ 不对，再听一遍"}
            </p>
            <p className="text-2xl font-semibold">{unit.spanish}</p>
            <p className="text-[#182230]/60">{unit.chinese}</p>
            <p className="text-sm text-[#182230]/50">
              {unit.example.spanish} — {unit.example.chinese}
            </p>
            <button
              autoFocus
              onClick={next}
              className="w-full py-3 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition focus:outline-none focus:ring-2 focus:ring-[#C62828]/30"
            >
              下一个 →（Enter）
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
