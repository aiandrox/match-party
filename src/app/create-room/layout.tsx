import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ルーム作成 - Match Party',
  description: 'Match Partyで新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。',
  openGraph: {
    title: 'ルーム作成 - Match Party',
    description: 'Match Partyで新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。',
    url: 'https://match-party-findy.web.app/create-room',
  },
  twitter: {
    title: 'ルーム作成 - Match Party',
    description: 'Match Partyで新しいゲームルームを作成しましょう。最大20人が参加できるリアルタイム一致ゲームを開始できます。',
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