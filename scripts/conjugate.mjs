// 西班牙语规则现在时变位引擎 — 供 build-fived.mjs 为动词词条自动生成
// 「现在时变位：yo xxx, tú xxx, …」语法说明。
//
// 分层策略（正确性优先）：
//   1. IRREGULAR_FULL：完全不规则/高频词干变化动词 → 完整六人称硬编码表
//   2. 正字法 yo 变化（-car/-gar/-zar/vowel+cer/-ger 等）→ 程序化规则
//   3. 其余以 -ar/-er/-ir 结尾的单词 → 规则变位
//   4. 反身动词（xxxse）→ 对词干变位后附加 me/te/se/nos/os/se
//   5. 短语（含空格/+）或无法识别 → 返回 null，调用方回退到原说明模板
//
// 注意：不在表内且存在词干变化的动词会被当作规则动词处理（e→ie/o→ue 等
// 高频动词已尽量收进 IRREGULAR_FULL；未收录的极少数可能变位不准确，
// 因此词库新增高频动词时建议核对其变位并补入表内）。

const PERSONS = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];

/** 完全不规则 / 词干变化动词：完整六人称现在时 */
const IRREGULAR_FULL = {
  // —— 顶层不规则 ——
  ser: ["soy", "eres", "es", "somos", "sois", "son"],
  estar: ["estoy", "estás", "está", "estamos", "estáis", "están"],
  ir: ["voy", "vas", "va", "vamos", "vais", "van"],
  haber: ["he", "has", "ha", "hemos", "habéis", "han"],
  tener: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
  hacer: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
  poner: ["pongo", "pones", "pone", "ponemos", "ponéis", "ponen"],
  salir: ["salgo", "sales", "sale", "salimos", "salís", "salen"],
  venir: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
  decir: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
  oír: ["oigo", "oyes", "oye", "oímos", "oís", "oyen"],
  traer: ["traigo", "traes", "trae", "traemos", "traéis", "traen"],
  caer: ["caigo", "caes", "cae", "caemos", "caéis", "caen"],
  ver: ["veo", "ves", "ve", "vemos", "veis", "ven"],
  dar: ["doy", "das", "da", "damos", "dais", "dan"],
  saber: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
  valer: ["valgo", "vales", "vale", "valemos", "valéis", "valen"],
  caber: ["quepo", "cabes", "cabe", "cabemos", "cabéis", "caben"],
  // —— e→ie ——
  querer: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
  pensar: ["pienso", "piensas", "piensa", "pensamos", "pensáis", "piensan"],
  empezar: ["empiezo", "empiezas", "empieza", "empezamos", "empezáis", "empiezan"],
  comenzar: ["comienzo", "comienzas", "comienza", "comenzamos", "comenzáis", "comienzan"],
  cerrar: ["cierro", "cierras", "cierra", "cerramos", "cerráis", "cierran"],
  entender: ["entiendo", "entiendes", "entiende", "entendemos", "entendéis", "entienden"],
  defender: ["defiendo", "defiendes", "defiende", "defendemos", "defendéis", "defienden"],
  perder: ["pierdo", "pierdes", "pierde", "perdemos", "perdéis", "pierden"],
  preferir: ["prefiero", "prefieres", "prefiere", "preferimos", "preferís", "prefieren"],
  sentir: ["siento", "sientes", "siente", "sentimos", "sentís", "sienten"],
  sentirse: ["me siento", "te sientes", "se siente", "nos sentimos", "os sentís", "se sienten"],
  sentarse: ["me siento", "te sientas", "se sienta", "nos sentamos", "os sentáis", "se sientan"],
  mentir: ["miento", "mientes", "miente", "mentimos", "mentís", "mienten"],
  desmentir: ["desmiento", "desmientes", "desmiente", "desmentimos", "desmentís", "desmienten"],
  consentir: ["consiento", "consientes", "consiente", "consentimos", "consentís", "consienten"],
  alentar: ["aliento", "alientas", "alienta", "alentamos", "alentáis", "alientan"],
  encender: ["enciendo", "enciendes", "enciende", "encendemos", "encendéis", "encienden"],
  quebrar: ["quiebro", "quiebras", "quiebra", "quebramos", "quebráis", "quiebran"],
  tropezar: ["tropiezo", "tropiezas", "tropieza", "tropezamos", "tropezáis", "tropiezan"],
  acertar: ["acierto", "aciertas", "acierta", "acertamos", "acertáis", "aciertan"],
  despertarse: ["me despierto", "te despiertas", "se despierta", "nos despertamos", "os despertáis", "se despiertan"],
  // —— o→ue ——
  poder: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
  mover: ["muevo", "mueves", "mueve", "movemos", "movéis", "mueven"],
  doler: ["duelo", "dueles", "duele", "dolemos", "doléis", "duelen"],
  dormir: ["duermo", "duermes", "duerme", "dormimos", "dormís", "duermen"],
  morir: ["muero", "mueres", "muere", "morimos", "morís", "mueren"],
  volver: ["vuelvo", "vuelves", "vuelve", "volvemos", "volvéis", "vuelven"],
  devolver: ["devuelvo", "devuelves", "devuelve", "devolvemos", "devolvéis", "devuelven"],
  envolver: ["envuelvo", "envuelves", "envuelve", "envolvemos", "envolvéis", "envuelven"],
  resolver: ["resuelvo", "resuelves", "resuelve", "resolvemos", "resolvéis", "resuelven"],
  contar: ["cuento", "cuentas", "cuenta", "contamos", "contáis", "cuentan"],
  costar: ["cuesto", "cuestas", "cuesta", "costamos", "costáis", "cuestan"],
  encontrar: ["encuentro", "encuentras", "encuentra", "encontramos", "encontráis", "encuentran"],
  mostrar: ["muestro", "muestras", "muestra", "mostramos", "mostráis", "muestran"],
  demostrar: ["demuestro", "demuestras", "demuestra", "demostramos", "demostráis", "demuestran"],
  probar: ["pruebo", "pruebas", "prueba", "probamos", "probáis", "prueban"],
  aprobar: ["apruebo", "apruebas", "aprueba", "aprobamos", "aprobáis", "aprueban"],
  recordar: ["recuerdo", "recuerdas", "recuerda", "recordamos", "recordáis", "recuerdan"],
  colgar: ["cuelgo", "cuelgas", "cuelga", "colgamos", "colgáis", "cuelgan"],
  volar: ["vuelo", "vuelas", "vuela", "volamos", "voláis", "vuelan"],
  sonar: ["sueno", "suenas", "suena", "sonamos", "sonáis", "suenan"], // soñar 已含 ñ 单列
  "soñar": ["sueño", "sueñas", "sueña", "soñamos", "soñáis", "sueñan"],
  torcer: ["tuerzo", "tuerces", "tuerce", "torcemos", "torcéis", "tuercen"],
  consolar: ["consuelo", "consuelas", "consuela", "consolamos", "consoláis", "consuelan"],
  reforzar: ["refuerzo", "refuerzas", "refuerza", "reforzamos", "reforzáis", "refuerzan"],
  // —— e→i（-ir）——
  seguir: ["sigo", "sigues", "sigue", "seguimos", "seguís", "siguen"],
  perseguir: ["persigo", "persigues", "persigue", "perseguimos", "perseguís", "persiguen"],
  conseguir: ["consigo", "consigues", "consigue", "conseguimos", "conseguís", "consiguen"],
  pedir: ["pido", "pides", "pide", "pedimos", "pedís", "piden"],
  despedir: ["despido", "despides", "despide", "despedimos", "despedís", "despiden"],
  despedirse: ["me despido", "te despides", "se despide", "nos despedimos", "os despedís", "se despiden"],
  repetir: ["repito", "repites", "repite", "repetimos", "repetís", "repiten"],
  elegir: ["elijo", "eliges", "elige", "elegimos", "elegís", "eligen"],
  corregir: ["corrijo", "corriges", "corrige", "corregimos", "corregís", "corrigen"],
  impedir: ["impido", "impides", "impide", "impedimos", "impedís", "impiden"],
  medir: ["mido", "mides", "mide", "medimos", "medís", "miden"],
  servir: ["sirvo", "sirves", "sirve", "servimos", "servís", "sirven"],
  reír: ["río", "ríes", "ríe", "reímos", "reís", "ríen"],
  sonreír: ["sonrío", "sonríes", "sonríe", "sonreímos", "sonreís", "sonríen"],
  freír: ["frío", "fríes", "fríe", "freímos", "freís", "fríen"],
  "sofreír": ["sofrío", "sofríes", "sofríe", "sofreímos", "sofreís", "sofríen"],
  // —— u→ue ——
  jugar: ["juego", "juegas", "juega", "jugamos", "jugáis", "juegan"],
  // —— -uir（插入 y）——
  contribuir: ["contribuyo", "contribuyes", "contribuye", "contribuimos", "contribuís", "contribuyen"],
  incluir: ["incluyo", "incluyes", "incluye", "incluimos", "incluís", "incluyen"],
  concluir: ["concluyo", "concluyes", "concluye", "concluimos", "concluís", "concluyen"],
  intuir: ["intuyo", "intuyes", "intuye", "intuimos", "intuís", "intuyen"],
  atribuir: ["atribuyo", "atribuyes", "atribuye", "atribuimos", "atribuís", "atribuyen"],
  restituir: ["restituyo", "restituyes", "restituye", "restituimos", "restituís", "restituyen"],
  huir: ["huyo", "huyes", "huye", "huimos", "huís", "huyen"],
  rehuir: ["rehuyo", "rehuyes", "rehuye", "rehuimos", "rehuís", "rehuyen"],
};

