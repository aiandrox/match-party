/**
 * OGP画像生成専用ページ
 * TOPページのデザインを踏襲し、ボタン部分を除いたクリーンなデザイン
 * 1200x630pxの画面サイズに最適化してコンテンツを大きく表示
 */

export default function OGPPreviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-12">
            {/* TOPページと同じカラフルなロゴ */}
            <h1 className="text-8xl font-bold mb-6 select-none">
              <span className="inline-block">
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
            <p className="text-3xl text-gray-600">みんなで回答の一致を目指すリアルタイムゲーム</p>
          </div>

          {/* ゲームの流れ（白枠・タイトル削除） */}
          <div className="grid gap-4 md:grid-cols-3 text-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="font-semibold mb-2 text-2xl">1. ルーム参加</h3>
              <p className="text-gray-600 text-xl">最大20人で参加可能</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">💭</div>
              <h3 className="font-semibold mb-2 text-2xl">2. 回答入力</h3>
              <p className="text-gray-600 text-xl">同じお題に皆で回答</p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-semibold mb-2 text-2xl">3. 一致を確認</h3>
              <p className="text-gray-600 text-xl">全員一致を目指そう！</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}