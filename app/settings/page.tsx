"use client";

import { useState } from "react";
import { resetAll, updateSettings, useAppState } from "@/lib/store";
import { Level } from "@/types";

const DAILY = [10, 15, 20, 25, 30];
const TARGETS: Level[] = ["A1", "A2", "B1", "B2"];
const RATES = [0.7, 0.85, 1.0];
const TRACKS = ["Travel Spanish", "Social Spanish", "Business Spanish"];

export default function SettingsPage() {
  const state = useAppState();
  const s = state.settings;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">每日新学习数量</h2>
        <div className="flex gap-2">
          {DAILY.map((n) => (
            <button
              key={n}
              onClick={() => updateSettings({ dailyNew: n })}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                s.dailyNew === n
                  ? "bg-[#C62828] text-white"
                  : "border border-black/10 hover:border-[#C62828]/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">学习目标</h2>
        <div className="flex gap-2">
          {TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => updateSettings({ targetLevel: t })}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                s.targetLevel === t
                  ? "bg-[#C62828] text-white"
                  : "border border-black/10 hover:border-[#C62828]/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">发音口音</h2>
        <div className="flex gap-2">
          {(
            [
              { v: "es-MX", label: "🇲🇽 México" },
              { v: "es-ES", label: "🇪🇸 España" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              onClick={() => updateSettings({ voiceLocale: o.v })}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                s.voiceLocale === o.v
                  ? "bg-[#C62828] text-white"
                  : "border border-black/10 hover:border-[#C62828]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <h2 className="font-semibold pt-2">音色</h2>
        <div className="flex gap-2">
          {(
            [
              { v: "female", label: "女声 · Dalia / Elvira" },
              { v: "male", label: "男声 · Jorge / Álvaro" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              onClick={() => updateSettings({ voiceGender: o.v })}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                s.voiceGender === o.v
                  ? "bg-[#C62828] text-white"
                  : "border border-black/10 hover:border-[#C62828]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#182230]/50">
          使用微软神经网络真人级发音（云端合成）。网络异常时自动回退浏览器发音。
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">语速</h2>
        <div className="flex gap-2">
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => updateSettings({ rate: r })}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                s.rate === r
                  ? "bg-[#C62828] text-white"
                  : "border border-black/10 hover:border-[#C62828]/40"
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">额外专题（不影响主课程）</h2>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => {
            const on = s.tracks.includes(t);
            return (
              <button
                key={t}
                onClick={() =>
                  updateSettings({
                    tracks: on
                      ? s.tracks.filter((x) => x !== t)
                      : [...s.tracks, t],
                  })
                }
                className={`px-4 py-2 rounded-xl text-sm transition ${
                  on
                    ? "bg-[#F4B400] text-[#182230]"
                    : "border border-black/10 hover:border-[#F4B400]/60"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#182230]/50">
          专题模块（含 Business Spanish：报价、MOQ、Incoterms 等）将在后续版本加入词库。
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-3">
        <h2 className="font-semibold text-[#C62828]">危险操作</h2>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl border border-[#C62828]/40 text-[#C62828] text-sm hover:bg-[#C62828]/5"
          >
            清空全部学习数据
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#C62828]">确定清空？此操作不可恢复。</p>
            <button
              onClick={() => {
                resetAll();
                location.href = "/onboarding";
              }}
              className="px-4 py-2 rounded-xl bg-[#C62828] text-white text-sm"
            >
              确认清空
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-xl border border-black/10 text-sm"
            >
              取消
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
