// ============================================================
// 微型交流任务数据 — 20 个试点单元（Make It Stick 增量优化，2026-10-21）
//
// 结构：6 个新增词（st-124~129，5D 卡见 fived-core.ts）
//     + 14 个已有词挂交流任务（id 对应词库现有词条）
// 功能覆盖：请求寄送 / 请求帮助 / 表达需要 / 询价讲价 / 约时间 /
//           询问位置 / 请求重复 / 外贸单据（发票·收据·订单·运费）/ 购物试穿 / 留言转告
//
// ⚠️ 正则 pattern 按「重音不敏感的小写文本」书写：
//    客户端 grade.ts 的 loose() 会把 ñ→n、á→a（baño→"bano"、dirección→"direccion"）
//
// 判分语义（对应产品 spec §6）：
//   key      = 必须全部命中的关键语义（缺失 → 交流未通过）
//   rejects  = 关键错误（错误数量/时间/否定），一票否决，不可被其他得分抵消
//   target   = 目标表达；未命中 → 交流可成功，但不记该词主动产出证据
// ============================================================

import { CommTask } from "@/types";

export const COMM_CORE: Record<string, CommTask> = {
  // ========== enviar（A2·a2-003）完整演示：请求寄送 → 数量变化 → 迁移（角色反转） ==========
  "a2-003": {
    goal: "用西语请人寄送物品，并就数量和时间协商",
    scenario:
      "你在外贸公司工作，客户要求本周五前收到货。你需要用西语向仓库同事确认：能不能在星期五寄出 50 件。",
    task: "请用西语向对方确认：能否在星期五寄出 50 件？（说清数量和时间）",
    check: {
      key: [
        { label: "数量：50（件）", any: ["\\b50\\b", "cincuenta"] },
        { label: "时间：星期五", any: ["viernes"] },
        {
          label: "寄送动作（寄/发送）",
          any: ["envi", "manda", "mandar", "hacer el envio", "salir el envio"],
        },
      ],
      rejects: [
        {
          message: "数量错误：任务要求周五寄 50 件（不是 15/5/500 件）——关键数量错误，交流不通过",
          any: ["\\b15\\b", "quince\\b", "\\b5\\b", "cinco\\b", "\\b500\\b"],
        },
      ],
      target: { label: "enviar（寄送）", any: ["envi"] },
    },
    reference: [
      "¿Puedes enviarme 50 unidades el viernes?",
      "¿Puedes enviar 50 unidades el viernes, por favor?",
      "¿Es posible enviar las 50 unidades el viernes?",
    ],
    followUp: {
      prompt: "El viernes solo puedo enviar 30. ¿Está bien?",
      promptZh: "周五我只能寄出 30 件，可以吗？",
      task: "请用西语回应：接受这个安排，并问问剩下的 20 件什么时候能寄。",
      check: {
        key: [
          {
            label: "接受或协商（可以/没问题）",
            any: ["esta bien", "está bien", "vale", "de acuerdo", "perfecto", "\\bsi\\b", "ok", "no problema"],
          },
          {
            label: "追问剩余 20 件（何时/剩下的）",
            any: ["\\b20\\b", "veinte", "restant", "los otros", "el resto", "cuando", "cuándo"],
          },
        ],
      },
      reference: [
        "Está bien. ¿Y los otros 20, cuándo los puede enviar?",
        "Vale, el viernes 30. ¿Cuándo me envía los 20 restantes?",
        "De acuerdo, ¿puede enviar los otros 20 el lunes?",
      ],
    },
    transfer: {
      scenario:
        "角色变了：现在你是仓库一方，客户在问什么时候能寄货。请告诉对方：你周一可以寄出 20 件，并问对方寄到哪个地址。",
      task: "请用西语表达：周一寄 20 件 + 询问收货地址。",
      check: {
        key: [
          { label: "时间：星期一", any: ["lunes"] },
          { label: "数量：20（件）", any: ["\\b20\\b", "veinte"] },
          {
            label: "询问地址",
            any: ["direccion", "domicilio", "a donde", "adonde", "donde lo envio", "a cual", "envio las"],
          },
        ],
        rejects: [
          {
            message: "数量错误：你只能寄 20 件（不是 50/200 件）——关键数量错误",
            any: ["\\b50\\b", "cincuenta", "\\b200\\b"],
          },
        ],
        target: { label: "enviar（寄送）", any: ["envi"] },
      },
      reference: [
        "El lunes puedo enviar 20 unidades. ¿A qué dirección las envío?",
        "Puedo enviar 20 el lunes. ¿Me da su dirección de envío?",
      ],
    },
    commonErrors: [
      "enviar 是原形：对 tú 用 puedes enviar，不要说 puedes envías",
      "enviarme =「给我寄」（enviar + me）",
      "对方说只能寄 30 时，剩余数量是 20（50 − 30）",
    ],
  },

  // ========== poder（Starter·st-023）请求帮助 ==========
  "st-023": {
    goal: "用西语礼貌地请求对方做一件小事",
    scenario: "你在旅途中，行李很重，想让旁边的人帮你把箱子放进行李架。",
    task: "请用西语问对方：能不能帮个忙？",
    check: {
      key: [
        {
          label: "请求（能否/请帮忙）",
          any: ["puedes", "puede", "podria", "podrias", "seria posible", "me ayuda", "ayudarme", "ayudar", "por favor"],
        },
      ],
      target: { label: "poder（能否请求）", any: ["puedes", "puede", "podria", "podrias", "puedo"] },
    },
    reference: ["¿Puedes ayudarme, por favor?", "¿Me puedes ayudar con la maleta?", "¿Podría ayudarme, por favor?"],
    followUp: {
      prompt: "Claro, ¿la pongo aquí?",
      promptZh: "当然可以，放这里吗？",
      task: "请用西语回应：好的，谢谢（或告诉对方放哪里）。",
      check: {
        key: [
          { label: "回应（好的/谢谢/位置）", any: ["\\bsi\\b", "está bien", "esta bien", "vale", "gracias", "arriba", "ahi", "ahí", "allí"] },
        ],
      },
      reference: ["Sí, gracias. Ahí está bien.", "Vale, perfecto. ¡Gracias!"],
    },
  },

  // ========== necesitar（Starter·st-024）表达需要 ==========
  "st-024": {
    goal: "用西语说明自己需要什么",
    scenario: "你在五金店，需要一把锤子（un martillo），店员走过来问你需要什么。",
    task: "请用西语告诉店员：你需要一把锤子。",
    check: {
      key: [
        { label: "需要", any: ["necesito", "necesita", "quiero", "busco", "estoy buscando"] },
        { label: "物品：锤子", any: ["martillo"] },
      ],
      target: { label: "necesitar（需要）", any: ["necesit"] },
    },
    reference: ["Necesito un martillo, por favor.", "Busco un martillo.", "Quiero un martillo, por favor."],
    followUp: {
      prompt: "¿Para qué lo necesita?",
      promptZh: "您需要它做什么？",
      task: "请用西语回应：用来挂一幅画。",
      check: {
        key: [{ label: "用途：挂画", any: ["colgar", "cuadro", "para colgar"] }],
      },
      reference: ["Es para colgar un cuadro.", "Para colgar un cuadro en la pared."],
    },
  },

  // ========== costar（A2·a2-018）询价 ==========
  "a2-018": {
    goal: "用西语询问价格",
    scenario: "你在纪念品店看中一件手工艺品，想知道多少钱。",
    task: "请用西语问这个东西的价格。",
    check: {
      key: [
        { label: "多少钱（多少/价格）", any: ["cuanto", "cuesta", "cuestan", "precio", "vale", "es cuanto"] },
      ],
      target: { label: "costar（花费）", any: ["cuesta", "cuestan", "costar"] },
    },
    reference: ["¿Cuánto cuesta?", "¿Cuánto vale esto?", "¿Cuánto es, por favor?"],
    followUp: {
      prompt: "Cuesta 25 euros.",
      promptZh: "25 欧元。",
      task: "你觉得有点贵，请用西语问：能不能便宜一点？",
      check: {
        key: [
          { label: "讲价（便宜点/折扣）", any: ["barato", "descuento", "menos", "caro", "regalo", "oferta", "rebaja"] },
        ],
      },
      reference: ["Es un poco caro. ¿Me puede hacer un descuento?", "¿Puede ser un poco más barato?"],
    },
  },

  // ========== el descuento（A2·a2-124）讲价 ==========
  "a2-124": {
    goal: "用西语询问买多件是否有折扣",
    scenario: "你在买 3 件 T 恤，想问店员买多件有没有折扣。",
    task: "请用西语问：买 3 件有折扣吗？",
    check: {
      key: [
        { label: "数量：3（件）", any: ["\\b3\\b", "tres"] },
        { label: "折扣", any: ["descuento", "rebaja", "oferta", "mas barato"] },
      ],
      target: { label: "el descuento（折扣）", any: ["descuento", "rebaja", "oferta"] },
    },
    reference: ["Si compro tres, ¿hay descuento?", "¿Tienen alguna oferta por comprar 3 camisetas?", "¿Hay descuento por tres?"],
    followUp: {
      prompt: "Sí, con tres camisetas tiene un 10% de descuento.",
      promptZh: "买三件有 10% 的折扣。",
      task: "请用西语回应：接受，就买三件。",
      check: {
        key: [
          { label: "接受（好/就买三件）", any: ["\\bsi\\b", "vale", "está bien", "esta bien", "perfecto", "de acuerdo", "ok", "las tres", "los tres"] },
        ],
      },
      reference: ["Perfecto, me llevo las tres.", "Está bien, quiero las tres camisetas."],
    },
  },

  // ========== la factura（A2·a2-125）要发票 ==========
  "a2-125": {
    goal: "用西语索要发票",
    scenario: "公司采购，付款后你需要向店员要一张发票报销。",
    task: "请用西语向店员要一张发票。",
    check: {
      key: [
        { label: "发票", any: ["factura"] },
        { label: "请求（能给/我需要/开）", any: ["puede", "puedes", "necesito", "quiero", "me da", "me hace", "hacer", "poner", "puedo"] },
      ],
      target: { label: "la factura（发票）", any: ["factura"] },
    },
    reference: ["¿Me puede hacer una factura, por favor?", "Necesito una factura, por favor.", "¿Puede darme una factura?"],
    followUp: {
      prompt: "¿A nombre de quién la hago?",
      promptZh: "发票抬头开给谁？",
      task: "请用西语回应：公司抬头（沃天澜公司），可以顺便留邮箱。",
      check: {
        key: [
          { label: "开票信息（公司名/抬头/邮箱）", any: ["empresa", "compania", "a nombre de", "sociedad", "correo", "xiyuzero", "mi nombre"] },
        ],
      },
      reference: ["A nombre de la empresa XiYuZero, por favor.", "A nombre de XiYuZero S.L. Le dejo mi correo."],
    },
  },

  // ========== el recibo（A2·a2-126）出示收据 ==========
  "a2-126": {
    goal: "用西语说明自己有购买凭证",
    scenario: "你想退换商品，客服要求出示购买凭证。",
    task: "请用西语告诉客服：你有收据。",
    check: {
      key: [
        { label: "收据", any: ["recibo", "ticket"] },
        { label: "有/出示", any: ["tengo", "aqui", "mir", "puedo mostrar", "guard"] },
      ],
      target: { label: "el recibo（收据）", any: ["recibo"] },
    },
    reference: ["Sí, tengo el recibo.", "Aquí tengo el recibo.", "Tengo el ticket de la compra."],
    followUp: {
      prompt: "Muy bien, ¿recuerda la fecha de la compra?",
      promptZh: "好的，还记得购买的日期吗？",
      task: "请用西语回应：记得，是上周六。",
      check: {
        key: [{ label: "时间（上周六/某日期）", any: ["sabado", "pasado", "semana pasada", "ultima semana", "ayer", "\\b\\d{1,2}\\b"] }],
      },
      reference: ["Sí, fue el sábado pasado.", "La semana pasada, el sábado."],
    },
  },

  // ========== el pedido（B1·b1-196）订单确认 ==========
  "b1-196": {
    goal: "用西语向供应商确认订单与交期",
    scenario: "你是采购，昨天向供应商下了一笔配件订单，想打电话确认。",
    task: "请用西语向供应商确认：他们是否已经收到你的订单。",
    check: {
      key: [
        { label: "订单", any: ["pedido", "orden", "encargo"] },
        { label: "确认/收到", any: ["recib", "confirm", "lleg", "recibi"] },
      ],
      target: { label: "el pedido（订单）", any: ["pedido", "encargo"] },
    },
    reference: ["¿Han recibido nuestro pedido?", "Quiero confirmar que recibieron mi pedido.", "¿Ha llegado nuestro pedido?"],
    followUp: {
      prompt: "Sí, lo recibimos ayer. Lo enviamos el jueves.",
      promptZh: "收到了，昨天收到的。我们周四发货。",
      task: "请用西语追问：大约什么时候能到（要多久）。",
      check: {
        key: [{ label: "追问到货时间", any: ["cuando", "cuanto tarda", "tarda", "llega", "llegaria", "tiempo de entrega", "llegada"] }],
      },
      reference: ["¿Cuánto tarda la entrega?", "¿Cuándo llega más o menos?", "¿El viernes llegaría?"],
    },
  },

  // ========== el envío（B2·b2-2844）运费 ==========
  "b2-2844": {
    goal: "用西语询问运费与发货条件",
    scenario: "网购结账时，你想问这个订单的运费多少钱、是否免费。",
    task: "请用西语问：这个订单的运费多少钱？",
    check: {
      key: [
        { label: "运费", any: ["envio", "gastos de envio", "coste de envio", "costo de envio", "porte"] },
        { label: "多少钱/是否免费", any: ["cuanto", "cuesta", "precio", "gratis", "vale"] },
      ],
      target: { label: "el envío（运费/寄送）", any: ["envio"] },
    },
    reference: ["¿Cuánto cuestan los gastos de envío?", "¿Cuánto es el envío?", "¿El envío es gratis?"],
    followUp: {
      prompt: "El envío es gratis a partir de 50 euros.",
      promptZh: "满 50 欧元免运费。",
      task: "请用西语追问：如果不满 50 欧，运费是多少？",
      check: {
        key: [{ label: "追问不满 50 欧的情况", any: ["menos de", "por debajo", "si no llego", "no llego", "menos", "si compro menos"] }],
      },
      reference: ["¿Y si compro menos de 50, cuánto es?", "¿Y si el pedido no llega a 50 euros?"],
    },
  },

  // ========== probar（A1·a1-079）试穿 ==========
  "a1-079": {
    goal: "用西语请求试穿/试用",
    scenario: "你在店里看中一件外套，想试试看合不合身。",
    task: "请用西语问店员：可以试穿吗？",
    check: {
      key: [
        { label: "试（试穿/试用）", any: ["probar", "probarme", "probarse", "pruebo"] },
        { label: "请求（可以/能）", any: ["puedo", "puede", "se puede", "es posible", "me deja", "deja"] },
      ],
      target: { label: "probar（试）", any: ["probar", "probarme", "pruebo"] },
    },
    reference: ["¿Me puedo probar esta chaqueta?", "¿Puedo probarla?", "¿Me la puedo probar, por favor?"],
    followUp: {
      prompt: "Sí, claro. El probador está al fondo.",
      promptZh: "可以，试衣间在最里面。",
      task: "请用西语回应：好的谢谢（或再要一个 40 码）。",
      check: {
        key: [{ label: "回应（好的/谢谢/要尺码）", any: ["gracias", "vale", "está bien", "esta bien", "talla", "\\b40\\b", "medida", "\\bsi\\b"] }],
      },
      reference: ["Gracias. ¿Tiene la talla 40?", "Vale, gracias. ¿Hay una talla 40?"],
    },
  },

  // ========== repetir（A2·a2-034）请求重复 ==========
  "a2-034": {
    goal: "用西语请对方重复刚才说的话",
    scenario: "电话里对方说了一个地址，你没听清。",
    task: "请用西语请对方再说一遍。",
    check: {
      key: [
        { label: "重复（再说一遍/重复）", any: ["repetir", "repetirlo", "repita", "repite", "otra vez", "de nuevo"] },
        { label: "请求（能/请）", any: ["puede", "puedes", "podria", "por favor", "me lo"] },
      ],
      target: { label: "repetir（重复）", any: ["repetir", "repita", "repite"] },
    },
    reference: ["¿Puede repetir, por favor?", "¿Puede repetirlo, por favor?", "¿Lo puede repetir otra vez?"],
    followUp: {
      prompt: "Claro: Calle Mayor 12, tercero izquierda.",
      promptZh: "好的：Gran Mayor 街 12 号，3 楼左门。",
      task: "请用西语回应：复述确认门牌号 12，或确认你听懂了。",
      check: {
        key: [{ label: "确认（门牌 12/街道/听懂了）", any: ["\\b12\\b", "mayor", "perfecto", "entendido", "está bien", "esta bien", "vale", "\\bsi\\b"] }],
      },
      reference: ["Calle Mayor 12, ¿verdad? Perfecto.", "¿El número 12, sí? Entendido, gracias."],
    },
  },

  // ========== el baño（Starter·st-075）询问位置 ==========
  "st-075": {
    goal: "用西语询问洗手间在哪里",
    scenario: "你在车站想找洗手间，向工作人员询问。",
    task: "请用西语问：洗手间在哪里？",
    check: {
      key: [
        { label: "洗手间", any: ["bano", "servicio", "aseo", "wc"] },
        { label: "在哪里", any: ["donde", "esta", "qued", "hay"] },
      ],
      target: { label: "el baño（洗手间）", any: ["bano"] },
    },
    reference: ["¿Dónde está el baño, por favor?", "¿Dónde queda el baño?", "Perdone, ¿hay un baño por aquí?"],
    followUp: {
      prompt: "Al fondo, a la derecha.",
      promptZh: "在最里面，右手边。",
      task: "请用西语回应：道谢，或确认位置（最里面右手边对吗）。",
      check: {
        key: [{ label: "回应（谢谢/确认位置）", any: ["gracias", "muchas", "vale", "está bien", "esta bien", "derecha", "fondo", "perfecto"] }],
      },
      reference: ["¡Gracias!", "¿A la derecha, al fondo? ¡Gracias!"],
    },
  },

  // ========== el mensaje（A2·a2-112）留言转告 ==========
  "a2-112": {
    goal: "用西语留言告知自己会晚到",
    scenario: "你要迟到了，请朋友帮忙转告聚会组织者：你会晚到 20 分钟。",
    task: "请用西语留言：你会晚到 20 分钟。",
    check: {
      key: [
        { label: "晚到/迟到", any: ["tarde", "tard", "retras", "llego tarde"] },
        { label: "20 分钟", any: ["\\b20\\b", "veinte"] },
      ],
      rejects: [
        { message: "时间数量错误：你晚到的时间是 20 分钟（不是 10/30/200 分钟）", any: ["\\b200\\b", "\\b30\\b\\s*min", "\\b10\\b\\s*min"] },
      ],
      target: { label: "el mensaje（消息）/留言表达", any: ["mensaje", "dile", "avisa", "llego", "voy a llegar", "aviso"] },
    },
    reference: ["Llego 20 minutos tarde.", "Voy a llegar 20 minutos tarde.", "Perdón, llego con 20 minutos de retraso."],
    followUp: {
      prompt: "Vale, te esperamos. ¿Vienes en taxi?",
      promptZh: "好的，我们等你。你坐出租车来吗？",
      task: "请用西语回应：说是坐出租车（或不是，坐地铁）。",
      check: {
        key: [{ label: "回应交通方式（出租车/地铁/是/否）", any: ["taxi", "metro", "\\bsi\\b", "\\bno\\b", "autobus", "bus", "camino", "ando"] }],
      },
      reference: ["Sí, voy en taxi.", "No, en metro. Ya casi llego."],
    },
  },

  // ========== la cita（B1·b1-260）预约改期 ==========
  "b1-260": {
    goal: "用西语重新约定预约时间",
    scenario: "牙医诊所通知你预约要改期，你需要约一个新时间：下周三下午 4 点。",
    task: "请用西语向诊所提议：下周三下午 4 点。",
    check: {
      key: [
        { label: "星期三", any: ["miercoles"] },
        { label: "下午/4 点", any: ["tarde", "cuatro", "\\b4\\b", "\\b16\\b"] },
      ],
      target: { label: "la cita（预约）", any: ["cita", "reunirnos", "cita el"] },
    },
    reference: ["¿El miércoles a las cuatro de la tarde?", "¿Podría ser el miércoles por la tarde, a las cuatro?", "Miércoles a las cuatro, ¿está bien?"],
    followUp: {
      prompt: "El miércoles a las cuatro está ocupado. ¿El jueves a las cinco le va bien?",
      promptZh: "周三 4 点已经约满了。周四 5 点您方便吗？",
      task: "请用西语回应：可以，周四 5 点没问题。",
      check: {
        key: [{ label: "接受周四 5 点", any: ["jueves", "está bien", "esta bien", "vale", "perfecto", "de acuerdo", "\\bsi\\b", "\\b5\\b", "cinco"] }],
      },
      reference: ["Sí, el jueves a las cinco me va bien.", "De acuerdo, el jueves a las cinco."],
    },
  },

  // ========== quedar（A1·新词 st-126）约见面 ==========
  "st-126": {
    goal: "用西语和朋友约时间一起自习",
    scenario: "你想和同学约在图书馆一起复习，先问问对方周三有没有空。",
    task: "请用西语约对方：周三一起在图书馆复习。",
    check: {
      key: [
        { label: "星期三", any: ["miercoles"] },
        { label: "约见面/一起（quedar/见面/一起）", any: ["quedar", "quedamos", "vemos", "nos vemos", "juntos", "juntas", "quedo", "revis", "estudi", "biblioteca"] },
      ],
      target: { label: "quedar（约见面）", any: ["quedar", "quedamos", "nos vemos", "vemos"] },
    },
    reference: [
      "¿Quedamos el miércoles en la biblioteca para estudiar?",
      "¿Nos vemos el miércoles en la biblioteca?",
      "¿Te parece si quedamos el miércoles para repasar?",
    ],
    followUp: {
      prompt: "El miércoles no puedo, tengo un examen. ¿El jueves?",
      promptZh: "周三不行，我有考试。周四呢？",
      task: "请用西语回应：同意周四，或提出别的时间。",
      check: {
        key: [{ label: "回应（同意周四/另约）", any: ["jueves", "vale", "está bien", "esta bien", "\\bsi\\b", "viernes", "perfecto"] }],
      },
      reference: ["Sí, el jueves me va bien.", "Vale, el jueves entonces.", "Prefiero el viernes, ¿te parece?"],
    },
    transfer: {
      scenario: "角色变化：对方约你周五去看展览，但你只有周四有空。",
      task: "请用西语告诉对方：周五不行，周四可以。",
      check: {
        key: [
          { label: "拒绝周五", any: ["viernes", "no puedo", "no me va", "imposible", "lo siento"] },
          { label: "提出周四", any: ["jueves"] },
        ],
      },
      reference: ["El viernes no puedo, pero el jueves sí.", "Lo siento, el viernes no puedo. ¿Nos vemos el jueves?"],
    },
  },

  // ========== la dirección（A1·新词 st-125）地址 ==========
  "st-125": {
    goal: "用西语说明自己的地址",
    scenario: "快递员打电话确认地址，问你家在哪条街。你住在 Gran Vía 大街 45 号 3 楼。",
    task: "请用西语告诉快递员你的地址（街道 + 门牌 + 楼层）。",
    check: {
      key: [
        { label: "街道：Gran Vía", any: ["gran via"] },
        { label: "门牌 45 / 楼层 3", any: ["\\b45\\b", "\\b3\\b", "tercero", "tercer", "piso"] },
      ],
      target: { label: "la dirección（地址）", any: ["direccion", "gran via", "vivo"] },
    },
    reference: ["Vivo en la calle Gran Vía, número 45, tercero.", "Es la Gran Vía 45, tercer piso.", "Gran Vía 45, 3º."],
    followUp: {
      prompt: "¿Hay ascensor en el edificio?",
      promptZh: "楼里有电梯吗？",
      task: "请用西语回应：有电梯（或没有），按你的情况答。",
      check: {
        key: [{ label: "回应（有/没有电梯）", any: ["\\bsi\\b", "\\bno\\b", "ascensor", "hay"] }],
      },
      reference: ["Sí, hay ascensor.", "No hay ascensor, es un tercer piso."],
    },
  },

  // ========== el paquete（A1·新词 st-124）包裹改约 ==========
  "st-124": {
    goal: "用西语请快递员改天再送包裹",
    scenario: "快递到了但你在公司，请快递员明天上午再送一次。",
    task: "请用西语请快递员：明天上午再送这个包裹。",
    check: {
      key: [
        { label: "包裹", any: ["paquete"] },
        { label: "明天（上午）", any: ["manana"] },
      ],
      target: { label: "el paquete（包裹）", any: ["paquete"] },
    },
    reference: ["¿Puede traer el paquete mañana por la mañana?", "Por favor, ¿lo trae mañana en la mañana?", "¿Puede entregar el paquete mañana por la mañana?"],
    followUp: {
      prompt: "De acuerdo, mañana entre las 9 y las 12. ¿Le parece?",
      promptZh: "好的，明天 9 点到 12 点之间，可以吗？",
      task: "请用西语回应：可以，谢谢。",
      check: {
        key: [{ label: "接受（可以/谢谢）", any: ["está bien", "esta bien", "vale", "perfecto", "de acuerdo", "\\bsi\\b", "ok", "gracias"] }],
      },
      reference: ["Está bien, gracias. Hasta mañana.", "Perfecto, muchas gracias."],
    },
  },

  // ========== ¿a qué hora?（A1·新词 st-127）问时间 ==========
  "st-127": {
    goal: "用西语询问开放时间",
    scenario: "你想去博物馆，向工作人员询问博物馆几点开门。",
    task: "请用西语问：博物馆几点开门？",
    check: {
      key: [
        { label: "几点（a qué hora）", any: ["a que hora"] },
        { label: "开门", any: ["abre", "abrir", "abren", "apertura", "horario"] },
      ],
      target: { label: "¿a qué hora?（几点）", any: ["a que hora"] },
    },
    reference: ["¿A qué hora abre el museo?", "¿A qué hora se abre el museo?", "Perdone, ¿a qué hora abre?"],
    followUp: {
      prompt: "Abre a las diez y cierra a las ocho.",
      promptZh: "10 点开门，8 点关门。",
      task: "请用西语追问：周末也是 10 点开门吗？",
      check: {
        key: [
          { label: "追问周末", any: ["sabado", "domingo", "fin de semana", "sabados", "domingos"] },
          { label: "开门/时间", any: ["abre", "abren", "horario", "diez", "a las diez"] },
        ],
      },
      reference: ["¿Y el fin de semana, también abre a las diez?", "¿Los domingos abre a las diez también?"],
    },
  },

  // ========== más barato（A1·新词 st-128）更便宜 ==========
  "st-128": {
    goal: "用西语询问有没有更便宜的选项",
    scenario: "你在对比两款耳机，想让店主给你推荐便宜一点的。",
    task: "请用西语问：有没有更便宜的？",
    check: {
      key: [
        { label: "更便宜", any: ["mas barato", "barato", "economico", "mas economico", "descuento", "oferta", "rebaja"] },
        { label: "有没有/询问", any: ["hay", "tiene", "tienen", "algun", "es posible", "puede", "quedan"] },
      ],
      target: { label: "más barato（更便宜）", any: ["barato", "economico"] },
    },
    reference: ["¿Tiene uno más barato?", "¿Hay algún modelo más barato?", "¿Hay algo más económico?"],
    followUp: {
      prompt: "Sí, este cuesta 15 euros menos, pero es otra marca.",
      promptZh: "有，这个便宜 15 欧，但是另一个牌子。",
      task: "请用西语回应：你还是想要原来那个牌子（或想看看便宜的这个）。",
      check: {
        key: [{ label: "做出选择/回应", any: ["prefiero", "misma marca", "el mismo", "el otro", "vale", "está bien", "esta bien", "quiero", "lo veo", "\\bsi\\b", "\\bno\\b"] }],
      },
      reference: ["Prefiero la misma marca, gracias.", "Vale, ¿puedo verlo?"],
    },
  },

  // ========== más despacio（A1·新词 st-129）慢一点 ==========
  "st-129": {
    goal: "用西语请对方说慢一点",
    scenario: "对方语速太快，你没跟上，需要请对方说慢一点。",
    task: "请用西语请对方：说得慢一点。",
    check: {
      key: [
        { label: "慢", any: ["despacio", "mas lento", "lento"] },
        { label: "请求（请/能）", any: ["puede", "puedes", "podria", "hablar", "por favor", "repetir", "decir"] },
      ],
      target: { label: "más despacio（慢一点）", any: ["despacio", "lento"] },
    },
    reference: ["¿Puede hablar más despacio, por favor?", "Más despacio, por favor.", "¿Puede repetir más despacio?"],
    followUp: {
      prompt: "Sí, claro. ¿Así está bien?",
      promptZh: "好的，这样可以吗？",
      task: "请用西语回应：可以，谢谢（或还是太快了，请再慢一点）。",
      check: {
        key: [{ label: "回应（可以/谢谢/仍太快）", any: ["está bien", "esta bien", "\\bsi\\b", "gracias", "todavia", "rapido", "mas despacio", "vale", "perfecto"] }],
      },
      reference: ["Sí, así está bien. Gracias.", "Todavía es muy rápido, ¿un poco más despacio?"],
    },
  },
};
