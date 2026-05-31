import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-0.5">MenuVoice</h1>
        <p className="text-orange-500 font-medium text-sm mb-1">メニューボイス</p>
        <p className="text-gray-400 mb-8 text-xs">飲食店総合注文・環境フィードバックシステム</p>

        <div className="flex flex-col gap-3">
          <Link href="/customer?table=1" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg">
            🍽️ お客様メニュー（1番テーブル）
          </Link>

          <div className="border-t border-gray-100 my-1" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">スタッフ・キッチン</p>

          <Link href="/staff" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg">
            🔔 スタッフ通知画面
          </Link>
          <Link href="/kitchen" className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg">
            👨‍🍳 キッチン画面
          </Link>

          <div className="border-t border-gray-100 my-1" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">管理者</p>

          <Link href="/dashboard" className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg">
            📊 管理者ダッシュボード
          </Link>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/admin/categories" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-2xl transition-colors flex flex-col items-center gap-1 text-sm">
              <span>📂</span><span>カテゴリ</span>
            </Link>
            <Link href="/admin/menu" className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-2xl transition-colors flex flex-col items-center gap-1 text-sm">
              <span>🍜</span><span>メニュー</span>
            </Link>
            <Link href="/admin/qr" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-2xl transition-colors flex flex-col items-center gap-1 text-sm">
              <span>📱</span><span>QRコード</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
