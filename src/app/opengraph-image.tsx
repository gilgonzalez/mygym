import { ImageResponse } from 'next/og'

export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630,
}
export const alt = 'MyGym · Plataforma fitness para crear y compartir rutinas de gimnasio'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #050608 0%, #0f172a 40%, #1e1b4b 75%, #312e81 100%)',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -180,
            width: 560,
            height: 560,
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            left: -160,
            width: 520,
            height: 520,
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(236,72,153,0.28) 0%, rgba(236,72,153,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '60%',
            width: 300,
            height: 300,
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0) 70%)',
          }}
        />

        {/* Top bar with brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '56px 72px 0 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background:
                  'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 20px 60px rgba(99, 102, 241, 0.45)',
                fontWeight: 900,
                fontSize: 36,
                letterSpacing: -1,
              }}
            >
              💪
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: -1.5,
                  background:
                    'linear-gradient(90deg, #ffffff 0%, #c7d2fe 60%, #a78bfa 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                MyGym
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: 'rgba(226, 232, 240, 0.7)',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Entrena · Comparte · Evoluciona
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 900,
              marginBottom: 28,
            }}
          >
            Crea rutinas
            <span
              style={{
                background:
                  'linear-gradient(90deg, #a78bfa 0%, #f472b6 50%, #fb7185 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {' '}profesionales
            </span>
            <br />y gamifica cada repetición
          </div>

          <div
            style={{
              fontSize: 30,
              color: 'rgba(226, 232, 240, 0.82)',
              maxWidth: 820,
              lineHeight: 1.4,
              fontWeight: 500,
              marginBottom: 44,
            }}
          >
            +2300 ejercicios · Editor drag &amp; drop · Retos AMRAP · Comunidad fitness · Progreso medible
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              maxWidth: 1000,
            }}
          >
            {[
              { label: '🏋️ Workouts', bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.5)' },
              { label: '🔥 AMRAP', bg: 'rgba(244,63,94,0.18)', border: 'rgba(244,63,94,0.5)' },
              { label: '📊 Estadísticas', bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.5)' },
              { label: '👥 Social', bg: 'rgba(234,179,8,0.18)', border: 'rgba(234,179,8,0.5)' },
            ].map((pill) => (
              <div
                key={pill.label}
                style={{
                  padding: '14px 26px',
                  borderRadius: 999,
                background: pill.bg,
                  border: `1.5px solid ${pill.border}`,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  color: '#f8fafc',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {pill.label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 72px 56px 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'rgba(226, 232, 240, 0.7)',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 24 }}>🔗</span>
            mygymgigo.vercel.app
          </div>
          <div
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: 22,
              letterSpacing: 0.3,
              boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
            }}
          >
            EMPEZAR GRATIS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
