import type { Metadata } from 'next'
import { APP_BASE_URL, APP_NAME } from '@/constants/app'

export const metadata: Metadata = {
  title: `ルーム参加 - ${APP_NAME}`,
  description: `${APP_NAME}のゲームルームに参加しましょう。ルームコードを入力してリアルタイム一致ゲームに参加できます。`,
  openGraph: {
    title: `ルーム参加 - ${APP_NAME}`,
    description: `${APP_NAME}のゲームルームに参加しましょう。ルームコードを入力してリアルタイム一致ゲームに参加できます。`,
    url: `${APP_BASE_URL}/join-room`,
  },
  twitter: {
    title: `ルーム参加 - ${APP_NAME}`,
    description: `${APP_NAME}のゲームルームに参加しましょう。ルームコードを入力してリアルタイム一致ゲームに参加できます。`,
  },
  alternates: {
    canonical: '/join-room',
  },
}