'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Category } from '@/lib/supabase'

const COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1']
const EMOJIS = ['🍺', '🍷', '🥩', '🍣', '🍜', '🥗', '🍰', '🍱', '🍕', '🥘', '🍛', '🥤', '☕', '🍻', '🫕']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)

  const fetch = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    if (data) setCategories(data as Category[])
  }

  useEffect(() => { fetch() }, [])

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
    fetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このカテゴリを削除しますか？（配下のメニューも削除されます）')) return
    await supabase.from('categories').delete().eq('id', id)
    fetch()
  }

  const moveOrder = async (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex(c => c.id === id)
    const target = categories[idx + dir]
    if (!target) return
    await Promise.all([
      supabase.from('categories').update({ sort_order: target.sort_order }).eq('id', id),
      supabase.from('categories').update({ sort_order: categories[idx].sort_order }).eq('id', target.id),
    ])
    fetch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white px-4 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white text-xl">←</Link>
          <h1 className="text-xl font-bold">📂 カテゴリ管理</h1>
        </div>
        <button
          onClick={() => setEditing({ name: '', icon: '🍽️', color: '#f97316' })}
          className="bg-white text-purple-600 font-bold px-4 py-2 rounded-xl text-sm"
        >
          ＋ 追加
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-3">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: cat.color }}>
              {cat.icon}
            </div>
            <span className="flex-1 font-bold text-gray-800">{cat.name}</span>
            {cat.is_fixed && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">固定</span>}
            <div className="flex gap-1">
              <button onClick={() => moveOrder(cat.id, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">▲</button>
              <button onClick={() => moveOrder(cat.id, 1)} disabled={idx === categories.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 px-1">▼</button>
              {!cat.is_fixed && (
                <>
                  <button onClick={() => setEditing(cat)} className="text-blue-500 hover:text-blue-700 px-2 text-sm font-bold">編集</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 px-2 text-sm font-bold">削除</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* モーダル */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing.id ? 'カテゴリを編集' : 'カテゴリを追加'}</h2>

            <label className="block text-sm font-semibold text-gray-600 mb-1">カテゴリ名</label>
            <input
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="例：ドリンク"
            />

            <label className="block text-sm font-semibold text-gray-600 mb-2">絵文字アイコン</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEditing({ ...editing, icon: e })}
                  className={`text-2xl p-1.5 rounded-xl transition-colors ${editing.icon === e ? 'bg-purple-100 ring-2 ring-purple-400' : 'hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-600 mb-2">カラー</label>
            <div className="flex gap-2 mb-6">
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
              <button onClick={() => setEditing(null)} className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl">キャンセル</button>
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
