'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, Category, MenuItem } from '@/lib/supabase'

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [filterCat, setFilterCat] = useState<string>('all')
  const [editing, setEditing] = useState<Partial<MenuItem> | null>(null)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchItems = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('sort_order')
    if (data) setItems(data as MenuItem[])
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data as Category[])
    })
    fetchItems()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 1MB以上は圧縮して保存
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setImagePreview(dataUrl)
        setEditing((prev) => prev ? { ...prev, image_url: dataUrl } : prev)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!editing?.name || !editing.category_id || editing.price === undefined) return
    setSaving(true)
    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price: editing.price,
      category_id: editing.category_id,
      image_url: editing.image_url ?? null,
      is_sold_out: editing.is_sold_out ?? false,
    }
    if (editing.id) {
      await supabase.from('menu_items').update(payload).eq('id', editing.id)
    } else {
      const maxOrder = Math.max(0, ...items.map(i => i.sort_order))
      await supabase.from('menu_items').insert({ ...payload, sort_order: maxOrder + 1 })
    }
    setSaving(false)
    setEditing(null)
    setImagePreview(null)
    fetchItems()
  }

  const toggleSoldOut = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_sold_out: !item.is_sold_out }).eq('id', item.id)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このメニューを削除しますか？')) return
    await supabase.from('menu_items').delete().eq('id', id)
    fetchItems()
  }

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category_id === filterCat)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white px-4 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white text-xl">←</Link>
          <h1 className="text-xl font-bold">🍽️ メニュー管理</h1>
        </div>
        <button
          onClick={() => { setEditing({ name: '', price: 0, is_sold_out: false }); setImagePreview(null) }}
          className="bg-white text-orange-500 font-bold px-4 py-2 rounded-xl text-sm"
        >
          ＋ 追加
        </button>
      </div>

      {/* カテゴリフィルター */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto max-w-3xl mx-auto">
        <button
          onClick={() => setFilterCat('all')}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filterCat === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
        >
          すべて
        </button>
        {categories.filter(c => !c.is_fixed).map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${filterCat === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden ${item.is_sold_out ? 'opacity-60' : ''}`}>
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-5xl">🍽️</div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-orange-500 font-bold text-sm">¥{item.price.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => toggleSoldOut(item)}
                    className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.is_sold_out ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                  >
                    {item.is_sold_out ? '売切中' : '販売中'}
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Link href={`/admin/options?item=${item.id}`} className="flex-1 text-center text-xs bg-indigo-50 text-indigo-600 font-bold py-1.5 rounded-lg">オプション</Link>
                  <button onClick={() => { setEditing(item); setImagePreview(item.image_url) }} className="flex-1 text-xs bg-gray-50 text-gray-600 font-bold py-1.5 rounded-lg">編集</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 font-bold py-1.5 px-2 rounded-lg">削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 編集モーダル */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing.id ? 'メニューを編集' : 'メニューを追加'}</h2>

            {/* 画像 */}
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-2xl mb-4 overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">📷 タップして写真を選択</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

            <label className="block text-sm font-semibold text-gray-600 mb-1">商品名 *</label>
            <input
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <label className="block text-sm font-semibold text-gray-600 mb-1">価格（円）*</label>
            <input
              type="number" min={0}
              value={editing.price ?? ''}
              onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <label className="block text-sm font-semibold text-gray-600 mb-1">説明（任意）</label>
            <textarea
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <label className="block text-sm font-semibold text-gray-600 mb-1">カテゴリ *</label>
            <select
              value={editing.category_id ?? ''}
              onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">選択してください</option>
              {categories.filter(c => !c.is_fixed).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={() => { setEditing(null); setImagePreview(null) }} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
