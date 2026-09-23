import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.xiyuzero.com"),
  title: "沃天澜 · 西语｜0-B2 西班牙语在线学习",
  description:
    "面向中文母语者的西班牙语0-B2词汇、听力、发音与主动表达学习系统。",
  alternates: { canonical: "https://learn.xiyuzero.com" },
  manifest: "/manifest.json",
  openGraph: {
    title: "沃天澜 · 西语｜0-B2 西班牙语在线学习",
    description:
      "面向中文母语者的西班牙语0-B2词汇、听力、发音与主动表达学习系统。",
    url: "https://learn.xiyuzero.com",
    siteName: "沃天澜 · 西语",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F8FA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
