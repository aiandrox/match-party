import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ルーム参加 - Match Party',
  description: 'ルームコードを入力してMatch Partyゲームに参加しましょう。友達が作ったルームで一緒にリアルタイム一致ゲームを楽しめます。',
  openGraph: {
    title: 'ルーム参加 - Match Party',
    description: 'ルームコードを入力してMatch Partyゲームに参加しましょう。友達が作ったルームで一緒にリアルタイム一致ゲームを楽しめます。',
    url: 'https://match-party-findy.web.app/join-room',
  },
  twitter: {
    title: 'ルーム参加 - Match Party',
    description: 'ルームコードを入力してMatch Partyゲームに参加しましょう。友達が作ったルームで一緒にリアルタイム一致ゲームを楽しめます。',
  },
  alternates: {
    canonical: '/join-room',
  },
}

export default function JoinRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}