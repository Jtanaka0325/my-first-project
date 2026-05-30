'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase, Category } from '@/lib/supabase'

const COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#64748b']

const EMOJI_GROUPS = [
  { label: '料理', emojis: ['🍽️','🍜','🍣','🍱','🍛','🥘','🫕','🍲','🥗','🍕','🍔','🌮','🌯','🥙','🥪','🍞','🥐','🧆','🥚','🍳'] },
  { label: '肉・魚', emojis: ['🥩','🍗','🍖','🥓','🦐','🦞','🦀','🐟','🍤','🥟'] },
  { label: 'デザート', emojis: ['🍰','🎂','🧁','🍮','🍩','🍪','🍫','🍬','🍭','🧇','🍡','🍧','🍨','🍦','🫙'] },
  { label: 'ドリンク', emojis: ['🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','☕','🍵','🧃','🥤','🧋','🍶','🫖'] },
  { label: 'その他', emojis: ['⭐','🔥','✨','🎉','💯','🆕','🉐','🎁','🛎️','📋','🧾','💬','🌡️'] },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [emojiTab, setEmojiTab] = useState(0)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const iconFileRef = useRef<HTMLInputElement>(null)

  const fetchCats = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data) setCategories(data as Category[])
  }

  useEffect(() => { fetchCats() }, [])

  const handleIconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 120
        canvas.height = 120
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, 120, 120)
        const dataUrl = canvas.toDataURL('image/png', 0.9)
        setIconPreview(dataUrl)
        setEditing((prev) => prev ? { ...prev, icon: dataUrl } : prev)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!editing?.name) return
    setSaving(true)
    if (editing.id) {
      await supabase.from('categories').update({
        name: editing.name, icon: editing.icon, color: editing.color,
      }).eq('id', editing.id)
    } else {
      const maxOrder = Math.max(0, ...categories.map(c => c.sort_order))
      await supabase.from('categories').insert({
        name: editing.name, icon: editing.icon ?? '🍽️',
        color: editing.color ?? '#f97316', sort_order: maxOrder + 1,
      })
    }
    setSaving(false)
    setEditing(null)
    setIconPreview(null)
    fetchCats()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このカテゴリを削除しますか？（配下のメニューも削除されます）')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCats()
  }

  const moveOrder = async (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex(c => c.id === id)
    const target = categories[idx + dir]
    if (!target) return
    await Promise.all([
      supabase.from('categories').update({ sort_order: target.sort_order }).eq('id', id),
      supabase.from('categories').update({ sort_order: categories[idx].sort_order }).eq('id', target.id),
    ])
    fetchCats()
  }

  const isImageIcon = (icon?: string) => icon?.startsWith('data:')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white px-4 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white text-xl">←</Link>
          <h1 className="text-xl font-bold">📂 カテゴリ管理</h1>
        </div>
        <button
          onClick={() => { setEditing({ name: '', icon: '🍽️', color: '#f97316' }); setIconPreview(null); setEmojiTab(0) }}
          className="bg-white text-purple-600 font-bold px-4 py-2 rounded-xl text-sm"
        >
          ＋ 追加
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-3">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: isImageIcon(cat.icon) ? 'transparent' : cat.color }}>
              {isImageIcon(cat.icon) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{cat.icon}</span>
              )}
            </div>
            <span className="flex-1 font-bold text-gray-800">{cat.name}</span>
            {cat.is_fixed && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">固定</span>}
            <div className="flex gap-1 items-center">
              <button onClick={() => moveOrder(cat.id, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">▲</button>
              <button onClick={() => moveOrder(cat.id, 1)} disabled={idx === categories.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">▼</button>
              {!cat.is_fixed && (
                <>
                  <button onClick={() => { setEditing(cat); setIconPreview(isImageIcon(cat.icon) ? cat.icon : null); setEmojiTab(0) }} className="text-blue-500 hover:text-blue-700 px-2 text-sm font-bold">編集</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 px-2 text-sm font-bold">削除</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4">
            <h2 className="text-lg font-bold mb-4">{editing.id ? 'カテゴリを編集' : 'カテゴリを追加'}</h2>

            <label className="block text-sm font-semibold text-gray-600 mb-1">カテゴリ名</label>
            <input
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="例：ドリンク"
            />

            {/* アイコン選択 */}
            <label className="block text-sm font-semibold text-gray-600 mb-2">アイコン</label>

            {/* 現在のアイコンプレビュー */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-purple-200" style={{ backgroundColor: isImageIcon(editing.icon) ? '#f3f4f6' : (editing.color ?? '#f97316') }}>
                {isImageIcon(editing.icon) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.icon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{editing.icon}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">選択中のアイコン</p>
                <button
                  onClick={() => iconFileRef.current?.click()}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg"
                >
                  📷 画像をアップロード
                </button>
              </div>
            </div>
            <input ref={iconFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleIconFile} />

            {/* 絵文字タブ */}
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {EMOJI_GROUPS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setEmojiTab(i)}
                  className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${emojiTab === i ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto p-1">
              {EMOJI_GROUPS[emojiTab].emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => { setEditing({ ...editing, icon: e }); setIconPreview(null) }}
                  className={`text-2xl p-1.5 rounded-xl transition-colors ${editing.icon === e && !isImageIcon(editing.icon) ? 'bg-purple-100 ring-2 ring-purple-400' : 'hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-600 mb-2">カラー</label>
            <div className="flex gap-2 mb-6 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditing({ ...editing, color: c })}
                  className={`w-8 h-8 rounded-full transition-transform ${editing.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setEditing(null); setIconPreview(null) }} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
