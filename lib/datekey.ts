// 统一「一天」的划分规则 — 东八区（UTC+8）自然日
// 与小程序端 shared/datekey.ts 保持同一规则（原先 UTC 日期导致中国用户早上 8 点翻日，
// 凌晨的学习记录会从「今天」变成「昨天」）。
const TZ_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 东八区日期键 YYYY-MM-DD（默认当前时间） */
export function dayKey(d: Date = new Date()): string {
  return new Date(d.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
}
