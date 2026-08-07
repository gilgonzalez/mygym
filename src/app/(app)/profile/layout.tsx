import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mi Perfil',
  description:
    'Gestiona tu perfil MyGym, revisa tu progreso, estadísticas, nivel RPG, streak y tus workouts creados.',
  alternates: {
    canonical: '/profile',
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Mi Perfil · MyGym',
    description:
      'Progreso, estadísticas, nivel RPG, streak y workouts creados en tu perfil MyGym.',
    type: 'profile',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Mi Perfil',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Perfil · MyGym',
    description: 'Tu perfil, estadísticas y progreso en MyGym.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
