"use client";

// 轻量全局状态 Store（LocalStorage 持久化）
// 结构预留未来升级 Supabase：所有读写都经过本模块，替换实现即可。

import {
  AppState,
  DEFAULT_STATE,
  DayActivity,
  MySentence,
  Rating,
  ReviewState,
  Settings,
} from "@/types";
import { initialReviewState, recordProduction, scheduleNext } from "./srs";
import { useSyncExternalStore } from "react";

const KEY = "xiyuzero-learn-v1";

let state: AppState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存储失败时静默（隐私模式等）
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      state = {
        ...DEFAULT_STATE,
        ...parsed,
        settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      };
    }
  } catch {
    state = DEFAULT_STATE;
  }
  hydrated = true;
  emit();
}

export function isHydrated(): boolean {
  return hydrated;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    isHydrated,
    () => false
  );
}

export function getState(): AppState {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function update(fn: (s: AppState) => AppState) {
  state = fn(state);
  persist();
  emit();
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => DEFAULT_STATE
  );
}

// ── Helpers ──

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDay(): DayActivity {
  return {
    newLearned: 0,
    reviewed: 0,
    listening: 0,
    output: 0,
    recallCorrect: 0,
    recallTotal: 0,
    listeningCorrect: 0,
    listeningTotal: 0,
    wrongIds: [],
  };
}

function bumpDay(fn: (d: DayActivity) => DayActivity) {
  update((s) => {
    const k = todayKey();
    const day = s.activity[k] ?? emptyDay();
    return { ...s, activity: { ...s.activity, [k]: fn(day) } };
  });
}

// ── Actions ──

export function completeOnboarding(level: AppState["startLevel"], goal: string) {
  update((s) => ({
    ...s,
    onboarded: true,
    startLevel: level,
    settings: { ...s.settings, goal },
  }));
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function getReview(unitId: string): ReviewState {
  return state.reviews[unitId] ?? initialReviewState();
}

export function rateUnit(unitId: string, rating: Rating) {
  update((s) => {
    const prev = s.reviews[unitId] ?? initialReviewState();
    const wasNew = prev.status === "new";
    const next = scheduleNext(prev, rating);
    return { ...s, reviews: { ...s.reviews, [unitId]: next } };
  });
  bumpDay((d) => ({ ...d, reviewed: d.reviewed + 1 }));
}

export function learnNewUnit(unitId: string) {
  update((s) => {
    const prev = s.reviews[unitId] ?? initialReviewState();
    if (prev.status !== "new") return s;
    const next: ReviewState = {
      ...prev,
      status: "learning",
      lastRatedAt: new Date().toISOString(),
    };
    return { ...s, reviews: { ...s.reviews, [unitId]: next } };
  });
  bumpDay((d) => ({ ...d, newLearned: d.newLearned + 1 }));
}

export function recordRecall(
  unitId: string,
  result: "correct" | "close" | "wrong"
) {
  update((s) => {
    const prev = s.reviews[unitId] ?? initialReviewState();
    const next = recordProduction(prev, result);
    return { ...s, reviews: { ...s.reviews, [unitId]: next } };
  });
  bumpDay((d) => ({
    ...d,
    recallTotal: d.recallTotal + 1,
    recallCorrect: d.recallCorrect + (result === "correct" ? 1 : 0),
    wrongIds:
      result === "wrong"
        ? d.wrongIds.includes(unitId)
          ? d.wrongIds
          : [...d.wrongIds, unitId]
        : d.wrongIds,
  }));
}

export function recordListening(correct: boolean) {
  bumpDay((d) => ({
    ...d,
    listening: d.listening + 1,
    listeningTotal: d.listeningTotal + 1,
    listeningCorrect: d.listeningCorrect + (correct ? 1 : 0),
  }));
}

export function recordOutput() {
  bumpDay((d) => ({ ...d, output: d.output + 1 }));
}

export function toggleFavorite(unitId: string) {
  update((s) => ({
    ...s,
    favorites: s.favorites.includes(unitId)
      ? s.favorites.filter((id) => id !== unitId)
      : [...s.favorites, unitId],
  }));
}

export function addMySentence(text: string, unitIds: string[]) {
  const item: MySentence = {
    id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    date: new Date().toISOString(),
    unitIds,
  };
  update((s) => ({ ...s, mySentences: [item, ...s.mySentences] }));
  recordOutput();
}

export function removeMySentence(id: string) {
  update((s) => ({
    ...s,
    mySentences: s.mySentences.filter((m) => m.id !== id),
  }));
}

export function resetAll() {
  state = DEFAULT_STATE;
  persist();
  emit();
}
