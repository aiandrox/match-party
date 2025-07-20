import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StructuredData } from "@/components/StructuredData";
import { APP_BASE_URL, APP_NAME, APP_CREATOR, APP_DESCRIPTION } from "@/constants/app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} - リアルタイム一致ゲーム`,
  description: APP_DESCRIPTION,
  keywords:
    "ゲーム, パーティーゲーム, リアルタイム, 一致ゲーム, スマホゲーム, オンラインゲーム, 友達, グループ",
  authors: [{ name: APP_CREATOR }],
  creator: APP_CREATOR,
  publisher: APP_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(APP_BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${APP_NAME} - リアルタイム一致ゲーム`,
    description: "みんなで同じ答えを目指そう！最大20人で楽しめるリアルタイムパーティーゲーム",
    url: APP_BASE_URL,
    siteName: APP_NAME,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Match Party - リアルタイム一致ゲーム",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - リアルタイム一致ゲーム`,
    description: "みんなで同じ答えを目指そう！最大20人で楽しめるリアルタイムパーティーゲーム",
    images: ["/og-image.jpg"],
    creator: `@${APP_CREATOR}`,
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
        <link rel="prefetch" href="/sounds/quiz-question.mp3" />
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
