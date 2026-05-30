'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'

function CartView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)
  const { items, updateQty, removeItem, clearCart, total } = useCartStore()
  const [submitting, setSubmitting] = useState(false)

  const handleOrder = async () => {
    if (items.length === 0) return
    setSubmitting(true)
    const totalPrice = total()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ table_number: tableNumber, status: 'pending', total_price: totalPrice })
      .select()
      .single()

    if (orderError || !order) { setSubmitting(false); return }

    const orderItems = items.flatMap((ci) =>
      Array.from({ length: ci.quantity }, () => ({
        order_id: order.id,
        menu_item_id: ci.menuItem.id,
        quantity: 1,
        selected_options: ci.selectedOptions.length > 0 ? ci.selectedOptions : null,
        item_price: ci.itemPrice,
      }))
    )

    await supabase.from('order_items').insert(orderItems)
    clearCart()
    router.push(`/customer/done?table=${tableNumber}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-6xl">🛒</div>
        <p className="text-gray-500 font-medium">カートは空です</p>
        <Link href={`/customer?table=${tableNumber}`} className="bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl">
          メニューに戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <div className="bg-orange-500 text-white px-4 py-4 shadow-md flex items-center gap-3">
        <Link href={`/customer?table=${tableNumber}`} className="text-white text-xl">←</Link>
        <h1 className="text-xl font-bold">🛒 カートを確認</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto flex flex-col gap-3">
        {items.map((ci, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold text-gray-800">{ci.menuItem.name}</p>
                {ci.selectedOptions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ci.selectedOptions.map((o) => `${o.option_name}`).join('・')}
                  </p>
                )}
                <p className="text-orange-500 font-bold mt-1">¥{ci.itemPrice.toLocaleString()}</p>
              </div>
              <button onClick={() => removeItem(index)} className="text-gray-300 hover:text-red-400 text-xl pl-2">✕</button>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => updateQty(index, ci.quantity - 1)}
                className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 text-lg"
              >−</button>
              <span className="font-bold text-lg w-8 text-center">{ci.quantity}</span>
              <button
                onClick={() => updateQty(index, ci.quantity + 1)}
                className="w-9 h-9 rounded-full border-2 border-orange-400 flex items-center justify-center font-bold text-orange-500 text-lg"
              >＋</button>
              <span className="ml-auto font-bold text-gray-700">¥{(ci.itemPrice * ci.quantity).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-700">合計</span>
          <span className="text-2xl font-bold text-orange-500">¥{total().toLocaleString()}</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          {submitting ? '送信中…' : '注文する'}
        </button>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>}>
      <CartView />
    </Suspense>
  )
}
