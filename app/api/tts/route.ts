// 云端真人级 TTS 代理：微软 Edge 神经网络人声（首选）→ Google TTS（回退）
// GET /api/tts?q=<文本>&locale=es-MX|es-ES&rate=0.7|0.85|1&gender=female|male
// 返回 audio/mpeg；同一参数组合命中 Vercel CDN 边缘缓存，不重复请求上游。

import crypto from "crypto";
import WebSocket from "ws";

export const runtime = "nodejs";
export const maxDuration = 30;

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const WSS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
const EDGE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0";

const VOICES: Record<string, Record<string, string>> = {
  "es-MX": { female: "es-MX-DaliaNeural", male: "es-MX-JorgeNeural" },
  "es-ES": { female: "es-ES-ElviraNeural", male: "es-ES-AlvaroNeural" },
};

function pickVoice(locale: string, gender: string): string {
  const table = VOICES[locale];
  if (!table) return "es-MX-DaliaNeural";
  return table[gender === "male" ? "male" : "female"] ?? "es-MX-DaliaNeural";
}

function rateToProsody(rate: number): string {
  // 0.7 → -30%，0.85 → -15%，1.0 → +0%
  const pct = Math.round((rate - 1) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

// Sec-MS-GEC：Windows 时钟 5 分钟取整(100ns) + TrustedClientToken 的 SHA256
function genSecToken(): string {
  const WIN_EPOCH = 11644473600;
  let ticks = Math.floor(Date.now() / 1000) + WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= 1e7;
  return crypto
    .createHash("sha256")
    .update(`${ticks}${TRUSTED_CLIENT_TOKEN}`)
    .digest("hex")
    .toUpperCase();
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function edgeSynthesize(
  voice: string,
  text: string,
  prosody: string,
  timeoutMs = 20000
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `${WSS_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${genSecToken()}&Sec-MS-GEC-Version=1-143.0.3650.75`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, { headers: { "User-Agent": EDGE_UA } });
    } catch (e) {
      return reject(e as Error);
    }
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {}
      reject(new Error("edge timeout"));
    }, timeoutMs);
    ws.on("open", () => {
      const ts = new Date().toString();
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: "false",
                    wordBoundaryEnabled: "true",
                  },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3",
                },
              },
            },
          })
      );
      const rid = crypto.randomUUID().replace(/-/g, "");
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='es-MX'>` +
        `<voice name='${voice}'><prosody rate='${prosody}'>${escapeXml(text)}</prosody></voice></speak>`;
      ws.send(
        `X-RequestId:${rid}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`
      );
    });
    ws.on("message", (data: unknown, isBinary: boolean) => {
      if (!isBinary) {
        const s = String(data);
        if (s.includes("Path:turn.end")) {
          try {
            ws.close();
          } catch {}
        }
        return;
      }
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      const idx = buf.indexOf("Path:audio\r\n");
      if (idx >= 0) chunks.push(buf.subarray(idx + 12));
    });
    ws.on("close", () => {
      clearTimeout(timer);
      const mp3 = Buffer.concat(chunks);
      if (mp3.length > 500) resolve(mp3);
      else reject(new Error("edge empty audio"));
    });
    ws.on("error", (e: Error) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

// 回退：Google 翻译朗读（同为云端合成，质量优于系统语音）
async function googleSynthesize(
  text: string,
  locale: string,
  rate: number
): Promise<Buffer> {
  const tl = locale === "es-ES" ? "es" : "es-MX";
  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=` +
    encodeURIComponent(text.slice(0, 200)) +
    `&tl=${tl}&ttss=1${rate <= 0.75 ? "&slow=1" : ""}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": EDGE_UA,
      Referer: "https://translate.google.com/",
    },
  });
  if (!r.ok) throw new Error(`google ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 500) throw new Error("google empty audio");
  return buf;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const locale = url.searchParams.get("locale") === "es-ES" ? "es-ES" : "es-MX";
  const gender = url.searchParams.get("gender") === "male" ? "male" : "female";
  const rateRaw = Number(url.searchParams.get("rate") ?? "0.85");
  const rate = [0.7, 0.85, 1].includes(rateRaw) ? rateRaw : 0.85;

  if (!q || q.length > 300) {
    return new Response("bad request", { status: 400 });
  }

  let mp3: Buffer | null = null;
  let usedEngine = "edge";
  try {
    mp3 = await edgeSynthesize(
      pickVoice(locale, gender),
      q,
      rateToProsody(rate)
    );
  } catch {
    try {
      mp3 = await googleSynthesize(q, locale, rate);
      usedEngine = "google";
    } catch {
      return new Response("tts unavailable", { status: 502 });
    }
  }

  return new Response(new Uint8Array(mp3), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      // 词句内容固定 → 同参数响应永久不变：CDN 长缓存 + 浏览器缓存
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      "X-TTS-Engine": usedEngine,
    },
  });
}
