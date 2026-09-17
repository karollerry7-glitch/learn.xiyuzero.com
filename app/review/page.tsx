"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Rating } from "@/types";
import { rateUnit, recordListening, recordRecall, useAppState } from "@/lib/store";
import { dueQueue } from "@/lib/selectors";
import { acceptedForms, checkAnswer } from "@/lib/answer";
import { getFiveD } from "@/data/fived";
import AudioButton from "@/components/AudioButton";
import { useSpeech } from "@/hooks/useSpeech";
import { dueLabel, initialReviewState } from "@/lib/srs";

const RATINGS: { key: Rating; label: string }[] = [
  { key: "again", label: "再来一次" },
  { key: "hard", label: "困难" },
  { key: "good", label: "掌握" },
  { key: "easy", label: "太简单" },
];

// SRS 复习覆盖 5D 维度：含义回忆 / 发音听写 / 词块回忆（轮换）
type Mode = "meaning" | "sound" | "chunk";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const MODE_LABEL: Record<Mode, string> = {
  meaning: "含义回忆",
  sound: "发音听写",
  chunk: "词块回忆",
};

export default function ReviewPage() {
  const state = useAppState();
  const { speak } = useSpeech();
  const queue = useMemo(() => dueQueue(state), [state]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [played, setPlayed] = useState(false);
  const [lastResult, setLastResult] = useState<
    null | "correct" | "close" | "wrong"
  >(null);
  // 防连击：答案刚显示的瞬间，同一次 Enter 的后续事件不应触发默认评分
  const revealedAt = useRef(0);

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
  const fiveD = getFiveD(unit);

  // 5D 词条在三个维度间轮换；无 5D 数据固定为含义回忆
  const mode: Mode = fiveD
    ? (["meaning", "sound", "chunk"] as Mode[])[(hash(unit.id) + idx) % 3]
    : "meaning";

  // 当前题目的标准答案与提示
  const chunkItem =
    mode === "chunk" && fiveD && fiveD.chunks.length > 0
      ? fiveD.chunks[hash(unit.id) % fiveD.chunks.length]
      : null;
  const expected = chunkItem ? chunkItem.spanish : unit.spanish;

  const playTarget = () => {
    speak(expected);
    setPlayed(true);
  };

  const reveal = () => {
    const result = checkAnswer(
      input,
      expected,
      chunkItem ? [] : acceptedForms(unit.spanish, unit.article)
    );
    if (mode === "sound") recordListening(result !== "wrong");
    else recordRecall(unit.id, result);
    setLastResult(result);
    revealedAt.current = Date.now();
    setRevealed(true);
    speak(expected);
  };

  const rate = (r: Rating) => {
    if (Date.now() - revealedAt.current < 400) return;
    rateUnit(unit.id, r);
    setInput("");
    setRevealed(false);
    setPlayed(false);
    setLastResult(null);
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#182230]/50">
            {mode === "meaning" && "看到这个中文，说出西班牙语："}
            {mode === "sound" && "🎧 听发音，写出你听到的西班牙语："}
            {mode === "chunk" && "回忆这个词块的西班牙语："}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4B400]/15 text-[#8a6400]">
            {MODE_LABEL[mode]}
          </span>
        </div>

        {mode === "meaning" && (
          <p className="mt-4 text-2xl font-semibold">{unit.chinese}</p>
        )}
        {mode === "sound" && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={playTarget}
              className="w-20 h-20 rounded-full bg-[#C62828] text-white text-3xl hover:bg-[#a91f1f] transition"
            >
              ▶
            </button>
          </div>
        )}
        {mode === "chunk" && chunkItem && (
          <p className="mt-4 text-2xl font-semibold">{chunkItem.chinese}</p>
        )}

        {!revealed ? (
          <div className="mt-6 space-y-3">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reveal()}
              placeholder={
                mode === "sound" ? "输入你听到的内容…" : "输入西班牙语…"
              }
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg"
            />
            <button
              onClick={reveal}
              disabled={mode === "sound" && !played}
              className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition disabled:opacity-40"
            >
              显示答案
            </button>
            {mode === "sound" && !played && (
              <p className="text-center text-xs text-[#182230]/40">先点击 ▶ 听发音</p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-semibold text-[#C62828]">{expected}</p>
              <AudioButton text={expected} />
            </div>
            {chunkItem && (
              <p className="text-center text-[#182230]/60 text-sm">
                {unit.spanish}（{unit.chinese}）
              </p>
            )}
            <p className="text-center text-[#182230]/60 text-sm">
              {unit.example.spanish} — {unit.example.chinese}
            </p>
            {fiveD && (
              <div className="rounded-xl bg-[#F7F8FA] p-3.5 space-y-1.5">
                {fiveD.grammar.slice(0, 2).map((g, i) => (
                  <p key={i} className="text-xs text-[#182230]/70">· {g}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {RATINGS.map((r) => (
                <button
                  key={r.key}
                  autoFocus={
                    r.key === (lastResult === "wrong" ? "again" : "good")
                  }
                  onClick={() => rate(r.key)}
                  className="py-2.5 rounded-xl border border-black/10 text-sm hover:border-[#C62828] hover:text-[#C62828] transition focus:border-[#C62828] focus:text-[#C62828] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-[#182230]/40">
              按 Enter 继续（{lastResult === "wrong" ? "再来一次" : "掌握"}）
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
