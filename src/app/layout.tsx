import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const zenMaru = Zen_Maru_Gothic({
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["Hiragino Maru Gothic ProN", "Yu Gothic", "Meiryo", "sans-serif"],
});

export const metadata: Metadata = {
  title: "あみだくじ",
  description: "スタートを選ぶと、隠れていたあみだくじが現れてゴールまで進むゲームです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={zenMaru.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
