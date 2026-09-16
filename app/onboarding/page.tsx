"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/store";
import { Level } from "@/types";

const GOALS = ["综合西班牙语", "旅行", "海外生活", "朋友社交", "工作/商务", "DELE"];
const LEVELS: { value: Level; label: string }[] = [
  { value: "Starter", label: "0 基础" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(GOALS[0]);
  const [level, setLevel] = useState<Level>("Starter");

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-black/5 p-8">
        {step === 0 && (
          <div className="text-center">
            <p className="text-sm text-[#C62828] font-medium">欢迎来到</p>
            <h1 className="mt-2 text-4xl font-bold">西语Zero Learn</h1>
            <p className="mt-4 text-[#182230]/60 leading-relaxed">
              不是记住更多单词。
              <br />
              而是真正把西班牙语说出来。
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-8 w-full py-3.5 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
            >
              开始学习
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold">你的目标是什么？</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`py-3 rounded-xl border text-sm font-medium transition ${
                    goal === g
                      ? "border-[#C62828] bg-[#C62828]/10 text-[#C62828]"
                      : "border-black/10 hover:border-[#C62828]/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="mt-8 w-full py-3.5 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold">你目前的水平？</h2>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={`py-3 rounded-xl border text-sm font-medium transition ${
                    level === l.value
                      ? "border-[#C62828] bg-[#C62828]/10 text-[#C62828]"
                      : "border-black/10 hover:border-[#C62828]/40"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#182230]/50">
              0 基础将从 Starter 阶段开始。
            </p>
            <button
              onClick={() => {
                completeOnboarding(level, goal);
                router.replace("/");
              }}
              className="mt-8 w-full py-3.5 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#a91f1f] transition"
            >
              完成，开始学习 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
