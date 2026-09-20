// 微信支付 v3 核心库（商户 API 直连版）
// ⚠️ 全部 env-gated：未配置商户参数时 wxpayConfigured()=false，
//    API 路由据此保持 501 PAYMENT_NOT_AVAILABLE（第一版不接真实支付）。
//
// 需要的环境变量（Vercel → Settings → Environment Variables）：
//   WXPAY_MCHID        商户号
//   WXPAY_SERIAL_NO    商户 API 证书序列号
//   WXPAY_PRIVATE_KEY  商户 API 私钥（apiclient_key.pem 全文）
//   WXPAY_APIV3_KEY    APIv3 密钥（32 字节）
//   WXPAY_APPID        绑定小程序的 appid（缺省回落 WX_APPID）
//   WXPAY_NOTIFY_URL   回调地址（缺省 https://learn.xiyuzero.com/api/pay/notify）
//
// 纯函数（签名/验签/解密）与配置读取分离，便于单元测试（tests/wxpay.test.ts）。

import crypto from "node:crypto";

const API_BASE = "https://api.mch.weixin.qq.com";

/** 平台证书缓存有效期（回调验签用；微信平台证书会轮换，过期自动刷新） */
const CERT_TTL_MS = 12 * 60 * 60 * 1000;

export class WxPayError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "WxPayError";
    this.status = status;
    this.code = code;
  }
}

// ============ 配置（惰性读取，便于测试注入） ============

export interface WxPayConfig {
  mchid: string;
  appid: string;
  serialNo: string;
  privateKeyPem: string;
  apiv3Key: Buffer;
  notifyUrl: string;
}

export function wxpayConfigured(): boolean {
  return !!(
    process.env.WXPAY_MCHID &&
    process.env.WXPAY_SERIAL_NO &&
    process.env.WXPAY_PRIVATE_KEY &&
    process.env.WXPAY_APIV3_KEY &&
    (process.env.WXPAY_APPID || process.env.WX_APPID)
  );
}

function loadConfig(): WxPayConfig {
  const apiv3Key = Buffer.from(process.env.WXPAY_APIV3_KEY || "", "utf8");
  if (apiv3Key.length !== 32) {
    throw new WxPayError("WXPAY_APIV3_KEY 必须为 32 字节", 0, "CONFIG");
  }
  return {
    mchid: process.env.WXPAY_MCHID!,
    appid: process.env.WXPAY_APPID || process.env.WX_APPID!,
    serialNo: process.env.WXPAY_SERIAL_NO!,
    privateKeyPem: process.env.WXPAY_PRIVATE_KEY!,
    apiv3Key,
    notifyUrl:
      process.env.WXPAY_NOTIFY_URL ||
      "https://learn.xiyuzero.com/api/pay/notify",
  };
}

// ============ 纯函数（可直接单测） ============

/** v3 请求签名原文：METHOD\nURL(含query)\nTIMESTAMP\nNONCE\nBODY\n */
export function buildAuthorizationMessage(
  method: string,
  urlPathWithQuery: string,
  timestamp: string,
  nonce: string,
  body: string
): string {
  return `${method}\n${urlPathWithQuery}\n${timestamp}\n${nonce}\n${body}\n`;
}

/** RSA-SHA256 签名（商户私钥 / 回调验签同算法），返回 base64 */
export function signMessage(privateKeyPem: string, message: string): string {
  const sig = crypto
    .createSign("RSA-SHA256")
    .update(message)
    .sign(privateKeyPem);
  return sig.toString("base64");
}

/** RSA-SHA256 验签（输入为 base64 签名） */
export function verifyWithKey(
  publicKeyPem: string,
  message: string,
  signatureB64: string
): boolean {
  try {
    return crypto
      .createVerify("RSA-SHA256")
      .update(message)
      .verify(publicKeyPem, signatureB64, "base64");
  } catch {
    return false;
  }
}

/** AES-256-GCM 解密（回调 resource 与平台证书共用） */
export function decryptAesGcm(
  key: Buffer,
  nonce: string,
  ciphertextB64: string,
  associatedData: string | null
): string {
  const buf = Buffer.from(ciphertextB64, "base64");
  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
  if (associatedData) decipher.setAAD(Buffer.from(associatedData));
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf8");
}

