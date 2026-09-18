// 5D 学习卡生成器：data/units.ts(+units-core) + data/seeds5d/*.tsv → data/fived.ts
// 种子格式（竖线分隔，UTF-8，# 注释）：
//   id|chunk_es=>chunk_zh;chunk_es=>chunk_zh[;chunk3][|g:语法条~语法条][|s2:西=>中][|m:含义覆盖]
// D2 发音（音节+重音）全自动；D1 默认取词条首义项；D3 默认按词性/冠词/复数/grammarNote 模板生成
// 运行: node scripts/build-fived.mjs           生成 data/fived.ts
//      node scripts/build-fived.mjs --todo a1   列出该级未覆盖词条的 worklist
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_DIR = path.join(root, "data", "seeds5d");
const OUT = path.join(root, "data", "fived.ts");
const CORE5 = path.join(root, "data", "fived-core.ts");
const UNITS = path.join(root, "data", "units.ts");
const UNITC = path.join(root, "data", "units-core.ts");
const TODO_DIR = path.join(root, "..", "_scratch", "5d-todo");

// ================= 加载词条 =================
// units-core.ts 是 TS 对象字面量，纯数据可安全求值（只取 coreUnits 数组）
const coreSrc = fs.readFileSync(UNITC, "utf8");
const declAt = coreSrc.indexOf("export const coreUnits");
const arrStart = coreSrc.indexOf("= [", declAt) + 2;
const arrEnd = coreSrc.indexOf("\n];", arrStart);
const coreBody = coreSrc.slice(arrStart, arrEnd) + "]";
const coreUnits = new Function(`return ${coreBody}`)();
// units.ts 每行一个 JSON + as LearningUnit
const extraSrc = fs.readFileSync(UNITS, "utf8");
const extraUnits = [...extraSrc.matchAll(/^\{.*\}(?= as LearningUnit)/gm)].map((m) =>
  JSON.parse(m[0])
);
const units = [...coreUnits, ...extraUnits];

// 20 条手工卡：不生成、不覆盖
const core5Ids = new Set(
  [...fs.readFileSync(CORE5, "utf8").matchAll(/"(st-[0-9]+)": \{/g)].map((m) => m[1])
);

// ================= 西语音节与重音引擎 =================
const VOWELS = "aeiouáéíóúü";
const STRONG = "aeoáéó";
const WEAK = "iuü";
const ACC = "áéíóú";
const FUNC_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "al", "en", "con", "por", "para", "a", "y", "o",
  "que", "no", "se", "lo", "su", "sus", "mi", "mis", "tu", "tus",
]);
const INSEP = new Set([
  "bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "kl", "kr",
  "pl", "pr", "tr", "tl", "ch", "ll", "rr",
]);

const isV = (c) => VOWELS.includes(c);
const isAcc = (c) => ACC.includes(c);

// 元音串 → 音节核（处理二重元音/断裂）
const base = (c) =>
  c === "á" ? "a" : c === "é" ? "e" : c === "í" ? "i" : c === "ó" ? "o" : c === "ú" ? "u" : c;
function nucleiOf(run) {
  const out = [];
  let i = 0;
  while (i < run.length) {
    const v1 = run[i];
    const v2 = run[i + 1];
    const v3 = run[i + 2];
    if (v2 !== undefined && canMerge(v1, v2)) {
      if (
        v3 !== undefined && isWeakUnacc(v1) && isWeakUnacc(v3) && !isAcc(v2) && canMerge(v2, v3)
      ) {
        out.push(v1 + v2 + v3); // 三重元音 buey / cambiáis
        i += 3;
      } else {
        out.push(v1 + v2);
        i += 2;
      }
    } else {
      out.push(v1);
      i += 1;
    }
  }
  return out;
}
// 强+强断开；带重音符号的 í/ú 断开；其余（弱+强/强+弱/弱+弱）合并
function canMerge(a, b) {
  const ba = base(a), bb = base(b);
  if (isAcc(a) && isAcc(b)) return false;
  if ((ba === "i" || ba === "u") && isAcc(a)) return false;
  if ((bb === "i" || bb === "u") && isAcc(b)) return false;
  if ("aeo".includes(ba) && "aeo".includes(bb)) return false;
  return true;
}
const isWeakUnacc = (c) => "iuü".includes(c) && !isAcc(c);

