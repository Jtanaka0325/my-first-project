'use client'

import { useState, useEffect } from 'react'
import { supabase, Feedback, Order, OrderItem } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type OrderWithItems = Order & { order_items: (OrderItem & { menu_items: { name: string } | null })[] }

export default function DashboardPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const start = `${dateFilter}T00:00:00`
    const end = `${dateFilter}T23:59:59`
    const fetchAll = async () => {
      const [{ data: fb }, { data: ord }] = await Promise.all([
        supabase.from('feedbacks').select('*').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false }),
        supabase.from('orders').select('*, order_items(*, menu_items(name))').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false }),
      ])
      if (fb) setFeedbacks(fb as Feedback[])
      if (ord) setOrders(ord as OrderWithItems[])
    }
    fetchAll()
    const ch = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [dateFilter])

  const totalSales = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_price, 0)
  const cold = feedbacks.filter(f => f.temperature_feeling === 'cold').length
  const good = feedbacks.filter(f => f.temperature_feeling === 'good').length
  const hot = feedbacks.filter(f => f.temperature_feeling === 'hot').length

  const now = new Date()
  const thirtyMin = new Date(now.getTime() - 30 * 60 * 1000)
  const recent = feedbacks.filter(f => new Date(f.created_at) >= thirtyMin)
  const recentCold = recent.filter(f => f.temperature_feeling === 'cold').length
  const recentHot = recent.filter(f => f.temperature_feeling === 'hot').length

  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const h = i + 9
    const fbH = feedbacks.filter(f => new Date(f.created_at).getHours() === h)
    const ordH = orders.filter(o => new Date(o.created_at).getHours() === h)
    return {
      hour: `${h}時`,
      注文: ordH.length,
      寒い: fbH.filter(f => f.temperature_feeling === 'cold').length,
      良好: fbH.filter(f => f.temperature_feeling === 'good').length,
      暑い: fbH.filter(f => f.temperature_feeling === 'hot').length,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white px-6 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">📊 管理者ダッシュボード</h1>
          <input
            type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white text-gray-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {recentCold >= 3 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl font-medium">
            ⚠️ 直近30分で「寒い」が{recentCold}件。空調を確認してください。
          </div>
        )}
        {recentHot >= 3 && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-xl font-medium">
            🚨 直近30分で「暑い」が{recentHot}件。空調を確認してください。
          </div>
        )}

        {/* KPIカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-1">🍽️</div>
            <div className="text-3xl font-bold text-orange-500">{orders.length}</div>
            <div className="text-xs text-gray-500">注文数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-1">💴</div>
            <div className="text-2xl font-bold text-green-600">¥{totalSales.toLocaleString()}</div>
            <div className="text-xs text-gray-500">売上合計</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center col-span-2 sm:col-span-1">
            <div className="flex justify-around">
              <div><div className="text-2xl">🥶</div><div className="font-bold text-blue-600">{cold}</div></div>
              <div><div className="text-2xl">😊</div><div className="font-bold text-green-600">{good}</div></div>
              <div><div className="text-2xl">🥵</div><div className="font-bold text-red-600">{hot}</div></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">環境レポ</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl mb-1">⏳</div>
            <div className="text-3xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="text-xs text-gray-500">未対応注文</div>
          </div>
        </div>

        {/* グラフ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">時間帯別（注文数・環境レポ）</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="注文" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="寒い" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="良好" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="暑い" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 注文一覧 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">注文一覧</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">テーブル</th>
                  <th className="px-4 py-3 text-left">内容</th>
                  <th className="px-4 py-3 text-left">金額</th>
                  <th className="px-4 py-3 text-left">時刻</th>
                  <th className="px-4 py-3 text-left">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">データなし</td></tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.table_number}番</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {o.order_items.map((oi) => oi.menu_items?.name).join('・')}
                    </td>
                    <td className="px-4 py-3 font-bold text-orange-500">¥{o.total_price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        o.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        o.status === 'cooking' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'served' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {o.status === 'pending' ? '新規' : o.status === 'cooking' ? '調理中' : o.status === 'served' ? '提供済' : 'キャンセル'}
                      </span>
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
