"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LearningUnit, Rating } from "@/types";
import {
  addMySentence,
  learnNewUnit,
  rateUnit,
  recordListening,
  recordRecall,
  useAppState,
} from "@/lib/store";
import { newQueue } from "@/lib/selectors";
import { acceptedForms, checkAnswer } from "@/lib/answer";
import VocabularyCard from "@/components/VocabularyCard";
import AudioButton from "@/components/AudioButton";
import { useSpeech } from "@/hooks/useSpeech";

type Phase = "flash" | "recall" | "listening" | "cloze" | "output" | "done";

const RATINGS: { key: Rating; label: string; hint: string }[] = [
  { key: "again", label: "再来一次", hint: "10 分钟" },
  { key: "hard", label: "困难", hint: "1 天" },
  { key: "good", label: "掌握", hint: "3 天" },
  { key: "easy", label: "太简单", hint: "7 天" },
];

// 从例句生成 Cloze：挖掉目标词（词块取最后一个词）
function makeCloze(unit: LearningUnit): { sentence: string; answer: string } | null {
  const words = unit.spanish.split(/\s+/);
  const target = words[words.length - 1];
  const sentence = unit.example.spanish;
  const idx = sentence.toLowerCase().indexOf(target.toLowerCase());
  if (idx === -1) return null;
  return {
    sentence:
      sentence.slice(0, idx) + "_____" + sentence.slice(idx + target.length),
    answer: target,
  };
}

