'use client'

import { useState, useEffect } from 'react'
import { supabase, Feedback, Order, OrderItem } from '@/lib/supabase'

const STAFF_PIN = process.env.NEXT_PUBLIC_STAFF_PIN ?? '1234'

type OrderWithItems = Order & { order_items: (OrderItem & { menu_items: { name: string } | null })[] }

const tempLabel: Record<string, { emoji: string; label: string; color: string }> = {
  cold: { emoji: '🥶', label: '寒い', color: 'text-blue-600 bg-blue-50 border-blue-300' },
  good: { emoji: '😊', label: 'ちょうどいい', color: 'text-green-600 bg-green-50 border-green-300' },
  hot: { emoji: '🥵', label: '暑い', color: 'text-red-600 bg-red-50 border-red-300' },
}

export default function StaffPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [tab, setTab] = useState<'orders' | 'env'>('orders')

  const handlePinSubmit = () => {
    if (pin === STAFF_PIN) setAuthenticated(true)
    else { setPinError(true); setPin('') }
  }

  useEffect(() => {
    if (!authenticated) return
    const fetchAll = () => {
      supabase.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => { if (data) setFeedbacks(data as Feedback[]) })
      supabase.from('orders').select('*, order_items(*, menu_items(name))')
        .in('status', ['pending', 'cooking', 'served']).order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => { if (data) setOrders(data as OrderWithItems[]) })
    }
    fetchAll()
    const ch = supabase.channel('staff-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [authenticated])

  const resolveEnv = async (id: string) => {
    await supabase.from('feedbacks').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, is_resolved: true } : f))
  }

  const unresolvedEnv = feedbacks.filter((f) => !f.is_resolved).length
  const unresolvedOrders = orders.filter((o) => o.status === 'pending').length

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xs text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">スタッフ認証</h1>
          <p className="text-gray-500 text-sm mb-6">4桁のPINを入力してください</p>
          <input
            type="password" inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            className="w-full text-center text-3xl tracking-widest border-2 border-gray-200 rounded-xl py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="····"
          />
          {pinError && <p className="text-red-500 text-sm mb-3">PINが違います</p>}
          <button onClick={handlePinSubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl">ログイン</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-600 text-white px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">🔔 スタッフ通知</h1>
          <div className="flex gap-2">
            {unresolvedOrders > 0 && <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">注文 {unresolvedOrders}</span>}
            {unresolvedEnv > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">環境 {unresolvedEnv}</span>}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="max-w-2xl mx-auto px-4 pt-4 flex gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'orders' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
        >
          🍽️ 注文 {unresolvedOrders > 0 && `(${unresolvedOrders})`}
        </button>
        <button
          onClick={() => setTab('env')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'env' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600'}`}
        >
          🌡️ 環境レポ {unresolvedEnv > 0 && `(${unresolvedEnv})`}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col gap-3">
        {tab === 'orders' && orders.map((order) => (
          <div key={order.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
            order.status === 'pending' ? 'border-orange-400' : order.status === 'cooking' ? 'border-yellow-400' : 'border-green-400'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg">{order.table_number}番テーブル</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                order.status === 'cooking' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {order.status === 'pending' ? '新規' : order.status === 'cooking' ? '調理中' : '提供済'}
              </span>
            </div>
            {order.order_items.map((oi) => (
              <p key={oi.id} className="text-sm text-gray-700">
                {oi.menu_items?.name} ×{oi.quantity}
                {oi.selected_options && oi.selected_options.length > 0 && (
                  <span className="text-gray-400 ml-1">({oi.selected_options.map((o) => o.option_name).join('・')})</span>
                )}
              </p>
            ))}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(order.created_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}

        {tab === 'env' && feedbacks.map((fb) => {
          const t = tempLabel[fb.temperature_feeling]
          return (
            <div key={fb.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${fb.is_resolved ? 'border-gray-200 opacity-60' : 'border-indigo-400'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${t.color}`}>{t.emoji} {t.label}</span>
                    <span className="text-sm text-gray-500">{fb.table_number}番テーブル</span>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mt-1">{fb.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(fb.created_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' })}</p>
                </div>
                {!fb.is_resolved ? (
                  <button onClick={() => resolveEnv(fb.id)} className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-xl whitespace-nowrap">対応済み</button>
                ) : (
                  <span className="text-green-600 text-sm font-bold whitespace-nowrap">✓ 対応済</span>
                )}
              </div>
            </div>
          )
        })}

        {tab === 'orders' && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">注文はありません</div>
        )}
        {tab === 'env' && feedbacks.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">環境レポはありません</div>
        )}
      </div>
    </div>
  )
}
