'use client'

import { useState, useEffect } from 'react'
import { supabase, Feedback } from '@/lib/supabase'

const STAFF_PIN = process.env.NEXT_PUBLIC_STAFF_PIN ?? '1234'

const tempLabel: Record<string, { emoji: string; label: string; color: string }> = {
  cold: { emoji: '🥶', label: '寒い', color: 'text-blue-600 bg-blue-50' },
  good: { emoji: '😊', label: 'ちょうどいい', color: 'text-green-600 bg-green-50' },
  hot: { emoji: '🥵', label: '暑い', color: 'text-red-600 bg-red-50' },
}

export default function StaffPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])

  const handlePinSubmit = () => {
    if (pin === STAFF_PIN) {
      setAuthenticated(true)
    } else {
      setPinError(true)
      setPin('')
    }
  }

  useEffect(() => {
    if (!authenticated) return

    const fetchFeedbacks = async () => {
      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (data) setFeedbacks(data as Feedback[])
    }

    fetchFeedbacks()

    const channel = supabase
      .channel('feedbacks-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks' }, () => {
        fetchFeedbacks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authenticated])

  const handleResolve = async (id: string) => {
    await supabase
      .from('feedbacks')
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id)
    setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, is_resolved: true } : f)))
  }

  const unresolvedCount = feedbacks.filter((f) => !f.is_resolved).length
  const coldCount = feedbacks.filter((f) => !f.is_resolved && f.temperature_feeling === 'cold').length
  const hotCount = feedbacks.filter((f) => !f.is_resolved && f.temperature_feeling === 'hot').length

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xs text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold mb-2">スタッフ認証</h1>
          <p className="text-gray-500 text-sm mb-6">4桁のPINを入力してください</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            className="w-full text-center text-3xl tracking-widest border-2 border-gray-200 rounded-xl py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="····"
          />
          {pinError && <p className="text-red-500 text-sm mb-3">PINが違います</p>}
          <button
            onClick={handlePinSubmit}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            ログイン
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">🔔 スタッフ通知</h1>
          {unresolvedCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              🔴 {unresolvedCount}件
            </span>
          )}
        </div>
      </div>

      {/* サマリー */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl">🥶</div>
            <div className="text-2xl font-bold text-blue-600">{feedbacks.filter(f => f.temperature_feeling === 'cold').length}</div>
            <div className="text-xs text-gray-500">寒い</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl">😊</div>
            <div className="text-2xl font-bold text-green-600">{feedbacks.filter(f => f.temperature_feeling === 'good').length}</div>
            <div className="text-xs text-gray-500">良好</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl">🥵</div>
            <div className="text-2xl font-bold text-red-600">{feedbacks.filter(f => f.temperature_feeling === 'hot').length}</div>
            <div className="text-xs text-gray-500">暑い</div>
          </div>
        </div>

        {coldCount >= 3 && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 px-4 py-3 rounded-xl mb-3 font-medium">
            ⚠️ 未対応の「寒い」が{coldCount}件あります。空調を確認してください。
          </div>
        )}
        {hotCount >= 3 && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-xl mb-3 font-medium">
            🚨 未対応の「暑い」が{hotCount}件あります。空調を確認してください。
          </div>
        )}

        {/* フィードバックリスト */}
        <div className="flex flex-col gap-3">
          {feedbacks.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
              フィードバックはまだありません
            </div>
          )}
          {feedbacks.map((fb) => {
            const t = tempLabel[fb.temperature_feeling]
            return (
              <div
                key={fb.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                  fb.is_resolved ? 'border-gray-200 opacity-60' : fb.temperature_feeling === 'cold' ? 'border-blue-400' : fb.temperature_feeling === 'hot' ? 'border-red-400' : 'border-green-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${t.color}`}>
                        {t.emoji} {t.label}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">{fb.table_number}番テーブル</span>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-2">{fb.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(fb.created_at).toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                  {!fb.is_resolved ? (
                    <button
                      onClick={() => handleResolve(fb.id)}
                      className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-colors"
                    >
                      対応済み
                    </button>
                  ) : (
                    <span className="text-green-600 text-sm font-bold whitespace-nowrap">✓ 対応済</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