export default function LearnPage() {
  const state = useAppState();
  const { speak } = useSpeech();

  const queue = useMemo(
    () => newQueue(state).slice(0, state.settings.dailyNew),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.onboarded, state.settings.dailyNew]
  );

  const [phase, setPhase] = useState<Phase>("flash");
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<null | "correct" | "close" | "wrong">(null);
  const [lisIdx, setLisIdx] = useState(0);
  const [lisInput, setLisInput] = useState("");
  const [lisResult, setLisResult] = useState<null | boolean>(null);
  const [clozeIdx, setClozeIdx] = useState(0);
  const [clozeInput, setClozeInput] = useState("");
  const [clozeResult, setClozeResult] = useState<null | boolean>(null);
  const [outputText, setOutputText] = useState("");

  const listeningUnits = useMemo(() => queue.slice(0, 10), [queue]);
  const clozeUnits = useMemo(
    () =>
      queue
        .map((u) => ({ unit: u, cloze: makeCloze(u) }))
        .filter((x): x is { unit: LearningUnit; cloze: { sentence: string; answer: string } } => !!x.cloze)
        .slice(0, 5),
    [queue]
  );
  const outputUnits = useMemo(() => queue.slice(0, 5), [queue]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold">今日新内容已学完</h1>
        <p className="mt-2 text-[#182230]/60">
          当前词库的新表达已经全部学习过了。
        </p>
        <Link
          href="/review"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#C62828] text-white font-medium"
        >
          去复习 →
        </Link>
      </div>
    );
  }

  const unit = queue[idx];

  const startRecall = () => {
    learnNewUnit(unit.id);
    setInput("");
    setFeedback(null);
    setPhase("recall");
  };

  const submitRecall = () => {
    const result = checkAnswer(
      input,
      unit.spanish,
      acceptedForms(unit.spanish, unit.article)
    );
    setFeedback(result);
    recordRecall(unit.id, result);
    speak(unit.spanish);
  };

  const submitRating = (r: Rating) => {
    rateUnit(unit.id, r);
    if (idx + 1 < queue.length) {
      setIdx(idx + 1);
      setPhase("flash");
    } else {
      setPhase("listening");
      const first = listeningUnits[0];
      if (first) setTimeout(() => speak(first.spanish), 400);
    }
  };

  const submitListening = () => {
    const u = listeningUnits[lisIdx];
    const ok =
      checkAnswer(lisInput, u.spanish, acceptedForms(u.spanish, u.article)) !==
      "wrong";
    setLisResult(ok);
    recordListening(ok);
  };

  const nextListening = () => {
    setLisInput("");
    setLisResult(null);
    if (lisIdx + 1 < listeningUnits.length) {
      setLisIdx(lisIdx + 1);
      setTimeout(() => speak(listeningUnits[lisIdx + 1].spanish), 400);
    } else if (clozeUnits.length > 0) {
      setPhase("cloze");
    } else {
      setPhase("output");
    }
  };

  const submitCloze = () => {
    const c = clozeUnits[clozeIdx].cloze;
    const ok = checkAnswer(clozeInput, c.answer) !== "wrong";
    setClozeResult(ok);
  };

  const nextCloze = () => {
    setClozeInput("");
    setClozeResult(null);
    if (clozeIdx + 1 < clozeUnits.length) setClozeIdx(clozeIdx + 1);
    else setPhase("output");
  };

  const saveOutput = () => {
    if (outputText.trim()) {
      addMySentence(outputText.trim(), outputUnits.map((u) => u.id));
    }
    setPhase("done");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-[#182230]/50">
        <span>
          {phase === "flash" || phase === "recall"
            ? `新学习 ${idx + 1} / ${queue.length}`
            : phase === "listening"
              ? `听力 ${lisIdx + 1} / ${listeningUnits.length}`
              : phase === "cloze"
                ? `填空 ${clozeIdx + 1} / ${clozeUnits.length}`
                : phase === "output"
                  ? "主动输出"
                  : "完成"}
        </span>
        <Link href="/" className="hover:text-[#C62828]">
          退出
        </Link>
      </div>

      {phase === "flash" && (
        <div className="space-y-6">
          <VocabularyCard unit={unit} />
          <button
            onClick={startRecall}
            className="w-full py-3.5 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
          >
            我记住了，开始回忆 →
          </button>
        </div>
      )}

      {phase === "recall" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
          <p className="text-sm text-[#182230]/50">Chinese → Spanish 主动回忆</p>
          <p className="mt-4 text-2xl font-semibold">{unit.chinese}</p>
          {feedback === null ? (
            <div className="mt-6 space-y-3">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitRecall()}
                placeholder="输入对应的西班牙语…"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg"
              />
              <button
                onClick={submitRecall}
                className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition"
              >
                检查答案
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div
                className={`p-4 rounded-xl text-center font-medium ${
                  feedback === "correct"
                    ? "bg-green-50 text-green-700"
                    : feedback === "close"
                      ? "bg-[#F4B400]/15 text-[#8a6400]"
                      : "bg-[#C62828]/10 text-[#C62828]"
                }`}
              >
                {feedback === "correct"
                  ? "✓ 完全正确"
                  : feedback === "close"
                    ? "≈ 接近正确（注意拼写）"
                    : "✗ 错误"}
              </div>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-semibold text-[#C62828]">
                  {unit.spanish}
                </p>
                <AudioButton text={unit.spanish} />
              </div>
              <p className="text-center text-[#182230]/60 text-sm">
                {unit.example.spanish} — {unit.example.chinese}
              </p>
              <div className="grid grid-cols-4 gap-2 pt-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => submitRating(r.key)}
                    className="py-2.5 rounded-xl border border-black/10 text-sm hover:border-[#C62828] hover:text-[#C62828] transition"
                  >
                    {r.label}
                    <span className="block text-xs text-[#182230]/40">{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "listening" && listeningUnits[lisIdx] && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
          <p className="text-sm text-[#182230]/50">🎧 听力训练 — 先听，不看文字</p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => speak(listeningUnits[lisIdx].spanish)}
              className="w-20 h-20 rounded-full bg-[#C62828] text-white text-3xl hover:bg-[#a91f1f] transition"
            >
              ▶
            </button>
          </div>
          {lisResult === null ? (
            <div className="mt-6 space-y-3">
              <input
                value={lisInput}
                onChange={(e) => setLisInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitListening()}
                placeholder="输入你听到的西班牙语…"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg"
              />
              <button
                onClick={submitListening}
                className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition"
              >
                检查
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <p className={lisResult ? "text-green-600 font-medium" : "text-[#C62828] font-medium"}>
                {lisResult ? "✓ 听对了" : "✗ 再听几遍"}
              </p>
              <p className="text-2xl font-semibold">{listeningUnits[lisIdx].spanish}</p>
              <p className="text-[#182230]/60">{listeningUnits[lisIdx].chinese}</p>
              <p className="text-sm text-[#182230]/50">
                {listeningUnits[lisIdx].example.spanish} — {listeningUnits[lisIdx].example.chinese}
              </p>
              <button
                onClick={nextListening}
                className="w-full py-3 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
              >
                下一个 →
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "cloze" && clozeUnits[clozeIdx] && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
          <p className="text-sm text-[#182230]/50">Sentence Cloze — 训练搭配与词块</p>
          <p className="mt-6 text-xl text-center leading-relaxed">
            {clozeUnits[clozeIdx].cloze.sentence}
          </p>
          <p className="mt-2 text-center text-[#182230]/50 text-sm">
            {clozeUnits[clozeIdx].unit.example.chinese}
          </p>
          {clozeResult === null ? (
            <div className="mt-6 space-y-3">
              <input
                value={clozeInput}
                onChange={(e) => setClozeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCloze()}
                placeholder="填入缺少的词…"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none text-lg text-center"
              />
              <button
                onClick={submitCloze}
                className="w-full py-3 rounded-xl bg-[#182230] text-white font-medium hover:bg-black transition"
              >
                检查
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-center">
              <p className={clozeResult ? "text-green-600 font-medium" : "text-[#C62828] font-medium"}>
                {clozeResult ? "✓ 正确" : `✗ 答案：${clozeUnits[clozeIdx].cloze.answer}`}
              </p>
              <div className="flex items-center justify-center gap-2">
                <p>{clozeUnits[clozeIdx].unit.example.spanish}</p>
                <AudioButton text={clozeUnits[clozeIdx].unit.example.spanish} size="sm" />
              </div>
              <button
                onClick={nextCloze}
                className="w-full py-3 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
              >
                下一个 →
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "output" && (
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
          <p className="text-sm text-[#182230]/50">主动输出训练</p>
          <p className="mt-4 text-lg">
            请使用至少 3 个今天学到的表达，造一个西班牙语句子：
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {outputUnits.map((u) => (
              <span
                key={u.id}
                className="px-3 py-1.5 rounded-full bg-[#F4B400]/15 text-[#8a6400] text-sm"
              >
                {u.spanish}
              </span>
            ))}
          </div>
          <textarea
            value={outputText}
            onChange={(e) => setOutputText(e.target.value)}
            rows={3}
            placeholder="例如：Mañana estoy ocupado, pero podemos quedar después."
            className="mt-4 w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#C62828] focus:outline-none"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={saveOutput}
              className="flex-1 py-3 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
            >
              保存到我的句子
            </button>
            <button
              onClick={() => setPhase("done")}
              className="px-5 py-3 rounded-xl border border-black/10 text-[#182230]/60 hover:bg-black/5 transition"
            >
              跳过
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center py-16">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-4 text-2xl font-bold">今日学习完成</h1>
          <p className="mt-2 text-[#182230]/60">
            学习了 {queue.length} 个新表达，系统已自动安排复习。
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#C62828] text-white font-medium"
            >
              回到首页
            </Link>
            <Link
              href="/review"
              className="px-6 py-3 rounded-xl border border-[#C62828]/30 text-[#C62828] font-medium"
            >
              继续复习
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
