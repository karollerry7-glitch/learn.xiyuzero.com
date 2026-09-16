"use client";

// 西班牙语 TTS：Web Speech API
// 默认 es-MX，可切换 es-ES；找不到指定口音时自动回退到任意 Spanish voice。

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState } from "@/lib/store";

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

  const speak = useCallback(
    (text: string, opts?: { rate?: number; locale?: string }) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      speechSynthesis.cancel();
      const locale = opts?.locale ?? settings.voiceLocale;
      const rate = opts?.rate ?? settings.rate;
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(locale);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = locale; // 无可用 voice 时至少指定语言
      }
      u.rate = rate;
      u.onstart = () => setPlaying(true);
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      currentRef.current = u;
      speechSynthesis.speak(u);
    },
    [settings.voiceLocale, settings.rate]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  return { speak, stop, playing, supported };
}
