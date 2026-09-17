"use client";

import { useEffect, useRef, useState } from "react";
import { FiveD, LearningUnit } from "@/types";
import AudioButton from "./AudioButton";
import { useSpeech } from "@/hooks/useSpeech";

// ============================================================
// 5D 逐步学习卡：Listen → Meaning → Grammar → Chunk → Sentence
// 一次只展示一个维度，避免认知负担
// ============================================================

const STEPS = [
  { key: "sound", label: "发音" },
  { key: "meaning", label: "含义" },
  { key: "grammar", label: "语法" },
  { key: "chunk", label: "词块" },
  { key: "sentence", label: "例句" },
] as const;

export default function FiveDLearn({
  unit,
  fiveD,
  onReady,
}: {
  unit: LearningUnit;
  fiveD: FiveD;
  onReady: () => void; // 5 步完成 → 进入 Chinese→Spanish 回忆
}) {
  const [step, setStep] = useState(0);
  const { speak } = useSpeech();
  // 防连击：同一次 Enter 的后续事件不应连续跳步
  const advancedAt = useRef(0);

  const goNext = () => {
    if (Date.now() - advancedAt.current < 400) return;
    advancedAt.current = Date.now();
    if (last) onReady();
    else setStep(step + 1);
  };

  // 进入卡片自动播放发音
  useEffect(() => {
    const t = setTimeout(() => speak(unit.spanish), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  const last = step === STEPS.length - 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
      {/* 顶部：等级/主题 + 5D 进度点 */}
      <div className="flex items-center justify-between text-sm text-[#182230]/60">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#F4B400]/15 text-[#8a6400] font-medium">
            {unit.level}
          </span>
          <span>{unit.topic}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              title={s.label}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-[#C62828]"
                  : i < step
                    ? "w-2 bg-[#C62828]/40"
                    : "w-2 bg-black/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* D2 Sound：发音 + 重音（第一步先听） */}
      {step === 0 && (
        <div className="mt-8 text-center space-y-5">
          <p className="text-sm text-[#182230]/50">① 先听发音，注意重音</p>
          <div className="flex items-center justify-center gap-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#182230]">
              {unit.spanish}
            </h2>
            <AudioButton text={unit.spanish} size="lg" />
          </div>
          <div className="inline-block px-5 py-3 rounded-xl bg-[#F7F8FA]">
            <p className="text-lg font-medium tracking-wider text-[#C62828]">
              {fiveD.sound.syllables}
            </p>
            <p className="mt-1 text-sm text-[#182230]/60">{fiveD.sound.stress}</p>
          </div>
          <p className="text-sm text-[#182230]/40">点击 🔊 重听，可以跟读几遍</p>
        </div>
      )}

      {/* D1 Meaning：只给最常用的一个意思 */}
      {step === 1 && (
        <div className="mt-8 text-center space-y-5">
          <p className="text-sm text-[#182230]/50">② 它最常用的意思</p>
          <p className="text-2xl text-[#182230]/70">{unit.spanish}</p>
          <p className="text-4xl font-bold text-[#182230]">{fiveD.meaning}</p>
          <p className="text-sm text-[#182230]/40">
            先记住这一个意思就够，其他含义以后遇到再扩展
          </p>
        </div>
      )}

      {/* D3 Grammar：冠词 / 阴阳性 / 词性 / 必要语法 */}
      {step === 2 && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-[#182230]/50 text-center">③ 必须知道的语法</p>
          <div className="space-y-2.5 max-w-md mx-auto">
            {fiveD.grammar.map((g, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F7F8FA]"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#182230] text-white text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <p className="text-[15px] text-[#182230]/85 leading-relaxed">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D4 Chunk：高频搭配/词块（全部可听） */}
      {step === 3 && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-[#182230]/50 text-center">
            ④ 它经常和这些词一起出现
          </p>
          <div className="space-y-2.5 max-w-md mx-auto">
            {fiveD.chunks.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#C62828]/15 bg-[#C62828]/[0.03]"
              >
                <div>
                  <p className="font-medium text-[#C62828]">{c.spanish}</p>
                  <p className="text-sm text-[#182230]/60">{c.chinese}</p>
                </div>
                <AudioButton text={c.spanish} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D5 Sentence：真实高频例句（全部可听） */}
      {step === 4 && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-[#182230]/50 text-center">
            ⑤ 放进真实句子里
          </p>
          <div className="space-y-2.5 max-w-md mx-auto">
            {fiveD.sentences.map((s, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#F7F8FA]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg text-[#182230]">{s.spanish}</p>
                  <AudioButton text={s.spanish} size="sm" />
                </div>
                <p className="mt-1 text-[#182230]/60">{s.chinese}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-5 py-3.5 rounded-xl border border-black/10 text-[#182230]/60 hover:bg-black/5 transition"
          >
            ← 上一步
          </button>
        )}
        <button
          key={step}
          autoFocus
          onClick={goNext}
          className="flex-1 py-3.5 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition focus:outline-none focus:ring-2 focus:ring-[#C62828]/30"
        >
          {last ? "我学会了，开始主动回忆 →" : `下一步：${STEPS[step + 1].label} →（Enter）`}
        </button>
      </div>
    </div>
  );
}