// 单词 → 音节数组（onset + nucleus + coda 结构）
function syllabifyWord(word) {
  const w = word.toLowerCase();
  if (!w) return [];
  if (!/^[a-záéíóúñü]+$/.test(w)) return [w]; // 非纯字母（数字/缩写）整体返回
  // 分段：辅音串与元音串（y 后接元音=辅音，否则=元音）
  const segs = [];
  let cur = "", curType = null;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    let t;
    if (c === "y") t = i + 1 < w.length && isV(w[i + 1]) ? "c" : "v";
    else t = isV(c) ? "v" : "c";
    if (t !== curType) {
      if (cur) segs.push({ t: curType, s: cur });
      cur = c;
      curType = t;
    } else cur += c;
  }
  if (cur) segs.push({ t: curType, s: cur });

  // 各元音串的核（保留分段对应关系）
  const segNuclei = segs.map((seg) => (seg.t === "v" ? nucleiOf(seg.s) : null));
  const nuclei = segNuclei.flat().filter(Boolean);
  if (nuclei.length === 0) return [w];

  const syl = nuclei.map((n) => ({ onset: "", n, coda: "" }));
  let consumed = 0; // 已出现核数
  const total = nuclei.length;
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    if (seg.t === "v") {
      consumed += segNuclei[i].length;
      continue;
    }
    const c = seg.s;
    if (consumed === 0) {
      syl[0].onset += c; // 词首辅音
    } else if (consumed === total) {
      syl[total - 1].coda += c; // 词尾辅音 → 最后一音节韵尾
    } else {
      const j = consumed; // 下一个核的音节下标
      if (c.length === 1) syl[j].onset += c;
      else if (c.length === 2) {
        if (INSEP.has(c)) syl[j].onset += c;
        else {
          syl[j - 1].coda += c[0];
          syl[j].onset += c[1];
        }
      } else if (c.length === 3) {
        if (INSEP.has(c.slice(1))) {
          syl[j - 1].coda += c[0];
          syl[j].onset += c.slice(1);
        } else {
          syl[j - 1].coda += c.slice(0, 2);
          syl[j].onset += c[2];
        }
      } else {
        syl[j - 1].coda += c.slice(0, 2);
        syl[j].onset += c.slice(2);
      }
    }
  }
  return syl.map((s) => s.onset + s.n + s.coda);
}

// 词内重音音节索引
function stressIndex(word, syls) {
  for (let i = 0; i < syls.length; i++)
    if ([...syls[i]].some(isAcc)) return i;
  const clean = word.toLowerCase().replace(/[^a-záéíóúñü]/g, "");
  const last = clean[clean.length - 1];
  if (isV(last) || last === "n" || last === "s") return Math.max(0, syls.length - 2);
  return syls.length - 1;
}

// 多词条目 → 音节串（重读音节大写）+ 重音说明
function soundOf(es, commonMistakes, isVerb) {
  const words = es.split(/\s+/).filter(Boolean);
  const rendered = [];
  const notes = [];
  let lastContentWord = null;
  for (const raw of words) {
    const word = raw.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g, "");
    if (!word) {
      rendered.push(raw);
      continue;
    }
    const syls = syllabifyWord(word);
    const isFunc = FUNC_WORDS.has(word.toLowerCase());
    if (!isFunc) lastContentWord = { word: word.toLowerCase(), syls };
    if (isFunc) {
      rendered.push(raw); // 功能词原样小写
      continue;
    }
    const si = stressIndex(word, syls);
    rendered.push(
      syls.map((s, i) => (i === si ? s.toUpperCase() : s)).join("-")
    );
  }
  // 重音说明：讲最后一个实词
  let stressNote = "";
  if (lastContentWord) {
    const { word, syls } = lastContentWord;
    const si = stressIndex(word, syls);
    const syl = syls[si];
    const clean = word.replace(/[^a-záéíóúñü]/g, "");
    const hasAcc = [...clean].some(isAcc);
    const last = clean[clean.length - 1];
    if (syls.length === 1) stressNote = "单音节词";
    else if (hasAcc) stressNote = `重音符号标在 ${syl} 音节`;
    else if (isV(last) || last === "n" || last === "s")
      stressNote = `以 ${last} 结尾，重音落在倒数第二音节（${syl}）`;
    else if (isVerb && /(ar|er|ir)$/.test(clean))
      stressNote = `动词原形重读词尾（${syl}）`;
    else stressNote = `辅音结尾，重读最后一个音节（${syl}）`;
  }
  if (commonMistakes && /读|发音|不发音|重音/.test(commonMistakes))
    stressNote = stressNote + "。" + commonMistakes.replace(/。$/, "");
  return { syllables: rendered.join(" "), stress: stressNote || "注意听重音位置" };
}

// ================= D1 / D3 =================
function firstSense(zh) {
  let s = zh.split(/[；;，,/／]/)[0].trim();
  if (s.endsWith("（") || s.endsWith("(")) s = s.slice(0, -1).trim();
  return s || zh;
}

