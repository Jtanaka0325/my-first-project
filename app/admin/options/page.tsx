'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, MenuItem, OptionGroup, Option } from '@/lib/supabase'

type GroupWithOptions = OptionGroup & { options: Option[] }

function OptionsEditor() {
  const searchParams = useSearchParams()
  const itemId = searchParams.get('item') ?? ''
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [groups, setGroups] = useState<GroupWithOptions[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupRequired, setNewGroupRequired] = useState(false)
  const [newOptionName, setNewOptionName] = useState<Record<string, string>>({})
  const [newOptionPrice, setNewOptionPrice] = useState<Record<string, number>>({})

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('option_groups')
      .select('*, options(*)')
      .eq('menu_item_id', itemId)
      .order('created_at')
    if (data) setGroups(data as GroupWithOptions[])
  }

  useEffect(() => {
    if (!itemId) return
    supabase.from('menu_items').select('*').eq('id', itemId).single()
      .then(({ data }) => { if (data) setMenuItem(data as MenuItem) })
    fetchGroups()
  }, [itemId])

  const addGroup = async () => {
    if (!newGroupName.trim()) return
    await supabase.from('option_groups').insert({
      menu_item_id: itemId, name: newGroupName.trim(), is_required: newGroupRequired,
    })
    setNewGroupName('')
    setNewGroupRequired(false)
    fetchGroups()
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('このオプショングループを削除しますか？')) return
    await supabase.from('option_groups').delete().eq('id', id)
    fetchGroups()
  }

  const addOption = async (groupId: string) => {
    const name = newOptionName[groupId]?.trim()
    if (!name) return
    await supabase.from('options').insert({
      option_group_id: groupId,
      name,
      extra_price: newOptionPrice[groupId] ?? 0,
    })
    setNewOptionName((p) => ({ ...p, [groupId]: '' }))
    setNewOptionPrice((p) => ({ ...p, [groupId]: 0 }))
    fetchGroups()
  }

  const deleteOption = async (id: string) => {
    await supabase.from('options').delete().eq('id', id)
    fetchGroups()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white px-4 py-4 shadow-md flex items-center gap-3">
        <Link href="/admin/menu" className="text-white text-xl">←</Link>
        <div>
          <h1 className="text-xl font-bold">⚙️ オプション管理</h1>
          {menuItem && <p className="text-indigo-200 text-xs">{menuItem.name}</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* 新規グループ追加 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-3 text-sm">＋ オプショングループを追加</h2>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="例：焼き方・サイズ・辛さ"
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newGroupRequired}
                onChange={(e) => setNewGroupRequired(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
              必須選択
            </label>
          </div>
          <button
            onClick={addGroup}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm"
          >
            グループを追加
          </button>
        </div>

        {/* グループ一覧 */}
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{group.name}</span>
                {group.is_required && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">必須</span>
                )}
              </div>
              <button onClick={() => deleteGroup(group.id)} className="text-red-400 text-sm font-bold">削除</button>
            </div>

            {/* オプション一覧 */}
            <div className="flex flex-col gap-2 mb-3">
              {group.options.map((opt) => (
                <div key={opt.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm text-gray-700">{opt.name}</span>
                  <div className="flex items-center gap-3">
                    {opt.extra_price > 0 && (
                      <span className="text-orange-500 text-xs font-bold">+¥{opt.extra_price}</span>
                    )}
                    <button onClick={() => deleteOption(opt.id)} className="text-gray-400 hover:text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* オプション追加 */}
            <div className="flex gap-2">
              <input
                value={newOptionName[group.id] ?? ''}
                onChange={(e) => setNewOptionName((p) => ({ ...p, [group.id]: e.target.value }))}
                placeholder="オプション名"
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <input
                type="number" min={0}
                value={newOptionPrice[group.id] ?? 0}
                onChange={(e) => setNewOptionPrice((p) => ({ ...p, [group.id]: parseInt(e.target.value) || 0 }))}
                placeholder="追加料金"
                className="w-24 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => addOption(group.id)}
                className="bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm"
              >
                追加
              </button>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center text-gray-400 py-8">オプションがまだありません</div>
        )}
      </div>
    </div>
  )
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中…</div>}>
      <OptionsEditor />
    </Suspense>
  )
}
