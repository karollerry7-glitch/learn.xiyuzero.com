"use client";

import { useState } from "react";
import Link from "next/link";
import { Rating } from "@/types";
import { rateUnit, recordRecall, useAppState } from "@/lib/store";
import { dueQueue } from "@/lib/selectors";
import { acceptedForms, checkAnswer } from "@/lib/answer";
import AudioButton from "@/components/AudioButton";
import { useSpeech } from "@/hooks/useSpeech";
import { dueLabel, initialReviewState } from "@/lib/srs";

const RATINGS: { key: Rating; label: string }[] = [
  { key: "again", label: "再来一次" },
  { key: "hard", label: "困难" },
  { key: "good", label: "掌握" },
  { key: "easy", label: "太简单" },
];

export default function ReviewPage() {
  const state = useAppState();
  const { speak } = useSpeech();
  const queue = dueQueue(state);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (queue.length === 0 || idx >= queue.length) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">
          {queue.length === 0 ? "现在没有到期复习" : "本轮复习完成"}
        </h1>
        <p className="mt-2 text-[#182230]/60">
          SRS 会在合适的时间提醒你回来复习。
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#C62828] text-white font-medium"
        >
          回到首页
        </Link>
      </div>
    );
  }

  const unit = queue[idx];
  const review = state.reviews[unit.id] ?? initialReviewState();

  const reveal = () => {
    const result = checkAnswer(
      input,
      unit.spanish,
      acceptedForms(unit.spanish, unit.article)
    );
    recordRecall(unit.id, result);
    setRevealed(true);
    speak(unit.spanish);
  };

  const rate = (r: Rating) => {
    rateUnit(unit.id, r);
    setInput("");
    setRevealed(false);
    setIdx(idx + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-[#182230]/50">
        <span>
          复习 {idx + 1} / {queue.length}
        </span>
        <span>下次到期：{dueLabel(review)}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
        <p className="text-sm text-[#182230]/50">看到这个中文，说出西班牙语：</p>
        <p className="mt-4 text-2xl font-semibold">{unit.chinese}</p>

        {!revealed ? (
          <div className="mt-6 space-y-3">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reveal()}
              placeholder="输入西班牙语…"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg"
            />
            <button
              onClick={reveal}
              className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition"
            >
              显示答案
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-semibold text-[#C62828]">{unit.spanish}</p>
              <AudioButton text={unit.spanish} />
            </div>
            <p className="text-center text-[#182230]/60 text-sm">
              {unit.example.spanish} — {unit.example.chinese}
            </p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => rate(r.key)}
                  className="py-2.5 rounded-xl border border-black/10 text-sm hover:border-[#C62828] hover:text-[#C62828] transition"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
