# 西语Zero Learn — 项目接手文档

> 给任何新环境（新电脑 / 新 AI 会话 / 新协作者）：读完这份文档即可接手开发。

## 项目是什么

面向中文母语者的西班牙语 0→B2 主动词汇学习系统。核心公式：
高频词块 + 真实例句 + 西语发音 + 中→西主动回忆 + 听力 + SRS 间隔重复 + 主动输出。
目标不是"背单词"，而是 Situation → Spanish 的快速调用能力。

- 线上地址：https://learn.xiyuzero.com
- 主站（无关，勿动）：https://xiyuzero.com（另一个 Vercel 项目 espanol-b1）
- 托管：Vercel 项目 `temporary-fast-nitrogen-73bq227`（账号 Michael202606）
- Git 集成：push 到 `main` → Vercel 自动构建上线（约 1-2 分钟）

## 技术栈

Next.js 16（App Router）+ TypeScript + Tailwind CSS 4，`output: "export"` 全静态导出。
无后端：学习进度 / SRS / 收藏 / 错题 / My Sentences / 设置全部存 LocalStorage（key: `xiyuzero-learn-v1`）。

## 目录结构

```
app/          页面：/(Dashboard) learn review listening levels library my stats settings onboarding
components/   AppShell（导航外壳） VocabularyCard AudioButton
data/units.ts 词库（当前 120 个 Learning Units）
lib/          srs.ts（间隔重复引擎） store.ts（LocalStorage 状态） answer.ts（答案判定）
              selectors.ts（选词逻辑）
hooks/        useSpeech.ts（TTS：es-MX 默认 / es-ES 可切，0.7/0.85/1.0x，voice 缺失自动回退）
types/        LearningUnit 等类型定义
vercel.json   ⚠️ 必须存在：声明 framework=nextjs（项目是 Vercel 认领来的，无此文件会 404）
```

## 常用命令

```bash
npm install        # 装依赖
npm run dev        # 本地开发
npm run build      # 构建（同时做类型检查，push 前必须跑通）
git push origin main   # 推送 = 自动部署上线
```

## 关键设计决策（改动前必读）

1. **名词必须带冠词学习**（la casa 而非 casa）；动词优先带搭配（depender de）；优先词块（tener ganas de）
2. **Learning Unit ≠ 单词**：可以是词 / 词块 / 搭配 / 连接词 / 句型。规划总量约 4500（Starter 200 / A1 600 / A2 900 / B1 1200 / B2 1600），不得宣传"官方 CEFR 词数"
3. **答案判定**（lib/answer.ts）：忽略大小写、重音变音符号（adios=adiós）、部分标点；拼写错误不算对；相似度 ≥0.85 判"接近正确"
4. **SRS**（lib/srs.ts）：Again 10分钟 / Hard 1天 / Good 3天 / Easy 7天，递增至 120 天；算法独立，未来可换 FSRS
5. **词汇三态**：Passive（只会 西→中）→ Active（中→西 连续正确）→ Mastered（多日期 + 多次正确），点一次"认识"不算 Mastered
6. **升级预留**：lib/store.ts 是唯一状态层，未来整体替换为 Supabase 即可；UI 语言中文，内容西班牙语
7. **配色**：背景 #F7F8FA / 主文字 #182230 / 西语红 #C62828 / 暖黄 #F4B400；卡片圆角 16-20px，轻阴影，Apple 式克制

## 已知注意事项

- 发音依赖浏览器内置西语语音（Chrome/Edge/Safari 桌面与手机均可），无 es-MX 时自动回退任意西语 voice
- LocalStorage 数据存在用户浏览器本地，清缓存会丢（未来 Supabase 云同步解决）
- 部署后验证：`curl -I https://learn.xiyuzero.com` 应为 200；若 404 先检查 vercel.json 是否还在

## 路线图

- [ ] 扩词库至 4500（按高频度/交流价值/搭配价值筛选，逐个校验冠词、词性、例句、CEFR 合理性）
- [ ] Travel / Social / Business Spanish 三个专项（Business：报价、MOQ、样品、Incoterms、谈判、售后、商务邮件/WhatsApp）
- [ ] Supabase：邮箱/Google 登录 + 学习进度云同步
- [ ] PWA 完整化（离线复习、推送提醒）→ 远期 Capacitor 上架 App Store
- [ ] AI 例句纠错 / 口语训练 / DELE 模块 / Grammar 模块
