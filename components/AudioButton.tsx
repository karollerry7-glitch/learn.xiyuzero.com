"use client";

import { useSpeech } from "@/hooks/useSpeech";

export default function AudioButton({
  text,
  size = "md",
  className = "",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { speak, playing, supported } = useSpeech();
  const dims =
    size === "lg"
      ? "w-12 h-12 text-xl"
      : size === "sm"
        ? "w-8 h-8 text-sm"
        : "w-10 h-10 text-base";
  if (!supported) return null;
  return (
    <button
      type="button"
      aria-label={`播放发音：${text}`}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={`inline-flex items-center justify-center rounded-full bg-[#C62828]/10 text-[#C62828] hover:bg-[#C62828]/20 active:scale-95 transition ${dims} ${className}`}
    >
      {playing ? "🔊" : "🔈"}
    </button>
  );
}
