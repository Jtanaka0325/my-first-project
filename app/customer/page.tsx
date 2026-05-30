'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase, TemperatureFeeling } from '@/lib/supabase'

function CustomerForm() {
  const searchParams = useSearchParams()
  const tableNumber = parseInt(searchParams.get('table') ?? '1', 10)

  const [temperature, setTemperature] = useState<TemperatureFeeling | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const temperatureOptions = [
    { value: 'cold' as TemperatureFeeling, emoji: '🥶', label: '寒い', bg: 'bg-blue-100 border-blue-300', selected: 'bg-blue-500 text-white border-blue-500' },
    { value: 'good' as TemperatureFeeling, emoji: '😊', label: 'ちょうどいい', bg: 'bg-green-100 border-green-300', selected: 'bg-green-500 text-white border-green-500' },
    { value: 'hot' as TemperatureFeeling, emoji: '🥵', label: '暑い', bg: 'bg-red-100 border-red-300', selected: 'bg-red-500 text-white border-red-500' },
  ]

  const handleSubmit = async () => {
    if (!temperature) {
      setError('温度の感想を選択してください')
      return
    }
    setSubmitting(true)
    setError('')

    const { error: supabaseError } = await supabase.from('feedbacks').insert({
      table_number: tableNumber,
      temperature_feeling: temperature,
      comment: comment.trim() || null,
    })

    if (supabaseError) {
      setError('送信に失敗しました。もう一度お試しください。')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center">
          <div className="text-7xl mb-6">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">ありがとうございました！</h1>
          <p className="text-gray-500 text-sm">お客様のご意見を大切にします。<br />快適な時間をお過ごしください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-xl font-bold text-gray-800">こえレポ</h1>
          <p className="text-sm text-gray-500 mt-1">{tableNumber}番テーブル</p>
        </div>

        <div className="mb-8">
          <p className="text-gray-700 font-semibold mb-4 text-center">今の温度はいかがですか？</p>
          <div className="flex flex-col gap-3">
            {temperatureOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTemperature(opt.value)}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all font-medium text-lg ${
                  temperature === opt.value ? opt.selected : `${opt.bg} text-gray-700 hover:opacity-80`
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-700 font-semibold mb-2">その他、気になることは？</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="気になったことがあれば自由にどうぞ"
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
        >
          {submitting ? '送信中…' : '送信する'}
        </button>
      </div>
    </div>
  )
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <CustomerForm />
    </Suspense>
  )
}
