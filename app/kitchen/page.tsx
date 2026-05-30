'use client'

import { useState, useEffect } from 'react'
import { supabase, Order, OrderItem } from '@/lib/supabase'

type OrderWithItems = Order & { order_items: (OrderItem & { menu_items: { name: string } | null })[] }

const STATUS_LABEL = {
  pending: { label: '新規注文', color: 'bg-red-100 border-red-400 text-red-700', badge: 'bg-red-500' },
  cooking: { label: '調理中', color: 'bg-yellow-100 border-yellow-400 text-yellow-700', badge: 'bg-yellow-500' },
  served: { label: '提供済み', color: 'bg-green-100 border-green-400 text-green-700', badge: 'bg-green-500' },
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(name))')
      .in('status', ['pending', 'cooking'])
      .order('created_at', { ascending: true })
    if (data) setOrders(data as OrderWithItems[])
  }

  useEffect(() => {
    fetchOrders()
    const ch = supabase.channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const updateStatus = async (id: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o).filter((o) => o.status !== 'served'))
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 px-4 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">👨‍🍳 キッチン</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
            🔴 新規 {pendingCount}件
          </span>
        )}
      </div>

      <div className="p-4 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        {orders.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 py-16 text-lg">注文待ち…</div>
        )}
        {orders.map((order) => {
          const st = STATUS_LABEL[order.status as keyof typeof STATUS_LABEL]
          return (
            <div key={order.id} className={`rounded-2xl border-2 p-4 ${st.color} bg-opacity-20`}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-white">{order.table_number}番テーブル</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${st.badge}`}>{st.label}</span>
              </div>
              <div className="flex flex-col gap-1 mb-4">
                {order.order_items.map((oi) => (
                  <div key={oi.id} className="text-sm">
                    <span className="text-white font-medium">{oi.menu_items?.name ?? '商品'}</span>
                    <span className="text-gray-300 ml-1">×{oi.quantity}</span>
                    {oi.selected_options && oi.selected_options.length > 0 && (
                      <span className="text-gray-400 ml-2 text-xs">
                        ({oi.selected_options.map((o) => o.option_name).join('・')})
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {new Date(order.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(order.id, 'cooking')}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    調理開始
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button
                    onClick={() => updateStatus(order.id, 'served')}
                    className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    ✓ 提供済み
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
