'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, Category, MenuItem } from '@/lib/supabase'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('読み込み失敗'))
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onerror = () => reject(new Error('画像デコード失敗'))
      img.onload = () => {
        const MAX = 320
        const r = Math.min(MAX / img.width, MAX / img.height, 1)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * r)
        c.height = Math.round(img.height * r)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        const data = c.toDataURL('image/jpeg', 0.65)
        const kb = Math.round((data.length * 3) / 4 / 1024)
        console.log(`[MenuVoice] 画像変換完了: ${c.width}x${c.height}px, 約${kb}KB`)
        resolve(data)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [filterCat, setFilterCat] = useState<string>('all')

  // 編集中のメニュー情報（image_urlは含まない）
  const [editing, setEditing] = useState<Omit<Partial<MenuItem>, 'image_url'> | null>(null)
  // 画像データは専用stateで管理（確実に最新値を保持するため）
  const [imageData, setImageData] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchItems = async () => {
    const { data, error } = await supabase.from('menu_items').select('*').order('sort_order')
    if (error) console.error('[MenuVoice] fetchItems error:', error)
    if (data) setItems(data as MenuItem[])
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order')
      .then(({ data }) => { if (data) setCategories(data as Category[]) })
    fetchItems()
  }, [])

  const openNew = () => {
    setEditing({ name: '', price: 0, is_sold_out: false })
    setImageData(null)
    setSaveError('')
  }

  const openEdit = (item: MenuItem) => {
    const { image_url, ...rest } = item
    setEditing(rest)
    setImageData(image_url ?? null)
    setSaveError('')
  }

  const closeEdit = () => {
    setEditing(null)
    setImageData(null)
    setSaveError('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setConverting(true)
    setSaveError('')
    try {
      const b64 = await toBase64(file)
      setImageData(b64)  // editingとは独立したstateに保存
    } catch (err) {
      setSaveError(`変換失敗: ${err instanceof Error ? err.message : '不明'}`)
    } finally {
      setConverting(false)
    }
  }

  const handleSave = async () => {
    if (!editing?.name || !editing.category_id || editing.price === undefined) {
      setSaveError('商品名・カテゴリ・価格は必須です')
      return
    }
    setSaving(true)
    setSaveError('')

    // imageDataの状態を明示的にログ
    console.log(`[MenuVoice] 保存開始 id=${editing.id ?? 'NEW'} imageData=${imageData ? `${imageData.slice(0, 30)}... (${Math.round(imageData.length / 1024)}KB)` : 'null'}`)

    const payload = {
      name: editing.name,
      description: editing.description ?? null,
      price: editing.price,
      category_id: editing.category_id,
      image_url: imageData,  // 専用stateから直接セット
      is_sold_out: editing.is_sold_out ?? false,
    }

    let savedId: string | undefined = editing.id

    if (editing.id) {
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editing.id)
      if (error) {
        console.error('[MenuVoice] update error:', error)
        setSaveError(`保存失敗: ${error.message}`)
        setSaving(false)
        return
      }
    } else {
      const maxOrder = Math.max(0, ...items.map(i => i.sort_order))
      const { data, error } = await supabase
        .from('menu_items')
        .insert({ ...payload, sort_order: maxOrder + 1 })
        .select('id')
        .single()
      if (error || !data) {
        console.error('[MenuVoice] insert error:', error)
        setSaveError(`保存失敗: ${error?.message ?? '不明'}`)
        setSaving(false)
        return
      }
      savedId = data.id
    }

    // 保存後にDBから読み返して確認
    if (imageData && savedId) {
      const { data: verify } = await supabase
        .from('menu_items')
        .select('image_url')
        .eq('id', savedId)
        .single()
      const saved = verify?.image_url
      console.log(`[MenuVoice] 保存確認: image_url=${saved ? `${saved.slice(0, 30)}... (${Math.round(saved.length / 1024)}KB)` : 'null'}`)
      if (!saved) {
        setSaveError('写真のDB保存に失敗しました。ブラウザの開発者コンソールを確認してください。')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    closeEdit()
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
        <button onClick={openNew} className="bg-white text-orange-500 font-bold px-4 py-2 rounded-xl text-sm">
          ＋ 追加
        </button>
      </div>

      {/* カテゴリフィルター */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto max-w-3xl mx-auto">
        <button
          onClick={() => setFilterCat('all')}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold ${filterCat === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
        >
          すべて
        </button>
        {categories.filter(c => !c.is_fixed).map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold ${filterCat === cat.id ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* メニューグリッド */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 py-12">メニューがありません</div>
          )}
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
                  <button onClick={() => openEdit(item)} className="flex-1 text-xs bg-gray-50 text-gray-600 font-bold py-1.5 rounded-lg">編集</button>
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
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editing.id ? 'メニューを編集' : 'メニューを追加'}</h2>

            {/* 写真エリア */}
            <div
              onClick={() => !converting && fileRef.current?.click()}
              className="w-full h-40 rounded-2xl mb-2 overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center"
            >
              {converting ? (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                  <span className="text-xs font-medium">変換中…</span>
                </div>
              ) : imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageData} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 select-none">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm font-medium">タップして写真を選択</span>
                  <span className="text-xs">JPG / PNG / HEIC</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3 min-h-5">
              {imageData && (
                <>
                  <span className="text-xs text-green-600 font-medium">
                    ✓ 写真あり（約{Math.round(imageData.length / 1024)}KB）
                  </span>
                  <button
                    onClick={() => setImageData(null)}
                    className="text-xs text-red-400 hover:text-red-600 font-bold"
                  >
                    ✕ 削除
                  </button>
                </>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <label className="block text-sm font-semibold text-gray-600 mb-1">商品名 *</label>
            <input
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="例：和牛ステーキ"
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
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">選択してください</option>
              {categories.filter(c => !c.is_fixed).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>

            {saveError && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-3 py-2 mb-3">
                ❌ {saveError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeEdit} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl">
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving || converting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-3 rounded-xl"
              >
                {converting ? '変換中…' : saving ? '保存中…' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
