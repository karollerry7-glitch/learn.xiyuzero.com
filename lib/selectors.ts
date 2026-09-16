// 学习队列与统计计算
import { units } from "@/data/units";
import { AppState, LearningUnit, ReviewState } from "@/types";
import { initialReviewState, isDue } from "./srs";
import { todayKey } from "./store";

export function getReviewOf(s: AppState, id: string): ReviewState {
  return s.reviews[id] ?? initialReviewState();
}

// 今日新学习队列：未学习过的单元（从用户起始等级开始）
const LEVEL_IDX: Record<string, number> = { Starter: 0, A1: 1, A2: 2, B1: 3, B2: 4 };

export function newQueue(s: AppState): LearningUnit[] {
  const minIdx = LEVEL_IDX[s.startLevel] ?? 0;
  return units.filter((u) => {
    const r = s.reviews[u.id];
    if (r && r.status !== "new") return false;
    return (LEVEL_IDX[u.level] ?? 0) >= minIdx;
  });
}

// 今日待复习：已学习且到期
export function dueQueue(s: AppState): LearningUnit[] {
  const now = Date.now();
  return units.filter((u) => {
    const r = s.reviews[u.id];
    return r && r.status !== "new" && isDue(r, now);
  });
}

export function learnedCount(s: AppState): number {
  return Object.values(s.reviews).filter((r) => r.status !== "new").length;
}

export function vocabularyCounts(s: AppState) {
  let active = 0;
  let passive = 0;
  let mastered = 0;
  for (const r of Object.values(s.reviews)) {
    if (r.status === "mastered") mastered++;
    else if (r.status === "active") active++;
    else if (r.status !== "new") passive++;
  }
  return { active, passive, mastered };
}

export function streakDays(s: AppState): number {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = d.toISOString().slice(0, 10);
    const a = s.activity[k];
    const did =
      a && (a.newLearned > 0 || a.reviewed > 0 || a.listening > 0 || a.output > 0);
    if (did) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (k === todayKey()) {
      // 今天还没学不算断签
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function totalStudyDays(s: AppState): number {
  return Object.values(s.activity).filter(
    (a) => a.newLearned > 0 || a.reviewed > 0 || a.listening > 0 || a.output > 0
  ).length;
}

export function recentActivity(s: AppState, days: number) {
  const out: { date: string; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const a = s.activity[k];
    out.push({
      date: k.slice(5),
      total: a ? a.newLearned + a.reviewed : 0,
    });
  }
  return out;
}

export function accuracy(s: AppState) {
  let recallC = 0;
  let recallT = 0;
  let listenC = 0;
  let listenT = 0;
  for (const a of Object.values(s.activity)) {
    recallC += a.recallCorrect;
    recallT += a.recallTotal;
    listenC += a.listeningCorrect;
    listenT += a.listeningTotal;
  }
  return {
    recall: recallT ? Math.round((recallC / recallT) * 100) : null,
    listening: listenT ? Math.round((listenC / listenT) * 100) : null,
  };
}

// 最容易错的 20 个表达
export function mostWrong(s: AppState): { unit: LearningUnit; wrong: number }[] {
  return units
    .map((u) => ({ unit: u, wrong: s.reviews[u.id]?.wrongCount ?? 0 }))
    .filter((x) => x.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 20);
}

// Level 进度（基于当前词库的等级分布）
export function levelProgress(s: AppState) {
  const levels = ["Starter", "A1", "A2", "B1", "B2"] as const;
  return levels.map((lv) => {
    const inLevel = units.filter((u) => u.level === lv);
    const done = inLevel.filter(
      (u) => (s.reviews[u.id]?.status ?? "new") !== "new"
    ).length;
    return {
      level: lv,
      total: inLevel.length,
      done,
      pct: inLevel.length ? Math.round((done / inLevel.length) * 100) : 0,
    };
  });
}

// 当前等级：第一个未完成的等级
export function currentLevel(s: AppState): string {
  const p = levelProgress(s);
  const cur = p.find((x) => x.total > 0 && x.pct < 100);
  return cur ? cur.level : "B2";
}
