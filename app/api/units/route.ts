// 词库 API — 小程序 /api/units 数据源（Phase 1 打通）
// 用法：
//   GET /api/units?page=1&pageSize=50[&level=A1|Starter|A2|B1|B2][&q=关键词]
//     → { items: UnitSummary[], total, level, page, pageSize }
//   GET /api/units?ids=a1-001,a1-002（≤50 个，学习会话用）
//     → UnitFull[]（含 5D，按传入顺序去重返回）
// 数据源：git 仓库静态文件（4505 条，单一真源，勿复制第二份）

import { NextRequest, NextResponse } from "next/server";
import { units } from "@/data/units";
import { FIVE_D } from "@/data/fived";
import type { Level } from "@/types";

export const runtime = "nodejs";

const LEVELS = new Set(["Starter", "A1", "A2", "B1", "B2"]);
const MAX_PAGE_SIZE = 100;
const MAX_IDS = 50;

function toSummary(u: (typeof units)[number]) {
  return {
    id: u.id,
    level: u.level,
    spanish: u.spanish,
    chinese: u.chinese,
    partOfSpeech: u.partOfSpeech,
    topic: u.topic,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  // ---- 模式一：ids 批量取完整词条（学习会话）----
  const idsParam = sp.get("ids");
  if (idsParam !== null) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids 参数为空" }, { status: 400 });
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { error: `ids 数量超过上限 ${MAX_IDS}` },
        { status: 400 }
      );
    }
    const byId = new Map(units.map((u) => [u.id, u]));
    const seen = new Set<string>();
    const items = [] as typeof units;
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const u = byId.get(id);
      if (u) items.push(u);
    }
    // 合并 5D 卡数据（fived.ts 独立维护，按 id 关联）
    return NextResponse.json(
      items.map((u) => ({ ...u, fiveD: FIVE_D[u.id] ?? undefined }))
    );
  }

  // ---- 模式二：分页 + 等级筛选 + 搜索（词库浏览）----
  const level = sp.get("level") ?? "";
  if (level && level !== "all" && !LEVELS.has(level)) {
    return NextResponse.json(
      { error: `无效等级：${level}` },
      { status: 400 }
    );
  }

  const q = (sp.get("q") ?? "").trim().toLowerCase();

  let list = units;
  if (level && level !== "all") {
    const lv = level as Level;
    list = list.filter((u) => u.level === lv);
  }
  if (q) {
    list = list.filter(
      (u) =>
        u.spanish.toLowerCase().includes(q) ||
        u.lemma.toLowerCase().includes(q) ||
        u.chinese.includes(q) ||
        u.topic.includes(q)
    );
  }

  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get("pageSize") ?? "50", 10) || 50)
  );

  const total = list.length;
  const items = list
    .slice((page - 1) * pageSize, page * pageSize)
    .map(toSummary);

  return NextResponse.json({
    items,
    total,
    level: level || "all",
    page,
    pageSize,
  });
}
