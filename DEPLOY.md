# 西语Zero Learn — 部署与域名绑定指南

项目：Next.js 16 + TypeScript + Tailwind CSS 4（App Router，全静态页面）
目标地址：https://learn.xiyuzero.com
主站：https://xiyuzero.com （不受影响）

---

## 一、部署到 Vercel（两种方式任选）

### 方式 A：Vercel 控制台导入（推荐，零命令行）

1. 把 `xiyuzero-learn` 目录推送到一个 Git 仓库（GitHub / GitLab / Bitbucket 均可，私有仓库也行）。
2. 打开 https://vercel.com/new → 选择该仓库 → Import。
3. Framework Preset 会自动识别为 **Next.js**，Root Directory 选择仓库中的 `xiyuzero-learn`（如果它在子目录）。
4. Build Command `next build`、Output 默认即可，**不需要任何环境变量**。
5. 点 Deploy。构建在 Vercel 云端完成，约 1-2 分钟。
6. 部署成功后会得到一个 `*.vercel.app` 地址（例如 `xiyuzero-learn.vercel.app`）。

### 方式 B：Vercel CLI（需要 Access Token）

```bash
npm i -g vercel
vercel login            # 或在 https://vercel.com/account/tokens 创建 Token
cd xiyuzero-learn
vercel deploy --prod --token=<YOUR_TOKEN>
```

> 注意：Windows 上本地构建模式可能因 symlink 权限失败；
> 带 token 的部署是**云端构建**，不受此影响。

---

## 二、绑定 learn.xiyuzero.com

### ① Vercel 需要添加的 Domain

进入项目 → **Settings → Domains → Add Domain**，输入：

```
learn.xiyuzero.com
```

Vercel 会提示需要使用 CNAME 验证，并显示目标值：

```
cname.vercel-dns.com
```

### ② xiyuzero.com 需要新增的 DNS 记录

xiyuzero.com 的 DNS 在腾讯云 DNSPod 管理（console.cloud.tencent.com）：

1. 打开 **DNSPod → 我的域名 → xiyuzero.com → 添加记录**。
2. 添加如下记录：

| 主机记录 | 记录类型 | 记录值 | TTL |
|---------|---------|--------|-----|
| `learn` | `CNAME` | `cname.vercel-dns.com` | 600（默认即可） |

注意：
- **不要**改动主站 `@` 和 `www` 的现有记录，主站不受影响。
- 不需要购买任何新域名。
- 记录类型必须是 **CNAME**，不是 A 记录。

### ③ CNAME 验证

1. DNS 记录保存后，回到 Vercel 的 Domains 页面点 **Verify / Refresh**。
2. DNS 生效通常 1-10 分钟（最长 24 小时）。
3. 验证通过后 Vercel 会**自动签发 HTTPS 证书**（Let's Encrypt），无需手动操作。
4. 完成：https://learn.xiyuzero.com 即可访问。

### ④ 如果 Vercel 要求额外验证

只有在把 `learn.xiyuzero.com` 添加到 Vercel 时，如果它提示需要验证**域名所有权**（一般添加子域名不需要），按提示在 DNSPod 再加一条它给出的 `TXT` 记录（主机记录通常是 `_vercel`），保存后回 Vercel 点 Verify 即可。

---

## 三、部署检查清单

- [ ] `*.vercel.app` 地址能打开，首次进入出现 Onboarding
- [ ] 走完引导 → Dashboard → 开始今日学习 → 卡片/发音/回忆/SRS 正常
- [ ] 刷新页面进度仍在（LocalStorage）
- [ ] Domains 里 `learn.xiyuzero.com` 状态为 ✅ Valid
- [ ] https://learn.xiyuzero.com 可访问且带有效证书

---

## 四、后续升级预留

- 数据层集中在 `lib/store.ts`（LocalStorage），未来替换为 Supabase 时只需重写该文件的读写实现。
- SRS 算法独立在 `lib/srs.ts`，可直接替换为 FSRS。
- `public/manifest.json` 已就位，PWA 只需再加 Service Worker。
- 词库在 `data/units.ts`，按 Learning Unit 结构扩展即可（规划 4500：Starter 200 / A1 600 / A2 900 / B1 1200 / B2 1600）。
