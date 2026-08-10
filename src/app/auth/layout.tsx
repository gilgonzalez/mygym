import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Iniciar sesión · MyGym',
    template: '%s · MyGym',
  },
  description:
    'Accede a tu cuenta MyGym o regístrate gratis para empezar a crear workouts, seguir tu progreso y conectar con la comunidad.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Iniciar sesión · MyGym',
    description:
      'Accede o regístrate gratis en MyGym. Crea rutinas profesionales, ejecuta entrenamientos y sigue tu progreso.',
    type: 'website',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Iniciar sesión',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iniciar sesión · MyGym',
    description:
      'Accede o regístrate gratis en la plataforma fitness social.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
