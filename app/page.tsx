import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">💬</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">こえレポ</h1>
        <p className="text-gray-500 mb-8 text-sm">飲食店リアルタイム環境フィードバックシステム</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/customer?table=1"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            😊 お客様フィードバック入力
          </Link>
          <Link
            href="/staff"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            🔔 スタッフ通知画面
          </Link>
          <Link
            href="/dashboard"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            📊 管理者ダッシュボード
          </Link>
          <Link
            href="/admin/qr"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            📱 QRコード生成
          </Link>
        </div>
      </div>
    </div>
  )
}
