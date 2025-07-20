import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Match Party - リアルタイム一致ゲーム",
  description:
    "プレイヤー同士で回答の一致を目指すリアルタイムゲーム。最大20人で楽しめるパーティーゲーム。スマホ対応、ルームコードで簡単参加。",
  keywords:
    "ゲーム, パーティーゲーム, リアルタイム, 一致ゲーム, スマホゲーム, オンラインゲーム, 友達, グループ",
  authors: [{ name: "aiandrox" }],
  creator: "aiandrox",
  publisher: "Match Party",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://match-party-findy.web.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Match Party - リアルタイム一致ゲーム",
    description: "みんなで同じ答えを目指そう！最大20人で楽しめるリアルタイムパーティーゲーム",
    url: "https://match-party-findy.web.app",
    siteName: "Match Party",
    locale: "ja_JP",
    type: "website",
    // TODO: OG画像の作成と配置が必要
    // 1200x630pxの画像を public/og-image.jpg に配置してください
    // Match Partyのゲーム画面やロゴを含むビジュアルが推奨
    /*
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Match Party - リアルタイム一致ゲーム",
      },
    ],
    */
  },
  twitter: {
    card: "summary_large_image",
    title: "Match Party - リアルタイム一致ゲーム",
    description: "みんなで同じ答えを目指そう！最大20人で楽しめるリアルタイムパーティーゲーム",
    // TODO: OG画像作成後に有効化
    // images: ["/og-image.jpg"],
    creator: "@aiandrox",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // TODO: Google Search Console設定時に有効化
  // Google Search Consoleに登録後、実際の認証コードに置き換えてコメントアウトを解除
  /*
  verification: {
    google: "google-site-verification-code-here",
  },
  */
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Preload critical audio assets for better game performance */}
        <link rel="preload" href="/sounds/quiz-question.mp3" as="audio" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