/** 小程序 JSAPI 调起支付的 paySign 原文：appId\ntimeStamp\nnonceStr\npackage\n */
export function jsapiSignMessage(
  appId: string,
  timeStamp: string,
  nonceStr: string,
  pkg: string
): string {
  return `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
}

// ============ v3 请求（真实网络） ============

function randomNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** 构造 Authorization 头并发起 v3 请求；非 2xx 抛 WxPayError */
export async function v3Request<T>(
  method: "GET" | "POST",
  urlPathWithQuery: string,
  body?: object
): Promise<T> {
  const cfg = loadConfig();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomNonce();
  const bodyStr = body ? JSON.stringify(body) : "";
  const message = buildAuthorizationMessage(
    method,
    urlPathWithQuery,
    timestamp,
    nonce,
    bodyStr
  );
  const signature = signMessage(cfg.privateKeyPem, message);
  const authorization =
    `WECHATPAY2-SHA256-RSA2048 mchid="${cfg.mchid}",` +
    `nonce_str="${nonce}",signature="${signature}",` +
    `timestamp="${timestamp}",serial_no="${cfg.serialNo}"`;

  const res = await fetch(`${API_BASE}${urlPathWithQuery}`, {
    method,
    headers: {
      Authorization: authorization,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "xiyuzero-learn/1.0",
      "Wechatpay-Serial": cfg.serialNo,
    },
    body: method === "POST" && body ? bodyStr : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* 非 JSON 响应 */
  }
  if (!res.ok) {
    const err = json as { code?: string; message?: string } | null;
    throw new WxPayError(
      err?.message || `微信支付接口错误（HTTP ${res.status}）`,
      res.status,
      err?.code
    );
  }
  return json as T;
}

// ============ 平台证书（回调验签公钥来源） ============

interface PlatformCerts {
  /** serial_no → 公钥 PEM */
  publicKeys: Map<string, string>;
  loadedAt: number;
}

let certCache: PlatformCerts | null = null;

interface CertsResponse {
  data: {
    serial_no: string;
    encrypt_certificate: {
      ciphertext: string;
      nonce: string;
      associated_data: string;
    };
  }[];
}

/** 拉取并解密平台证书；成功后更新缓存 */
export async function refreshPlatformCerts(): Promise<void> {
  const cfg = loadConfig();
  const res = await v3Request<CertsResponse>("GET", "/v3/certificates");
  const map = new Map<string, string>();
  for (const item of res.data ?? []) {
    try {
      const pem = decryptAesGcm(
        cfg.apiv3Key,
        item.encrypt_certificate.nonce,
        item.encrypt_certificate.ciphertext,
        item.encrypt_certificate.associated_data
      );
      const cert = new crypto.X509Certificate(pem);
      map.set(item.serial_no, cert.publicKey.export({ type: "spki", format: "pem" }) as string);
    } catch {
      /* 单张证书损坏跳过，不影响其余 */
    }
  }
  if (map.size > 0) {
    certCache = { publicKeys: map, loadedAt: Date.now() };
  }
}

/** 取平台证书公钥；缓存缺失/过期/serial 未知时自动刷新一次 */
async function platformPublicKey(serial: string): Promise<string | null> {
  const stale =
    !certCache || Date.now() - certCache.loadedAt > CERT_TTL_MS;
  if (stale || !certCache?.publicKeys.has(serial)) {
    try {
      await refreshPlatformCerts();
    } catch {
      /* 刷新失败时退回旧缓存（若有） */
    }
  }
  return certCache?.publicKeys.get(serial) ?? null;
}

/** 回调验签：message = TIMESTAMP\nNONCE\nBODY\n，用 serial 对应平台证书公钥 */
export async function verifyCallbackSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  signatureB64: string,
  serial: string
): Promise<boolean> {
  const pub = await platformPublicKey(serial);
  if (!pub) return false;
  return verifyWithKey(pub, `${timestamp}\n${nonce}\n${rawBody}\n`, signatureB64);
}

// ============ 回调 resource 解密 ============

export interface NotifyResource {
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  trade_type?: string;
  amount?: { total?: number; payer_total?: number };
}

export function decryptNotifyResource(resource: {
  ciphertext: string;
  nonce: string;
  associated_data?: string;
}): NotifyResource {
  const cfg = loadConfig();
  const json = decryptAesGcm(
    cfg.apiv3Key,
    resource.nonce,
    resource.ciphertext,
    resource.associated_data ?? null
  );
  return JSON.parse(json) as NotifyResource;
}

// ============ JSAPI 支付参数（下发小程序） ============

export interface JsapiPayParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "RSA";
  paySign: string;
}

export function buildJsapiPayParams(prepayId: string): JsapiPayParams {
  const cfg = loadConfig();
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = randomNonce();
  const pkg = `prepay_id=${prepayId}`;
  const message = jsapiSignMessage(cfg.appid, timeStamp, nonceStr, pkg);
  return {
    timeStamp,
    nonceStr,
    package: pkg,
    signType: "RSA",
    paySign: signMessage(cfg.privateKeyPem, message),
  };
}
