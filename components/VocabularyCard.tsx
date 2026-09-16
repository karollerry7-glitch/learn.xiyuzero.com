"use client";

import { useState } from "react";
import { LearningUnit } from "@/types";
import AudioButton from "./AudioButton";
import { toggleFavorite, useAppState } from "@/lib/store";
import { getFiveD } from "@/data/fived";

// 主学习卡：默认只展示核心信息，「查看更多」展开详情，避免认知负担。
export default function VocabularyCard({
  unit,
  showChinese = true,
}: {
  unit: LearningUnit;
  showChinese?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = useAppState();
  const fav = state.favorites.includes(unit.id);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 md:p-8">
      <div className="flex items-center justify-between text-sm text-[#182230]/60">
        <span className="px-2 py-0.5 rounded-full bg-[#F4B400]/15 text-[#8a6400] font-medium">
          {unit.level}
        </span>
        <span>{unit.topic}</span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <h2 className="text-3xl md:text-4xl font-semibold text-[#182230]">
          {unit.spanish}
        </h2>
        <AudioButton text={unit.spanish} size="lg" />
      </div>

      {showChinese && (
        <p className="mt-3 text-xl text-[#182230]/80">{unit.chinese}</p>
      )}

      <div className="mt-6 p-4 rounded-xl bg-[#F7F8FA]">
        <div className="flex items-center gap-2">
          <p className="text-lg text-[#182230]">{unit.example.spanish}</p>
          <AudioButton text={unit.example.spanish} size="sm" />
        </div>
        {showChinese && (
          <p className="mt-1 text-[#182230]/60">{unit.example.chinese}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[#C62828] text-sm font-medium hover:underline"
        >
          {expanded ? "收起 ▲" : "查看更多 ▼"}
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(unit.id)}
          className="text-sm text-[#182230]/60 hover:text-[#F4B400]"
        >
          {fav ? "★ 已收藏" : "☆ 收藏"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm text-[#182230]/80 border-t border-black/5 pt-4">
          {(() => {
            const fd = getFiveD(unit);
            if (!fd) return null;
            return (
              <div className="rounded-xl bg-[#F7F8FA] p-3.5 space-y-2.5">
                <p className="font-medium text-[#182230]">5D 学习卡</p>
                <p>
                  <span className="text-[#182230]/60">发音：</span>
                  {fd.sound.syllables}（{fd.sound.stress}）
                </p>
                <div>
                  <span className="text-[#182230]/60">语法：</span>
                  {fd.grammar.map((g, i) => (
                    <span key={i} className="block pl-3">· {g}</span>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-[#182230]/60">词块：</span>
                  {fd.chunks.map((c, i) => (
                    <span key={i} className="flex items-center gap-2 pl-3">
                      <span className="text-[#C62828]">{c.spanish}</span>
                      <span className="text-[#182230]/60">{c.chinese}</span>
                      <AudioButton text={c.spanish} size="sm" />
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-[#182230]/60">例句：</span>
                  {fd.sentences.map((s, i) => (
                    <span key={i} className="flex items-center gap-2 pl-3">
                      <span>{s.spanish} — {s.chinese}</span>
                      <AudioButton text={s.spanish} size="sm" />
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
          <p>
            <span className="font-medium text-[#182230]">词性：</span>
            {unit.partOfSpeech}
            {unit.gender && `（${unit.gender === "m" ? "阳性" : "阴性"}）`}
            {unit.plural && ` ・ 复数：${unit.plural}`}
          </p>
          {unit.collocations.length > 0 && (
            <p>
              <span className="font-medium text-[#182230]">搭配：</span>
              {unit.collocations.join("、")}
            </p>
          )}
          {unit.wordFamily.length > 0 && (
            <p>
              <span className="font-medium text-[#182230]">词族：</span>
              {unit.wordFamily.join("、")}
            </p>
          )}
          {unit.synonyms.length > 0 && (
            <p>
              <span className="font-medium text-[#182230]">近义：</span>
              {unit.synonyms.join("、")}
            </p>
          )}
          {unit.antonyms.length > 0 && (
            <p>
              <span className="font-medium text-[#182230]">反义：</span>
              {unit.antonyms.join("、")}
            </p>
          )}
          {unit.grammarNote && (
            <p>
              <span className="font-medium text-[#182230]">语法：</span>
              {unit.grammarNote}
            </p>
          )}
          {unit.commonMistakes && (
            <p className="text-[#C62828]">
              <span className="font-medium">常见错误：</span>
              {unit.commonMistakes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
