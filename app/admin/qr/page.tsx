'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRPage() {
  const [tableNumber, setTableNumber] = useState(1)
  const [maxTable, setMaxTable] = useState(10)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">📱 QRコード生成</h1>
          <p className="text-gray-500 text-sm mb-8">テーブルごとのQRコードを生成・印刷できます</p>

          {/* 単体生成 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">テーブル番号を選択</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={99}
                value={tableNumber}
                onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                className="w-24 border-2 border-gray-200 rounded-xl px-3 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-gray-500">番テーブル</span>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="bg-white p-4 border-2 border-gray-200 rounded-2xl">
                <QRCodeSVG
                  value={`${appUrl}/customer?table=${tableNumber}`}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-400 text-center break-all">{appUrl}/customer?table={tableNumber}</p>
              <p className="text-sm font-bold text-gray-700">{tableNumber}番テーブル</p>
            </div>
          </div>
        </div>

        {/* 一括印刷 */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">一括印刷</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-gray-600">テーブル数：</label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxTable}
              onChange={(e) => setMaxTable(parseInt(e.target.value) || 1)}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-2 text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <span className="text-gray-500">テーブル分</span>
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-lg"
          >
            🖨️ 印刷する
          </button>
        </div>
      </div>

      {/* 印刷用（画面非表示・印刷時表示） */}
      <div
        ref={printRef}
        className="hidden print:grid"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', padding: '24px' }}
      >
        {Array.from({ length: maxTable }, (_, i) => i + 1).map((num) => (
          <div
            key={num}
            style={{
              border: '1px solid #ddd',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              pageBreakInside: 'avoid',
            }}
          >
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316' }}>💬 MenuVoice</p>
            <QRCodeSVG value={`${appUrl}/customer?table=${num}`} size={150} level="M" includeMargin />
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{num}番テーブル</p>
            <p style={{ fontSize: '10px', color: '#999' }}>ご意見をお聞かせください</p>
          </div>
        ))}
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } .hidden.print\\:grid { display: grid !important; } }`}</style>
    </div>
  )
}
