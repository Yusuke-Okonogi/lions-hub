import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "LIONS HUB",
  description: "ライオンズクラブ専用 出欠・議事録管理アプリ",
  manifest: "/manifest.json", // これが大事！
  themeColor: "#003366",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LIONS HUB",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1, // ズームを防いでアプリ感を出す
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
