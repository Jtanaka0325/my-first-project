'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Category } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'

function CategoryGrid() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)
  const [categories, setCategories] = useState<Category[]>([])
  const { items, setTableNumber } = useCartStore()

  useEffect(() => {
    setTableNumber(tableNumber)
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => { if (data) setCategories(data as Category[]) })
  }, [tableNumber, setTableNumber])

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-orange-500 text-white px-4 py-5 text-center shadow-md">
        <h1 className="text-2xl font-bold">🍽️ メニュー</h1>
        <p className="text-orange-100 text-sm mt-0.5">{tableNumber}番テーブル</p>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <p className="text-gray-500 text-sm mb-4 text-center">カテゴリを選んでください</p>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            cat.is_fixed ? (
              <Link
                key={cat.id}
                href={`/customer/env?table=${tableNumber}`}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-white shadow-md active:scale-95 transition-transform"
                style={{ backgroundColor: cat.color }}
              >
                <span className="text-4xl">{cat.icon}</span>
                <span className="font-bold text-sm text-center leading-tight">{cat.name}</span>
              </Link>
            ) : (
              <Link
                key={cat.id}
                href={`/customer/category/${cat.id}?table=${tableNumber}`}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-white shadow-md active:scale-95 transition-transform"
                style={{ backgroundColor: cat.color }}
              >
                <span className="text-4xl">{cat.icon}</span>
                <span className="font-bold text-sm text-center leading-tight">{cat.name}</span>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* カートボタン */}
      {totalQty > 0 && (
        <button
          onClick={() => router.push(`/customer/cart?table=${tableNumber}`)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full shadow-xl flex items-center gap-2 px-5 py-3 font-bold text-base active:scale-95 transition-transform z-50"
        >
          🛒 <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{totalQty}</span>
        </button>
      )}
    </div>
  )
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>}>
      <CategoryGrid />
    </Suspense>
  )
}