function autoGrammar(u) {
  const g = [];
  const push = (s) => {
    if (s && !g.includes(s)) g.push(s);
  };
  const pos = u.partOfSpeech;
  const word = (u.lemma || u.spanish).toLowerCase();
  if (pos === "sustantivo" && u.article) {
    if (u.article === "el") push(`定冠词 el → 阳性名词，冠词和名词一起记`);
    else if (u.article === "la") push(`定冠词 la → 阴性名词，冠词和名词一起记`);
    else if (u.article === "los") push(`阳性名词，常以复数形式出现`);
    else if (u.article === "las") push(`阴性名词，常以复数形式出现`);
    else push(`冠词 ${u.article}`);
    if (u.plural) push(`复数：${u.plural}`);
    else push(`复数：一般加 -s`);
  } else if (pos === "sustantivo") {
    push(u.gender === "f" ? "阴性名词（无冠词条目）" : u.gender === "m" ? "阳性名词（无冠词条目）" : "名词");
    if (u.plural) push(`复数：${u.plural}`);
  } else if (pos === "verbo") {
    if (u.grammarNote) push(u.grammarNote);
    else {
      const ending = word.match(/(ar|er|ir)$/)?.[1];
      push(ending ? `动词原形（-${ending} 类），变位后使用` : "动词，变位后使用");
    }
  } else if (pos === "locución verbal") {
    push("动词短语：整体当动词用，注意介词搭配");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "adjetivo") {
    if (/o$/.test(word)) push("形容词：阳性 -o / 阴性 -a（复数 -os / -as）");
    else if (/e$/.test(word)) push("形容词：阴阳性同形，复数 -es");
    else push("形容词：阴阳性同形");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "adverbio") {
    push("副词：形态不变，修饰动词或形容词");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "conjunción") {
    push("连接词：连接两个句子或对等成分");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "preposición") {
    push("介词：后面接名词、代词或动词原形");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "pronombre") {
    push("代词");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "interjección") {
    push("感叹/口语表达");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "numeral") {
    push("数词");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "locución") {
    push("常用词块：整体记忆");
    if (u.grammarNote) push(u.grammarNote);
  } else if (pos === "patrón") {
    push("句型：整体记忆，可替换其中可变部分");
    if (u.grammarNote) push(u.grammarNote);
  } else {
    if (u.grammarNote) push(u.grammarNote);
  }
  // 发音类备注并入 D2，语法类并入 D3
  if (u.commonMistakes && !/读|发音|不发音|重音/.test(u.commonMistakes))
    push(u.commonMistakes);
  if (g.length === 0) push("结合例句记忆整体用法");
  return g.slice(0, 4);
}

// ================= 种子解析 =================
function parseSeeds() {
  const seeds = new Map();
  if (!fs.existsSync(SEED_DIR)) return seeds;
  const files = fs.readdirSync(SEED_DIR).filter((f) => /\.tsv$/.test(f)).sort();
  const errors = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(SEED_DIR, file), "utf8").split(/\r?\n/);
    let i = 0;
    for (const raw of lines) {
      const line = raw.replace(/^\uFEFF/, "");
      if (!line.trim() || line.startsWith("#")) continue;
      i++;
      const ln = `${file}:${i}`;
      const f = line.split("|").map((x) => x.trim());
      if (f.length < 2 || f.length > 5) {
        errors.push(`${ln} 字段数 ${f.length}（应为 2-5）`);
        continue;
      }
      const [id, chunkStr, ...opts] = f;
      if (!/^(st|a1|a2|b1|b2)-[0-9]+$/.test(id)) {
        errors.push(`${ln} id 格式非法 "${id}"`);
        continue;
      }
      if (seeds.has(id)) errors.push(`${ln} id "${id}" 重复`);
      // chunks
      const chunks = [];
      for (const c of chunkStr.split(";")) {
        const m = c.split("=>");
        if (m.length !== 2 || !m[0].trim() || !m[1].trim()) {
          errors.push(`${ln} 词块格式错误 "${c}"（应为 es=>zh）`);
          continue;
        }
        chunks.push({ spanish: m[0].trim(), chinese: m[1].trim() });
      }
      if (chunks.length < 1) errors.push(`${ln} 词块为空`);
      else if (chunks.length < 2) oneChunk++;
      // 可选字段
      let grammar, sent2, meaning;
      for (const o of opts) {
        if (o.startsWith("g:")) grammar = o.slice(2).split("~").map((x) => x.trim()).filter(Boolean);
        else if (o.startsWith("s2:")) {
          const m = o.slice(3).split("=>");
          if (m.length === 2) sent2 = { spanish: m[0].trim(), chinese: m[1].trim() };
          else errors.push(`${ln} s2 格式错误`);
        } else if (o.startsWith("m:")) meaning = o.slice(2).trim();
        else errors.push(`${ln} 未知可选字段 "${o}"（应为 g:/s2:/m:）`);
      }
      if (grammar && grammar.length === 0) errors.push(`${ln} g: 为空`);
      seeds.set(id, { chunks, grammar, sent2, meaning });
    }
  }
  return { seeds, errors };
}

