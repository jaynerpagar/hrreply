import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HRReply.in — AI reply assistant for Indian recruiters'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#1F2937',
          padding: '80px',
        }}
      >
        {/* Double-tick mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, background: '#1F2937', borderRadius: 16,
            border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="40" height="40" viewBox="0 0 100 100">
              <path d="M20 52 L36 70 L64 32" fill="none" stroke="#A3E635" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M44 66 L48 70 L78 32" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            HRReply.in
          </span>
        </div>

        {/* Headline */}
        <div style={{ color: '#ffffff', fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, maxWidth: 800 }}>
          Write perfect HR messages
          <span style={{ color: '#A3E635' }}> in seconds.</span>
        </div>

        {/* Subtext */}
        <div style={{ color: '#9CA3AF', fontSize: 26, lineHeight: 1.4, maxWidth: 700 }}>
          AI-powered replies for Indian recruiters — formal, friendly, or Hinglish.
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 6, background: '#A3E635',
        }} />
      </div>
    ),
    { ...size },
  )
}
