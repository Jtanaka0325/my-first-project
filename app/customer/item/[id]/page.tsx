'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, MenuItem, OptionGroup, SelectedOption } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'

function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)
  const [item, setItem] = useState<MenuItem | null>(null)
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([])
  const [selected, setSelected] = useState<Record<string, SelectedOption>>({})
  const [error, setError] = useState('')
  const { addItem } = useCartStore()

  useEffect(() => {
    supabase.from('menu_items').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setItem(data as MenuItem) })
    supabase.from('option_groups').select('*, options(*)').eq('menu_item_id', id)
      .then(({ data }) => { if (data) setOptionGroups(data as OptionGroup[]) })
  }, [id])

  const handleSelect = (group: OptionGroup, optName: string, extraPrice: number) => {
    setSelected((prev) => ({
      ...prev,
      [group.id]: { group_name: group.name, option_name: optName, extra_price: extraPrice },
    }))
  }

  const handleAddToCart = () => {
    if (!item) return
    for (const g of optionGroups) {
      if (g.is_required && !selected[g.id]) {
        setError(`「${g.name}」を選択してください`)
        return
      }
    }
    addItem(item, Object.values(selected))
    router.push(`/customer/category/${item.category_id}?table=${tableNumber}&added=1`)
  }

  const extraTotal = Object.values(selected).reduce((s, o) => s + o.extra_price, 0)

  if (!item) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-orange-500 text-white px-4 py-4 shadow-md flex items-center gap-3">
        <Link href={`/customer/category/${item.category_id}?table=${tableNumber}`} className="text-white text-xl">←</Link>
        <h1 className="text-xl font-bold">商品を選ぶ</h1>
      </div>

      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-52 object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.removeAttribute('style')
          }}
        />
      ) : null}
      <div
        className="w-full h-52 bg-gray-200 flex items-center justify-center text-7xl"
        style={item.image_url ? { display: 'none' } : undefined}
      >🍽️</div>

      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
        {item.description && <p className="text-gray-500 mt-1 text-sm">{item.description}</p>}
        <p className="text-orange-500 font-bold text-xl mt-2">
          ¥{(item.price + extraTotal).toLocaleString()}
          {extraTotal > 0 && <span className="text-sm text-gray-400 font-normal ml-1">(+¥{extraTotal})</span>}
        </p>

        {optionGroups.map((group) => (
          <div key={group.id} className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold text-gray-700">{group.name}</p>
              {group.is_required && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">必須</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {(group.options ?? []).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(group, opt.name, opt.extra_price)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                    selected[group.id]?.option_name === opt.name
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <span className="font-medium text-gray-800">{opt.name}</span>
                  {opt.extra_price > 0 && (
                    <span className="text-orange-500 text-sm font-bold">+¥{opt.extra_price}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-lg mx-auto">
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          🛒 カートに追加
        </button>
      </div>
    </div>
  )
}

export default function ItemPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>}>
      <ItemDetail />
    </Suspense>
  )
}
