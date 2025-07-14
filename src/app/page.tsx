"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Match Party</h1>
          <p className="text-xl text-gray-600 mb-8">みんなで回答の一致を目指すリアルタイムゲーム</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">ルームを作成</h2>
              <p className="text-gray-600 mb-4">
                新しいゲームルームを作成して、友達を招待しましょう
              </p>
              <button
                onClick={() => router.push("/create-room")}
                className="btn btn-primary w-full h-12"
              >
                ルームを作成
              </button>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">ルームに参加</h2>
              <p className="text-gray-600 mb-4">
                ルームコードを入力して、既存のゲームに参加しましょう
              </p>
              <button
                onClick={() => router.push("/join-room")}
                className="btn btn-secondary w-full h-12"
              >
                ルームに参加
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
