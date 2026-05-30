'use client'

import { useState, useEffect } from 'react'
import { supabase, Feedback } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function DashboardPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const fetch = async () => {
      const start = `${dateFilter}T00:00:00`
      const end = `${dateFilter}T23:59:59`
      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
      if (data) setFeedbacks(data as Feedback[])
    }
    fetch()

    const channel = supabase
      .channel('feedbacks-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dateFilter])

  const todayCold = feedbacks.filter((f) => f.temperature_feeling === 'cold').length
  const todayGood = feedbacks.filter((f) => f.temperature_feeling === 'good').length
  const todayHot = feedbacks.filter((f) => f.temperature_feeling === 'hot').length

  // 直近30分のアラート判定（本日フィルター時のみ）
  const now = new Date()
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)
  const recent = feedbacks.filter((f) => new Date(f.created_at) >= thirtyMinAgo)
  const recentCold = recent.filter((f) => f.temperature_feeling === 'cold').length
  const recentHot = recent.filter((f) => f.temperature_feeling === 'hot').length

  // 時間帯別グラフデータ
  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 9
    const inHour = feedbacks.filter((f) => new Date(f.created_at).getHours() === hour)
    return {
      hour: `${hour}時`,
      寒い: inHour.filter((f) => f.temperature_feeling === 'cold').length,
      良好: inHour.filter((f) => f.temperature_feeling === 'good').length,
      暑い: inHour.filter((f) => f.temperature_feeling === 'hot').length,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-green-600 text-white px-6 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">📊 管理者ダッシュボード</h1>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white text-gray-800 text-sm rounded-lg px-3 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* アラートバナー */}
        {recentCold >= 3 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl font-medium">
            ⚠️ 直近30分で「寒い」が{recentCold}件報告されています。空調設定を確認してください。
          </div>
        )}
        {recentHot >= 3 && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-xl font-medium">
            🚨 直近30分で「暑い」が{recentHot}件報告されています。空調設定を確認してください。
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="text-4xl mb-2">🥶</div>
            <div className="text-4xl font-bold text-blue-600">{todayCold}</div>
            <div className="text-sm text-gray-500 mt-1">寒い</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="text-4xl mb-2">😊</div>
            <div className="text-4xl font-bold text-green-600">{todayGood}</div>
            <div className="text-sm text-gray-500 mt-1">良好</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="text-4xl mb-2">🥵</div>
            <div className="text-4xl font-bold text-red-600">{todayHot}</div>
            <div className="text-sm text-gray-500 mt-1">暑い</div>
          </div>
        </div>

        {/* 時間帯別グラフ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-700 mb-4">時間帯別フィードバック数</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="寒い" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="良好" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="暑い" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* フィードバック一覧 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-700">フィードバック一覧</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">テーブル</th>
                  <th className="px-4 py-3 text-left">温度</th>
                  <th className="px-4 py-3 text-left">コメント</th>
                  <th className="px-4 py-3 text-left">受信時刻</th>
                  <th className="px-4 py-3 text-left">対応状況</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feedbacks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">データなし</td>
                  </tr>
                )}
                {feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{fb.table_number}番</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        fb.temperature_feeling === 'cold' ? 'bg-blue-100 text-blue-700' :
                        fb.temperature_feeling === 'hot' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {fb.temperature_feeling === 'cold' ? '🥶 寒い' : fb.temperature_feeling === 'hot' ? '🥵 暑い' : '😊 良好'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{fb.comment ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {fb.is_resolved ? (
                        <span className="text-green-600 text-xs font-bold">✓ 対応済</span>
                      ) : (
                        <span className="text-yellow-600 text-xs font-bold">● 未対応</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
