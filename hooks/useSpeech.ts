"use client";

// 西班牙语 TTS：云端真人级发音（三层结构）
// 第一层：/api/tts —— 微软 Edge 神经网络人声（es-MX-Dalia/Jorge、es-ES-Elvira/Alvaro）
//         服务端回退 Google 云端合成；同一词句命中 CDN + 本地 blob 缓存，重复播放零延迟
// 第二层：请求失败（网络异常/接口维护）自动回退浏览器 Web Speech API
// 第三层：完全不支持时组件禁用发音按钮

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/store";

// ── 模块级音频缓存与播放器（跨组件共享）──
const audioCache = new Map<string, string>(); // key -> objectURL
let currentAudio: HTMLAudioElement | null = null;
const CACHE_LIMIT = 400;

function cacheKey(text: string, locale: string, rate: number, gender: string) {
  return `${text}|${locale}|${rate}|${gender}`;
}

function putCache(key: string, url: string) {
  if (audioCache.size >= CACHE_LIMIT) {
    // 简单淘汰：删最早一条
    const first = audioCache.keys().next().value;
    if (first !== undefined) {
      const old = audioCache.get(first);
      if (old) URL.revokeObjectURL(old);
      audioCache.delete(first);
    }
  }
  audioCache.set(key, url);
}

// ── Web Speech 回退 ──
function pickVoice(preferLocale: string): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const exact = voices.find(
    (v) => v.lang.toLowerCase() === preferLocale.toLowerCase()
  );
  if (exact) return exact;
  const sameLang = voices.find((v) =>
    v.lang.toLowerCase().startsWith(preferLocale.slice(0, 2).toLowerCase())
  );
  if (sameLang) return sameLang;
  const anySpanish = voices.find((v) =>
    v.lang.toLowerCase().startsWith("es")
  );
  return anySpanish ?? null;
}

export function useSpeech() {
  const { settings } = useAppState();
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const currentRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    // 某些浏览器异步加载 voices
    const load = () => speechSynthesis.getVoices();
    load();
    speechSynthesis.onvoiceschanged = load;
  }, []);

  const stopAll = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    setPlaying(false);
  }, []);

  const playUrl = useCallback((url: string) => {
    const a = new Audio(url);
    currentAudio = a;
    a.onplay = () => setPlaying(true);
    a.onended = () => {
      setPlaying(false);
      if (currentAudio === a) currentAudio = null;
    };
    a.onerror = () => {
      setPlaying(false);
      if (currentAudio === a) currentAudio = null;
    };
    a.play().catch(() => setPlaying(false));
  }, []);

  // 系统语音回退（保留原有逻辑）
  const speakFallback = useCallback(
    (text: string, locale: string, rate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(locale);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = locale;
      }
      u.rate = rate;
      u.onstart = () => setPlaying(true);
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      currentRef.current = u;
      speechSynthesis.speak(u);
    },
    []
  );

  const speak = useCallback(
    (text: string, opts?: { rate?: number; locale?: string }) => {
      if (typeof window === "undefined") return;
      const locale = opts?.locale ?? settings.voiceLocale;
      const rate = opts?.rate ?? settings.rate;
      const gender = settings.voiceGender;

      stopAll();

      const key = cacheKey(text, locale, rate, gender);
      const cached = audioCache.get(key);
      if (cached) {
        playUrl(cached);
        return;
      }

      // 云端真人级发音：服务端 Edge 神经人声（回退 Google 合成）
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      fetch(
        `/api/tts?q=${encodeURIComponent(text)}&locale=${locale}&rate=${rate}&gender=${gender}`,
        { signal: ctrl.signal }
      )
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => {
          clearTimeout(timer);
          if (blob.size < 500) throw new Error("empty");
          const url = URL.createObjectURL(blob);
          putCache(key, url);
          playUrl(url);
        })
        .catch(() => {
          clearTimeout(timer);
          speakFallback(text, locale, rate);
        });
    },
    [settings.voiceLocale, settings.rate, settings.voiceGender, stopAll, playUrl, speakFallback]
  );

  const stop = stopAll;

  return { speak, stop, playing, supported };
}