// 修正上方占位符
IRREGULAR_FULL.tropezar = ["tropiezo", "tropiezas", "tropieza", "tropezamos", "tropezáis", "tropiezan"];
IRREGULAR_FULL.medir = ["mido", "mides", "mide", "medimos", "medís", "miden"];

/** 正字法 yo 形式特判：返回完整的 yo 形式（含 -o），null 表示无特判 */
function orthographicYo(base) {
  const stem = base.slice(0, -2); // 去掉 ar/er/ir
  // -car → -que；-gar → -gue；-zar → -ce（sacar→saque, llegar→llegue, empezar 若不在表中→empiece）
  if (/car$/.test(base)) return stem.slice(0, -1) + "que";
  if (/gar$/.test(base)) return stem.slice(0, -1) + "gue";
  if (/zar$/.test(base)) return stem.slice(0, -1) + "ce";
  // 元音 + cer → -zco（conocer→conozco, parecer→parezco, merecer→merezco）
  if (/[aeiouáéíóú]cer$/.test(base)) return stem.slice(0, -1) + "zco";
  // 辅音 + cer / 任意 cir → -zco（conducir→conduzco, traducir→traduzco）
  if (/[bcdfghjklmnñpqrstvwxyz]cer$/.test(base) || /cir$/.test(base)) {
    return stem.slice(0, -1) + "zco";
  }
  // -ger / -gir → -jo（coger→cojo, recoger→recojo, dirigir→dirijo）
  if (/[bcdfghjklmnñpqrstvwxyz]ger$/.test(base) || /[bcdfghjklmnñpqrstvwxyz]gir$/.test(base)) {
    return stem.slice(0, -1) + "jo";
  }
  // -uir → 插入 y（contribuir→contribuyo, huir→huyo）
  if (/uir$/.test(base)) return stem.slice(0, -1) + "uyo";
  return null;
}

