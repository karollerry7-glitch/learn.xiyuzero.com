// 20 条手工精编 5D 卡（金标准，生成器不会覆盖）
// 新词条的 5D 数据由 scripts/build-fived.mjs 从 data/seeds5d/*.tsv 生成，见 data/fived.ts
import { FiveD } from "@/types";

export const FIVE_D_CORE: Record<string, FiveD> = {
  // ---------- hablar ----------
  "st-028": {
    meaning: "说；讲（语言）",
    sound: { syllables: "ha-BLAR", stress: "重音在最后一个音节 -blar（-ar 动词原形都重读词尾）" },
    grammar: [
      "规则 -ar 动词",
      "我说 → hablo，你说 → hablas，他/您说 → habla",
      "“说某种语言”直接接语言：hablar español",
    ],
    chunks: [
      { spanish: "hablar español", chinese: "说西班牙语" },
      { spanish: "hablar con alguien", chinese: "和某人说话" },
      { spanish: "hablar de algo", chinese: "谈论某事" },
    ],
    sentences: [
      { spanish: "Hablo un poco de español.", chinese: "我会说一点西班牙语。" },
      { spanish: "¿Puedo hablar con María?", chinese: "我可以和玛丽亚说话吗？" },
    ],
  },

  // ---------- la casa ----------
  "st-049": {
    meaning: "房子；家",
    sound: { syllables: "la CA-sa", stress: "重音在 ca（以元音结尾，重音自然落在倒数第二音节）" },
    grammar: [
      "定冠词 la → 阴性名词，必须一起记：la casa",
      "复数：las casas",
      "“在家”是 en casa（常省略冠词）",
    ],
    chunks: [
      { spanish: "en casa", chinese: "在家" },
      { spanish: "volver a casa", chinese: "回家" },
      { spanish: "mi casa", chinese: "我家" },
    ],
    sentences: [
      { spanish: "Mi casa es pequeña.", chinese: "我的房子很小。" },
      { spanish: "Estoy en casa.", chinese: "我在家。" },
    ],
  },

  // ---------- el problema ----------
  "st-121": {
    meaning: "问题；麻烦",
    sound: { syllables: "el pro-BLE-ma", stress: "重音在 ble（以元音结尾，倒数第二音节）" },
    grammar: [
      "定冠词 el → 阳性名词：el problema（虽然以 -ma 结尾，但源自希腊语的 -ma 词多为阳性）",
      "复数：los problemas",
    ],
    chunks: [
      { spanish: "no hay problema", chinese: "没问题" },
      { spanish: "tener un problema", chinese: "遇到一个问题" },
      { spanish: "el problema es que…", chinese: "问题是……" },
    ],
    sentences: [
      { spanish: "No hay problema.", chinese: "没问题。" },
      { spanish: "Tengo un problema con el teléfono.", chinese: "我的电话出了点问题。" },
    ],
  },

  // ---------- tener ----------
  "st-018": {
    meaning: "有；拥有",
    sound: { syllables: "te-NER", stress: "重音在 -ner（-er 动词原形重读词尾）" },
    grammar: [
      "不规则动词：tengo / tienes / tiene / tenemos / tenéis / tienen",
      "tener + 名词 表示感受：tener hambre（饿）、tener sueño（困）、tener miedo（怕）——不用 estar",
      "tener que + 动词原形 = 必须做某事",
    ],
    chunks: [
      { spanish: "tener hambre", chinese: "饿" },
      { spanish: "tener que ir", chinese: "必须走了" },
      { spanish: "¿Cuántos años tienes?", chinese: "你多大了？" },
    ],
    sentences: [
      { spanish: "Tengo dos hermanos.", chinese: "我有两个兄弟。" },
      { spanish: "¿Tienes tiempo hoy?", chinese: "你今天有时间吗？" },
    ],
  },

  // ---------- tener hambre ----------
  "st-078": {
    meaning: "饿",
    sound: { syllables: "te-NER AM-bre", stress: "hambre 重音在 am；h 不发音" },
    grammar: [
      "hambre 是名词（阴性：el hambre），所以用 tener 不用 estar",
      "“我很饿”→ Tengo hambre（不是 Estoy hambre）",
    ],
    chunks: [
      { spanish: "tener mucha hambre", chinese: "很饿" },
      { spanish: "tener un poco de hambre", chinese: "有点饿" },
    ],
    sentences: [
      { spanish: "Tengo hambre, vamos a comer.", chinese: "我饿了，我们去吃饭吧。" },
      { spanish: "¿Tienes hambre?", chinese: "你饿吗？" },
    ],
  },

  // ---------- tener sueño ----------
  "st-079": {
    meaning: "困；想睡觉",
    sound: { syllables: "te-NER SUE-ño", stress: "sueño 重音在 sue；ñ 发“尼”音" },
    grammar: [
      "sueño 是名词（阳性：el sueño），用 tener 不用 estar",
      "sueño 同时有“梦”和“睡意”两个意思，tener sueño = 困",
    ],
    chunks: [
      { spanish: "tener mucho sueño", chinese: "很困" },
      { spanish: "tener un poco de sueño", chinese: "有点困" },
    ],
    sentences: [
      { spanish: "Tengo sueño, voy a dormir.", chinese: "我困了，要去睡觉了。" },
    ],
  },

  // ---------- tener miedo ----------
  "st-122": {
    meaning: "害怕",
    sound: { syllables: "te-NER MIE-do", stress: "miedo 重音在 mie" },
    grammar: [
      "miedo 是名词（阳性：el miedo），用 tener 不用 estar",
      "“害怕某物”：tener miedo de + 名词 / tener miedo a + 人",
    ],
    chunks: [
      { spanish: "tener miedo de…", chinese: "害怕……" },
      { spanish: "no tener miedo", chinese: "不怕" },
      { spanish: "¡No tengas miedo!", chinese: "别怕！" },
    ],
    sentences: [
      { spanish: "Tengo miedo de volar.", chinese: "我害怕坐飞机。" },
      { spanish: "El niño tiene miedo.", chinese: "这个孩子害怕了。" },
    ],
  },

  // ---------- tener tiempo ----------
  "st-080": {
    meaning: "有时间",
    sound: { syllables: "te-NER TIEM-po", stress: "tiempo 重音在 tiem" },
    grammar: [
      "tiempo 是名词（阳性：el tiempo），用 tener",
      "el tiempo 还有“时间；天气”之意，语境区分",
    ],
    chunks: [
      { spanish: "no tener tiempo", chinese: "没时间" },
      { spanish: "tener tiempo libre", chinese: "有空闲时间" },
    ],
    sentences: [
      { spanish: "¿Tienes tiempo este fin de semana?", chinese: "你这个周末有时间吗？" },
      { spanish: "No tengo tiempo hoy.", chinese: "我今天没时间。" },
    ],
  },

  // ---------- tener ganas de ----------
  "st-081": {
    meaning: "想要；渴望（做某事）",
    sound: { syllables: "te-NER GA-nas de", stress: "ganas 重音在 ga" },
    grammar: [
      "固定词块：tener ganas de + 动词原形 / 名词",
      "ganas 永远用复数形式",
      "非常口语、极高频，是表达“想做”的首选说法",
    ],
    chunks: [
      { spanish: "tener ganas de viajar", chinese: "想去旅行" },
      { spanish: "tener ganas de verte", chinese: "想见你" },
      { spanish: "no tener ganas de nada", chinese: "什么都不想做" },
    ],
    sentences: [
      { spanish: "Tengo ganas de viajar a México.", chinese: "我想去墨西哥旅行。" },
      { spanish: "No tengo ganas de trabajar hoy.", chinese: "我今天不想工作。" },
    ],
  },

  // ---------- estar cansado ----------
  "st-083": {
    meaning: "累；疲倦",
    sound: { syllables: "es-TAR can-SA-do", stress: "estar 重音在 -tar，cansado 重音在 -sa-" },
    grammar: [
      "estar + 形容词 表示暂时状态（累是状态，不是属性）",
      "形容词要变性：男 cansado / 女 cansada",
      "“我很累”→ Estoy cansado/a",
    ],
    chunks: [
      { spanish: "estar muy cansado", chinese: "很累" },
      { spanish: "estar cansado de…", chinese: "厌倦了……" },
    ],
    sentences: [
      { spanish: "Estoy cansado, quiero descansar.", chinese: "我累了，想休息。" },
      { spanish: "Ella está cansada hoy.", chinese: "她今天很累。" },
    ],
  },

  // ---------- estar ocupado ----------
  "st-084": {
    meaning: "忙",
    sound: { syllables: "es-TAR o-cu-PA-do", stress: "ocupado 重音在 -pa-" },
    grammar: [
      "estar + 形容词 表示暂时状态",
      "形容词变性：男 ocupado / 女 ocupada",
    ],
    chunks: [
      { spanish: "estar muy ocupado", chinese: "很忙" },
      { spanish: "estar ocupado con el trabajo", chinese: "忙于工作" },
    ],
    sentences: [
      { spanish: "Estoy ocupado ahora, ¿hablamos luego?", chinese: "我现在忙，我们待会儿聊？" },
    ],
  },

  // ---------- quedar con alguien ----------
  "st-094": {
    meaning: "和某人约见",
    sound: { syllables: "ke-DAR kon AL-guien", stress: "quedar 重音在 -dar；con 轻读" },
    grammar: [
      "固定搭配：quedar con + 人（约定见面）",
      "quedar 变位规则：quedo / quedas / queda",
      "注意：quedar 单独用是“留下；位于”，约见必须带 con",
    ],
    chunks: [
      { spanish: "quedar con amigos", chinese: "和朋友约见" },
      { spanish: "quedar a las ocho", chinese: "约八点见" },
      { spanish: "¿Quedamos mañana?", chinese: "我们明天见？" },
    ],
    sentences: [
      { spanish: "¿Quieres quedar mañana?", chinese: "你明天想见面吗？" },
      { spanish: "He quedado con Ana a las siete.", chinese: "我和安娜约了七点见。" },
    ],
  },

  // ---------- depender de ----------
  "st-096": {
    meaning: "取决于；依赖",
    sound: { syllables: "de-pen-DER de", stress: "depender 重音在 -der" },
    grammar: [
      "动词必须带介词 de：depender de algo（不是 depender algo）",
      "答话“看情况”直接说：Depende.",
    ],
    chunks: [
      { spanish: "depender del precio", chinese: "取决于价格" },
      { spanish: "depender del tiempo", chinese: "看天气/时间情况" },
      { spanish: "Depende.", chinese: "看情况。" },
    ],
    sentences: [
      { spanish: "Depende del precio.", chinese: "这取决于价格。" },
      { spanish: "¿Vas mañana? — Depende del tiempo.", chinese: "你明天去吗？——看情况。" },
    ],
  },

  // ---------- viajar ----------
  "st-040": {
    meaning: "旅行",
    sound: { syllables: "via-JAR", stress: "重音在 -jar（-ar 动词重读词尾）；j 发喉音 /h/" },
    grammar: [
      "规则 -ar 动词：viajo / viajas / viaja",
      "“去某地旅行”：viajar a + 地点",
    ],
    chunks: [
      { spanish: "viajar a México", chinese: "去墨西哥旅行" },
      { spanish: "viajar en avión", chinese: "坐飞机旅行" },
      { spanish: "me gusta viajar", chinese: "我喜欢旅行" },
    ],
    sentences: [
      { spanish: "Me gusta viajar en tren.", chinese: "我喜欢坐火车旅行。" },
      { spanish: "Quiero viajar a España.", chinese: "我想去西班牙旅行。" },
    ],
  },

  // ---------- el viaje ----------
  "st-072": {
    meaning: "旅行；旅程",
    sound: { syllables: "el VIA-je", stress: "重音在 via；j 发喉音 /h/" },
    grammar: [
      "定冠词 el → 阳性名词：el viaje",
      "复数：los viajes",
      "动词“去旅行”用 hacer：hacer un viaje",
    ],
    chunks: [
      { spanish: "hacer un viaje", chinese: "去旅行" },
      { spanish: "buen viaje", chinese: "旅途愉快" },
      { spanish: "el viaje de negocios", chinese: "商务旅行" },
    ],
    sentences: [
      { spanish: "El viaje fue muy bonito.", chinese: "这次旅行很美好。" },
      { spanish: "¡Buen viaje!", chinese: "旅途愉快！" },
    ],
  },

  // ---------- hacer un viaje ----------
  "st-097": {
    meaning: "去旅行",
    sound: { syllables: "a-CER un VIA-je", stress: "hacer 的 h 不发音，重音在 -cer" },
    grammar: [
      "西语不说“viajar un viaje”，固定用 hacer un viaje",
      "hacer 不规则：hago / haces / hace",
    ],
    chunks: [
      { spanish: "hacer un viaje a…", chinese: "去……旅行" },
      { spanish: "hacer un viaje largo", chinese: "长途旅行" },
    ],
    sentences: [
      { spanish: "Queremos hacer un viaje a México.", chinese: "我们想去墨西哥旅行。" },
    ],
  },

  // ---------- porque ----------
  "st-101": {
    meaning: "因为",
    sound: { syllables: "POR-que", stress: "连读为一个词，重音在 por" },
    grammar: [
      "回答 ¿por qué?（为什么）时用 porque",
      "区分：porque（因为，连写）≠ por qué（为什么，分写）",
    ],
    chunks: [
      { spanish: "porque sí", chinese: "不为什么；就是这样" },
      { spanish: "porque quiero", chinese: "因为我想" },
    ],
    sentences: [
      { spanish: "No voy porque estoy cansado.", chinese: "我不去，因为我累了。" },
      { spanish: "—¿Por qué? —Porque sí.", chinese: "——为什么？——不为什么。" },
    ],
  },

  // ---------- por eso ----------
  "st-105": {
    meaning: "所以；因此",
    sound: { syllables: "por E-so", stress: "重音在 e" },
    grammar: [
      "连接结果：前句是原因，por eso 引出结果",
      "方向别搞反：porque = 因为（接原因），por eso = 所以（接结果）",
    ],
    chunks: [
      { spanish: "por eso no voy", chinese: "所以我不去" },
      { spanish: "y por eso…", chinese: "所以……" },
    ],
    sentences: [
      { spanish: "Estoy cansado, por eso voy a dormir.", chinese: "我很累，所以我要去睡觉。" },
      { spanish: "Llueve, por eso me quedo en casa.", chinese: "下雨了，所以我待在家里。" },
    ],
  },

  // ---------- aunque ----------
  "st-123": {
    meaning: "虽然；尽管",
    sound: { syllables: "AUN-que", stress: "重音在 aun（au 是双元音，一个音节）" },
    grammar: [
      "引导让步从句：aunque + 句子",
      "A1 阶段先掌握“虽然……但是……”的基本句型即可",
    ],
    chunks: [
      { spanish: "aunque llueva", chinese: "即使下雨" },
      { spanish: "aunque es difícil", chinese: "虽然很难" },
    ],
    sentences: [
      { spanish: "Aunque estoy cansado, voy a trabajar.", chinese: "虽然我很累，我还是要去工作。" },
      { spanish: "Me gusta, aunque es caro.", chinese: "我喜欢它，虽然有点贵。" },
    ],
  },

  // ---------- estar de acuerdo ----------
  "st-095": {
    meaning: "同意",
    sound: { syllables: "es-TAR de a-KUER-do", stress: "acuerdo 重音在 -kuer-" },
    grammar: [
      "固定词块：estar de acuerdo (con + 人/事)",
      "“我同意”→ Estoy de acuerdo；不同意加 no",
    ],
    chunks: [
      { spanish: "estar de acuerdo contigo", chinese: "同意你" },
      { spanish: "no estar de acuerdo", chinese: "不同意" },
      { spanish: "¡De acuerdo!", chinese: "好的！/ 一言为定！" },
    ],
    sentences: [
      { spanish: "Estoy de acuerdo contigo.", chinese: "我同意你的看法。" },
      { spanish: "—¿Mañana a las ocho? —De acuerdo.", chinese: "——明天八点？——好的。" },
    ],
  },

  // ---------- 微型交流试点 6 词（2026-10-21，配套 comm-core.ts） ----------
  "st-124": {
    meaning: "包裹",
    sound: { syllables: "el pa-QUE-te", stress: "重音在 que（以元音结尾，倒数第二音节）" },
    grammar: [
      "定冠词 el → 阳性名词：el paquete",
      "复数：los paquetes",
      "寄包裹：enviar un paquete；收包裹：recibir un paquete",
    ],
    chunks: [
      { spanish: "enviar un paquete", chinese: "寄包裹" },
      { spanish: "recoger el paquete", chinese: "取包裹" },
      { spanish: "mañana por la mañana", chinese: "明天上午" },
    ],
    sentences: [
      { spanish: "¿Puede traer el paquete mañana por la mañana?", chinese: "您能明天上午把包裹送来吗？" },
      { spanish: "Voy a enviar un paquete a mi madre.", chinese: "我要给我妈寄一个包裹。" },
    ],
  },

  "st-125": {
    meaning: "地址",
    sound: { syllables: "la di-rec-CIÓN", stress: "重音在 ción（-ción 结尾重读最后一个音节）" },
    grammar: [
      "定冠词 la → 阴性名词：la dirección",
      "问寄到哪个地址：¿A qué dirección (lo envío)?",
      "邮箱地址：el correo (electrónico)",
    ],
    chunks: [
      { spanish: "¿a qué dirección?", chinese: "寄到哪个地址？" },
      { spanish: "la dirección de envío", chinese: "收货地址" },
      { spanish: "dar la dirección", chinese: "告知地址" },
    ],
    sentences: [
      { spanish: "¿A qué dirección envío el paquete?", chinese: "包裹寄到哪个地址？" },
      { spanish: "Vivo en la calle Gran Vía, número 45.", chinese: "我住在 Gran Vía 大街 45 号。" },
    ],
  },

  "st-126": {
    meaning: "约见面；约时间",
    sound: { syllables: "que-DAR", stress: "重音在 -dar（-ar 动词原形重读词尾）" },
    grammar: [
      "规则 -ar 动词：yo quedo, tú quedas, él queda",
      "约见面最常用第一人称复数：¿Quedamos el lunes?（我们约周一见，好吗？）",
      "和某人约见面：quedar con alguien",
    ],
    chunks: [
      { spanish: "¿quedamos el lunes?", chinese: "我们约周一见？" },
      { spanish: "quedar con alguien", chinese: "和某人约见面" },
      { spanish: "quedar a las cinco", chinese: "约在五点" },
    ],
    sentences: [
      { spanish: "¿Quedamos el miércoles en la biblioteca?", chinese: "我们约周三在图书馆见，好吗？" },
      { spanish: "Lo siento, el viernes no puedo.", chinese: "不好意思，周五我不行。" },
    ],
  },

  "st-127": {
    meaning: "几点（钟）？",
    sound: { syllables: "a qué HO-ra", stress: "重音在 qué（疑问词自然重读）" },
    grammar: [
      "问具体钟点：¿A qué hora + 动词？",
      "回答：a las + 数字（a las diez = 10 点）",
      "问「现在几点」是 ¿Qué hora es?——两者不要混",
    ],
    chunks: [
      { spanish: "¿a qué hora abre?", chinese: "几点开门？" },
      { spanish: "¿a qué hora llega?", chinese: "几点到？" },
      { spanish: "¿a qué hora empezamos?", chinese: "我们几点开始？" },
    ],
    sentences: [
      { spanish: "¿A qué hora abre el museo?", chinese: "博物馆几点开门？" },
      { spanish: "El tren llega a las ocho.", chinese: "火车 8 点到。" },
    ],
  },

  "st-128": {
    meaning: "更便宜",
    sound: { syllables: "más ba-RA-to", stress: "重音在 ra（baRAto，倒数第二音节）" },
    grammar: [
      "más + 形容词 = 更……（比较级不需要变词尾）",
      "barato 随名词变性：el modelo barato / la opción barata",
      "更贵是 más caro",
    ],
    chunks: [
      { spanish: "¿hay algo más barato?", chinese: "有更便宜的吗？" },
      { spanish: "un poco más barato", chinese: "再便宜一点" },
      { spanish: "más económico", chinese: "更实惠" },
    ],
    sentences: [
      { spanish: "¿Tiene uno más barato?", chinese: "有更便宜一点的吗？" },
      { spanish: "Este modelo es más económico.", chinese: "这款更实惠。" },
    ],
  },

  "st-129": {
    meaning: "更慢一点",
    sound: { syllables: "más des-PA-cio", stress: "重音在 pa（desPAcio，倒数第二音节）" },
    grammar: [
      "despacio 是副词，修饰动词，不变阴阳性",
      "hablar despacio = 慢慢说；más despacio = 再慢一点",
      "同义：más lento（更慢）",
    ],
    chunks: [
      { spanish: "hablar más despacio", chinese: "说慢一点" },
      { spanish: "¿puede repetir más despacio?", chinese: "您能慢一点再说一遍吗？" },
      { spanish: "más despacio, por favor", chinese: "请慢一点" },
    ],
    sentences: [
      { spanish: "¿Puede hablar más despacio, por favor?", chinese: "您能说慢一点吗？" },
      { spanish: "Todavía es muy rápido para mí.", chinese: "对我来说还是太快了。" },
    ],
  },
};
