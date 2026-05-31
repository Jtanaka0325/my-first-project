'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, MenuItem, Category } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'

function MenuList() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<MenuItem[]>([])
  const { items: cartItems } = useCartStore()
  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => {
    supabase.from('categories').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setCategory(data as Category) })
    supabase.from('menu_items').select('*').eq('category_id', id).order('sort_order')
      .then(({ data }) => { if (data) setItems(data as MenuItem[]) })
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white px-4 py-4 shadow-md flex items-center gap-3">
        <Link href={`/customer?table=${tableNumber}`} className="text-white text-xl">←</Link>
        <div>
          <h1 className="text-xl font-bold">{category?.icon} {category?.name}</h1>
          <p className="text-orange-100 text-xs">{tableNumber}番テーブル</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto grid grid-cols-2 gap-3">
        {items.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 py-12">メニューがありません</div>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.is_sold_out ? '#' : `/customer/item/${item.id}?table=${tableNumber}`}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden active:scale-95 transition-transform ${item.is_sold_out ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="relative">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.removeAttribute('style')
                  }}
                />
              ) : null}
              <div
                className="w-full h-32 bg-gray-100 flex items-center justify-center text-4xl"
                style={item.image_url ? { display: 'none' } : undefined}
              >🍽️</div>
              {item.is_sold_out && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full">売り切れ</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
              {item.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.description}</p>}
              <p className="text-orange-500 font-bold mt-1">¥{item.price.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>

      {totalQty > 0 && (
        <button
          onClick={() => router.push(`/customer/cart?table=${tableNumber}`)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full shadow-xl flex items-center gap-2 px-5 py-3 font-bold text-base z-50"
        >
          🛒 <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{totalQty}</span>
        </button>
      )}
    </div>
  )
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>}>
      <MenuList />
    </Suspense>
  )
}
