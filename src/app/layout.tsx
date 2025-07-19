import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Match Party - リアルタイム一致ゲーム',
  description: 'プレイヤー同士で回答の一致を目指すリアルタイムゲーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* Preload critical audio assets for better game performance */}
        <link rel="preload" href="/sounds/quiz-question.mp3" as="audio" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}