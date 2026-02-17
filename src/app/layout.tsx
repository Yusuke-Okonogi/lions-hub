import type { Metadata, Viewport } from "next"; // Viewport 型を追加
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🚀 ビューポートとテーマカラーは独立して定義するのが最新の推奨です
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003366",
};

export const metadata: Metadata = {
  title: "LIONS HUB",
  description: "ライオンズクラブ専用 管理アプリ",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png', // 🚀 iPhoneのホーム画面用アイコンを明示
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // 🚀 よりアプリらしい外観に
    title: "LIONS HUB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}