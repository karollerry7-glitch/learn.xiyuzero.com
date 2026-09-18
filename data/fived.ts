// ⚠️ 本文件由 scripts/build-fived.mjs 自动生成 —— 请勿手改
// 新增/修改 5D 卡：编辑 data/seeds5d/<level>-<n>.tsv 后运行 node scripts/build-fived.mjs
// 20 条手工精编卡见 data/fived-core.ts（优先保留）
import { FiveD, LearningUnit } from "@/types";
import { FIVE_D_CORE } from "./fived-core";

const entries: [string, FiveD][] = [

];

export const FIVE_D: Record<string, FiveD> = { ...FIVE_D_CORE, ...Object.fromEntries(entries) };

export function getFiveD(unit: LearningUnit): FiveD | undefined {
  return unit.fiveD ?? FIVE_D[unit.id];
}
