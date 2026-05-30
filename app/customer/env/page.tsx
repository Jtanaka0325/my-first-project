'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, TemperatureFeeling } from '@/lib/supabase'
import { useCartStore } from '@/lib/cart-store'

const OPTIONS = [
  { value: 'cold' as TemperatureFeeling, emoji: '🥶', label: '寒い', cls: 'border-blue-300 bg-blue-50', sel: 'border-blue-500 bg-blue-500 text-white' },
  { value: 'good' as TemperatureFeeling, emoji: '😊', label: 'ちょうどいい', cls: 'border-green-300 bg-green-50', sel: 'border-green-500 bg-green-500 text-white' },
  { value: 'hot' as TemperatureFeeling, emoji: '🥵', label: '暑い', cls: 'border-red-300 bg-red-50', sel: 'border-red-500 bg-red-500 text-white' },
]

function EnvForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)
  const [temp, setTemp] = useState<TemperatureFeeling | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const { items } = useCartStore()
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => router.push(`/customer?table=${tableNumber}`), 3000)
      return () => clearTimeout(t)
    }
  }, [done, tableNumber, router])

  const handleSubmit = async () => {
    if (!temp) { setError('温度を選択してください'); return }
    setSubmitting(true)
    await supabase.from('feedbacks').insert({
      table_number: tableNumber,
      temperature_feeling: temp,
      comment: comment.trim() || null,
    })
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-xl font-bold text-gray-800">ありがとうございました！</h2>
          <p className="text-gray-400 text-sm mt-2">3秒後にメニューに戻ります</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-indigo-50 pb-24">
      <div className="bg-indigo-600 text-white px-4 py-4 shadow-md flex items-center gap-3">
        <Link href={`/customer?table=${tableNumber}`} className="text-white text-xl">←</Link>
        <h1 className="text-xl font-bold">🌡️ お店環境レポ</h1>
      </div>

      <div className="p-6 max-w-sm mx-auto">
        <p className="text-gray-700 font-bold text-lg text-center mb-6">今のお席はいかがですか？</p>

        <div className="flex flex-col gap-3 mb-8">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTemp(opt.value); setError('') }}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all font-bold text-lg ${temp === opt.value ? opt.sel : `${opt.cls} text-gray-700`}`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-gray-600 font-semibold mb-2 text-sm">💬 気になることがあれば…（任意）</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="明るさ・におい・騒音など気になることをどうぞ"
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          {submitting ? '送信中…' : '送信する'}
        </button>
      </div>

      {totalQty > 0 && (
        <button
          onClick={() => router.push(`/customer/cart?table=${tableNumber}`)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full shadow-xl flex items-center gap-2 px-5 py-3 font-bold z-50"
        >
          🛒 <span className="bg-white text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">{totalQty}</span>
        </button>
      )}
    </div>
  )
}

export default function EnvPage() {
  return (
    <Suspense fallback={null}>
      <EnvForm />
    </Suspense>
  )
}
