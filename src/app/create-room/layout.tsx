import type { Metadata } from 'next'
import { APP_BASE_URL, APP_NAME } from '@/constants/app'

export const metadata: Metadata = {
  title: `ルーム作成 - ${APP_NAME}`,
  description: `${APP_NAME}で新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。`,
  openGraph: {
    title: `ルーム作成 - ${APP_NAME}`,
    description: `${APP_NAME}で新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。`,
    url: `${APP_BASE_URL}/create-room`,
  },
  twitter: {
    title: `ルーム作成 - ${APP_NAME}`,
    description: `${APP_NAME}で新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。`,
  },
  alternates: {
    canonical: '/create-room',
  },
}

export default function CreateRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}