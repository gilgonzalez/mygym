import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630,
}
export const alt = 'MyGym · Plataforma fitness para crear y compartir rutinas de gimnasio'

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #050608 0%, #0f172a 45%, #4c1d95 85%, #5b21b6 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accents */}
        <div
          style={{
            position: 'absolute',
            top: -150,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(14,165,233,0.3) 0%, rgba(14,165,233,0) 70%)',
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '64px 72px 0 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background:
                'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              boxShadow: '0 16px 48px rgba(139, 92, 246, 0.5)',
            }}
          >
            💪
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -1,
            }}
          >
            MyGym
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '0 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
            <div
              style={{
                fontSize: 80,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -2.5,
              }}
            >
              Entrena.
              <span
                style={{
                  background:
                    'linear-gradient(90deg, #a78bfa 0%, #60a5fa 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {' '}Comparte.
              </span>
              <br />
              Evoluciona.
            </div>
            <div
              style={{
                fontSize: 30,
                color: 'rgba(226, 232, 240, 0.8)',
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              La plataforma fitness social con +2300 ejercicios, editor de rutinas profesional y ejecución con retos AMRAP.
            </div>
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            padding: '0 72px 56px 72px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: 'rgba(226, 232, 240, 0.75)',
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            mygymgigo.vercel.app
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
            }}
          >
            {['🏋️', '🔥', '📊', '👥'].map((e, i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
