// 词库生成器：data/seeds/<level>-<n>.tsv → data/units.ts
// 种子格式（竖线分隔，UTF-8，1-6 必填，7-9 可选）：
//   es|zh|pos|topic|exEs|exZh|collocs|note|plural
//   pos: n(名词,es 需带冠词) nm/nf(名词并指定阴阳性) v adj adv conj prep pron interj num
//        phr(词块) phrv(动词词块) sent(句型)
// 运行: node scripts/build-units.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = path.join(root, "data", "seeds");
const OUT = path.join(root, "data", "units.ts");
const CORE = path.join(root, "data", "units-core.ts");

const POS_MAP = {
  n: "sustantivo", nm: "sustantivo", nf: "sustantivo", v: "verbo",
  adj: "adjetivo", adv: "adverbio", conj: "conjunción", prep: "preposición",
  pron: "pronombre", interj: "interjección", num: "numeral",
  phr: "locución", phrv: "locución verbal", sent: "patrón",
};
const LEVEL_BASE = { a1: 1, a2: 2, b1: 3, b2: 4 };
const LEVEL_NAME = { a1: "A1", a2: "A2", b1: "B1", b2: "B2" };

// 重音归一化（用于例句包含判断）
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// 查重键：忽略大小写与 ¡¿，但保留重音（qué ≠ que，是不同词条）
const dedupKey = (s) => s.toLowerCase().replace(/[¡¿]/g, "").trim();

function pluralize(article, word) {
  let w;
  if (/[aeiouáéíóú]$/.test(word)) w = word + "s";
  else if (/z$/.test(word)) w = word.slice(0, -1) + "ces";
  else w = word + "es";
  const art = article === "el" ? "los" : article === "la" ? "las" : article;
  return art ? `${art} ${w}` : w;
}

// 读取核心词条的 es 集合，用于查重
const coreSrc = fs.readFileSync(CORE, "utf8");
const coreEs = new Set(
  [...coreSrc.matchAll(/spanish: "([^"]+)"/g)].map((m) => dedupKey(m[1]))
);
const coreIds = new Set(
  [...coreSrc.matchAll(/id: "([^"]+)"/g)].map((m) => m[1])
);

const files = fs
  .readdirSync(SEED_DIR)
  .filter((f) => /^[ab][12]-\d+\.tsv$/.test(f))
  .sort();
if (files.length === 0) {
  console.error("未找到种子文件 data/seeds/<level>-<n>.tsv");
  process.exit(1);
}

const errors = [];
const warnings = [];
const entries = [];
const seenEs = new Map(); // norm(es) -> id
let exMiss = 0;