/** 规则现在时变位；词干已去掉反身 se */
function regularConjugate(base) {
  const m = base.match(/(ar|er|ir)$/);
  if (!m) return null;
  const ending = m[1];
  const stem = base.slice(0, -2);
  if (!stem) return null;
  const yoSpecial = orthographicYo(base);
  let forms;
  if (ending === "ar") {
    forms = ["o", "as", "a", "amos", "áis", "an"];
  } else if (ending === "er") {
    forms = ["o", "es", "e", "emos", "éis", "en"];
  } else {
    forms = ["o", "es", "e", "imos", "ís", "en"];
  }
  return forms.map((f, i) => (i === 0 && yoSpecial ? yoSpecial : stem + f));
}

/** 主入口：lemma（小写）→ "yo xxx, tú xxx, …" 或 null（无法可靠变位） */
export function conjugatePresent(lemma) {
  if (!lemma) return null;
  const word = lemma.toLowerCase().trim();
  // 短语、含空格/加号/标点、纯功能词 → 不可靠
  if (!/^[a-záéíóúñü]+$/.test(word)) return null;
  // 反身动词先剥掉 se 再判断结尾（aburrirse → aburrir）
  const bare = /se$/.test(word) && word.length > 4 ? word.slice(0, -2) : word;
  if (!/(ar|er|ir)$/.test(bare) && !IRREGULAR_FULL[word] && !IRREGULAR_FULL[bare]) {
    return null;
  }

  // 完整表直接命中（含反身动词的带代词形式）
  if (IRREGULAR_FULL[word]) {
    const f = IRREGULAR_FULL[word];
    if (Array.isArray(f) && f.length === 6 && !/placeholder|→/.test(f.join(""))) {
      return joinPersons(f);
    }
  }

  // 反身动词：xxxse → 对词干变位后附加 me/te/se/nos/os/se
  if (/se$/.test(word) && word.length > 4) {
    const base = word.slice(0, -2);
    const forms = regularConjugate(base);
    if (!forms) return null;
    const refl = ["me", "te", "se", "nos", "os", "se"];
    return joinPersons(forms.map((f, i) => `${refl[i]} ${f}`));
  }

  const forms = regularConjugate(word);
  if (!forms) return null;
  return joinPersons(forms);
}

function joinPersons(forms) {
  return PERSONS.map((p, i) => `${p} ${forms[i]}`).join(", ");
}