// ================= 主流程 =================
let oneChunk = 0;
const { seeds, errors } = parseSeeds();
const unitById = new Map(units.map((u) => [u.id, u]));

// --test-syll 模式：抽查音节/重音引擎（--verb 视作动词，测动词原形说明）
if (process.argv.includes("--test-syll")) {
  const isVerb = process.argv.includes("--verb");
  const words = process.argv.slice(process.argv.indexOf("--test-syll") + 1).filter((w) => !w.startsWith("--"));
  for (const w of words) {
    const s = soundOf(w, "", isVerb);
    console.log(`${w}\n  音节: ${s.syllables}\n  重音: ${s.stress}`);
  }
  process.exit(0);
}

// --todo 模式：输出未覆盖词条 worklist
if (process.argv.includes("--todo")) {
  const lv = process.argv[process.argv.indexOf("--todo") + 1] || "all";
  fs.mkdirSync(TODO_DIR, { recursive: true });
  const groups = {};
  for (const u of units) {
    if (core5Ids.has(u.id)) continue;
    if (seeds.has(u.id)) continue;
    const level = u.id.split("-")[0];
    if (lv !== "all" && level !== lv) continue;
    (groups[level] ??= []).push(
      [
        u.id, u.spanish, u.chinese, u.partOfSpeech,
        u.grammarNote || "",
        (u.collocations || []).join("；"),
      ].join(" | ")
    );
  }
  for (const [level, lines] of Object.entries(groups)) {
    const p = path.join(TODO_DIR, `${level}.txt`);
    fs.writeFileSync(p, lines.join("\n") + "\n", "utf8");
    console.log(`${p}: ${lines.length} 条待写`);
  }
  process.exit(0);
}

// 生成
const entries5 = [];
let covered = 0;
for (const [id, seed] of seeds) {
  const u = unitById.get(id);
  if (!u) {
    errors.push(`种子 id "${id}" 在词条中不存在`);
    continue;
  }
  if (core5Ids.has(id)) {
    errors.push(`种子 id "${id}" 已有手工 5D 卡（fived-core），不要重复`);
    continue;
  }
  const sound = soundOf(u.spanish, u.commonMistakes, u.partOfSpeech === "verbo");
  const sentences = [{ spanish: u.example.spanish, chinese: u.example.chinese }];
  if (seed.sent2) sentences.push(seed.sent2);
  entries5.push([
    id,
    {
      meaning: seed.meaning || firstSense(u.chinese),
      sound,
      grammar: seed.grammar || autoGrammar(u),
      chunks: seed.chunks,
      sentences,
    },
  ]);
  covered++;
}

// 报告
const total = units.length;
const byLevel = {};
for (const [id] of entries5) {
  const lv = id.split("-")[0];
  byLevel[lv] = (byLevel[lv] || 0) + 1;
}
console.log("=== 5D 生成 ===");
console.log(`词条总数: ${total}  手工卡: ${core5Ids.size}  种子生成: ${covered}`);
console.log(`覆盖率: ${core5Ids.size + covered}/${total}（${(((core5Ids.size + covered) / total) * 100).toFixed(1)}%）`);
console.log(`单词块词条: ${oneChunk} 条（locution 类词条本身即词块，正常）`);
for (const [lv, n] of Object.entries(byLevel)) console.log(`  ${lv}: ${n}`);
if (errors.length) {
  console.log(`\n=== 错误 ${errors.length} 条（必须修复）===`);
  for (const e of errors) console.log("  " + e);
  process.exit(1);
}

// 生成 fived.ts
const head = `// ⚠️ 本文件由 scripts/build-fived.mjs 自动生成 —— 请勿手改
// 新增/修改 5D 卡：编辑 data/seeds5d/<level>-<n>.tsv 后运行 node scripts/build-fived.mjs
// 20 条手工精编卡见 data/fived-core.ts（优先保留）
import { FiveD, LearningUnit } from "@/types";
import { FIVE_D_CORE } from "./fived-core";

const entries: [string, FiveD][] = [
`;
const body = entries5
  .map(([id, d]) => `[${JSON.stringify(id)}, ${JSON.stringify(d)} as FiveD]`)
  .join(",\n") + (entries5.length ? "," : "");
const tail = `
];

export const FIVE_D: Record<string, FiveD> = { ...FIVE_D_CORE, ...Object.fromEntries(entries) };

export function getFiveD(unit: LearningUnit): FiveD | undefined {
  return unit.fiveD ?? FIVE_D[unit.id];
}
`;
fs.writeFileSync(OUT, head + body + tail, "utf8");
console.log(`\n✓ 已写入 data/fived.ts（${(fs.statSync(OUT).size / 1024).toFixed(0)} KB）`);