for (const file of files) {
  const level = file.split("-")[0]; // a1/a2/b1/b2
  const lines = fs
    .readFileSync(path.join(SEED_DIR, file), "utf8")
    .split(/\r?\n/);
  let seq = 0;
  const total = lines.filter((l) => l.trim() && !l.startsWith("#")).length;
  let i = 0;
  for (const raw of lines) {
    const line = raw.replace(/^\uFEFF/, "");
    if (!line.trim() || line.startsWith("#")) continue;
    i++;
    const ln = `${file}:${i}`;
    const f = line.split("|").map((x) => x.trim());
    if (f.length < 6 || f.length > 9) {
      errors.push(`${ln} 字段数 ${f.length}（应为 6-9）`);
      continue;
    }
    const [es, zh, posCode, topic, exEs, exZh, collocs = "", note = "", pluralOv = ""] = f;
    if (!es || !zh || !exEs || !exZh || !topic) {
      errors.push(`${ln} 存在空必填字段`);
      continue;
    }
    if (!(posCode in POS_MAP)) {
      errors.push(`${ln} 未知 pos 代码 "${posCode}"`);
      continue;
    }
    // 查重（含核心词库）
    const nk = dedupKey(es);
    if (seenEs.has(nk)) errors.push(`${ln} 重复词条 "${es}"（与 ${seenEs.get(nk)} 重复）`);
    else if (coreEs.has(nk)) errors.push(`${ln} 重复词条 "${es}"（与核心词库重复）`);
    else seenEs.set(nk, `${level} 词库`);

    // 名词冠词与阴阳性
    let article, gender, lemma, plural;
    if (posCode === "n" || posCode === "nm" || posCode === "nf") {
      const m = es.match(/^(el|la|los|las|un|una)\s+(.+)$/i);
      if (!m && posCode === "n") warnings.push(`${ln} 名词 "${es}" 未带冠词（无冠词名词请用 nm/nf）`);
      if (m) {
        article = m[1].toLowerCase();
        lemma = m[2].toLowerCase();
        if (posCode === "nm") gender = "m";
        else if (posCode === "nf") gender = "f";
        else gender = article === "la" || article === "las" || article === "una" ? "f" : "m";
        if (gender === "f" && (article === "el" || article === "un") && posCode !== "nf")
          warnings.push(`${ln} "${es}" el/la 与阴阳性可能不一致（如确认请用 nf 标注）`);
        plural = pluralOv || pluralize(article, lemma);
      }
    }
    if (!lemma) lemma = es;

    // 例句应包含目标词（取 es 的最后一个词）
    const target = norm(es.split(/\s+/).pop());
    if (!norm(exEs).includes(target)) {
      exMiss++;
      if (exMiss <= 30) warnings.push(`${ln} 例句未包含目标词 "${es.split(/\s+/).pop()}"`);
    }

    // 频率：按文件内位置（种子按频率从高到低排列）
    const ratio = i / total;
    const frequency = ratio < 0.2 ? "极高" : ratio < 0.55 ? "高" : "中";
    // 难度：等级基数 + 动词/动词词块加成
    const base = LEVEL_BASE[level];
    const difficulty = Math.min(5, base + (/^(v|phrv)$/.test(posCode) ? 1 : 0));
    // 类型
    let type = "word";
    if (posCode === "conj") type = "connector";
    else if (posCode === "phr" || posCode === "phrv") type = "chunk";
    else if (posCode === "sent") type = "sentence-pattern";

    seq++;
    const id = `${level}-${String(seq).padStart(3, "0")}`;
    if (coreIds.has(id)) errors.push(`${ln} id "${id}" 与核心词库冲突`);

    entries.push({
      id, level: LEVEL_NAME[level], type, spanish: es, lemma, chinese: zh,
      partOfSpeech: POS_MAP[posCode], topic, frequency, difficulty,
      ...(article ? { article } : {}),
      ...(gender ? { gender } : {}),
      ...(plural ? { plural } : {}),
      collocations: collocs ? collocs.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
      example: { spanish: exEs, chinese: exZh },
      wordFamily: [], synonyms: [], antonyms: [],
      grammarNote: note || "", commonMistakes: "",
    });
  }
}

// 生成 units.ts
const head = `// ⚠️ 本文件由 scripts/build-units.mjs 自动生成 —— 请勿手改
// 新增/修改词条：编辑 data/seeds/<level>-<n>.tsv 后运行 node scripts/build-units.mjs
// 核心 123 条手工精编词条见 data/units-core.ts
import { LearningUnit } from "@/types";
import { coreUnits } from "./units-core";

const extra: LearningUnit[] = [
`;
const body = entries.map((e) => JSON.stringify(e)).join(",\n");
const tail = `,
];

export const units: LearningUnit[] = [...coreUnits, ...extra];
`;
fs.writeFileSync(OUT, head + body + tail, "utf8");

// 报告
const byLevel = {};
for (const e of entries) {
  byLevel[e.level] = byLevel[e.level] || { n: 0 };
  byLevel[e.level].n++;
}
console.log("=== 生成完成 ===");
console.log(`核心词条: ${coreIds.size}  新增: ${entries.length}  总计: ${coreIds.size + entries.length}`);
for (const [lv, c] of Object.entries(byLevel)) console.log(`  ${lv}: +${c.n}`);
console.log(`例句未包含目标词: ${exMiss} 条（Cloze 会跳过这些，不致命）`);
if (warnings.length) {
  console.log(`\n=== 警告 ${warnings.length} 条 ===`);
  for (const w of warnings) console.log("  " + w);
}
if (errors.length) {
  console.log(`\n=== 错误 ${errors.length} 条（必须修复）===`);
  for (const e of errors) console.log("  " + e);
  process.exit(1);
}
console.log("\n✓ 无错误");
