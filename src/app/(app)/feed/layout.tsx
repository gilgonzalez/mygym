import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Descubre Workouts',
  description:
    'Feed público de workouts de gimnasio. Encuentra workouts por popularidad, novedad, tags y creadores de la comunidad MyGym.',
  alternates: {
    canonical: '/feed',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Discover Workouts · MyGym',
    description:
      'Feed público de rutinas. Encuentra workouts por popularidad, novedad, tags y creadores de la comunidad MyGym.',
    type: 'website',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    url: '/feed',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Discover Workouts',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Workouts · MyGym',
    description:
      'Explora y descubre rutinas de gimnasio compartidas por la comunidad.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
