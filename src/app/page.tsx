"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 select-none">
              <span className="inline-block transform hover:scale-110 transition-transform duration-200">
                <span className="text-red-500 drop-shadow-lg">M</span>
                <span className="text-orange-500 drop-shadow-lg">a</span>
                <span className="text-yellow-500 drop-shadow-lg">t</span>
                <span className="text-green-500 drop-shadow-lg">c</span>
                <span className="text-blue-500 drop-shadow-lg">h</span>
                <span className="mx-2"></span>
                <span className="text-purple-500 drop-shadow-lg">P</span>
                <span className="text-pink-500 drop-shadow-lg">a</span>
                <span className="text-indigo-500 drop-shadow-lg">r</span>
                <span className="text-teal-500 drop-shadow-lg">t</span>
                <span className="text-cyan-500 drop-shadow-lg">y</span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">みんなで回答の一致を目指すリアルタイムゲーム</p>
          </div>

          <div className="mb-12">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">ゲームの流れ</h2>
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-2">📱</div>
                  <h3 className="font-semibold mb-1">1. ルーム参加</h3>
                  <p className="text-gray-600">最大20人で参加可能</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">💭</div>
                  <h3 className="font-semibold mb-1">2. 回答入力</h3>
                  <p className="text-gray-600">同じお題に皆で回答</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <h3 className="font-semibold mb-1">3. 一致を確認</h3>
                  <p className="text-gray-600">全員一致を目指そう！</p>
                </div>
              </div>
            </div>
          </div>

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
