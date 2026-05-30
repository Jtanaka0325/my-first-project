import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          borderRadius: 102,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 280,
        }}
      >
        💬
      </div>
    ),
    { width: 512, height: 512 }
  )
}
