import type { Metadata } from 'next'
import AppLayoutClient from './_components/AppLayoutClient'

export const metadata: Metadata = {
  title: {
    default: 'Feed · MyGym',
    template: '%s · MyGym',
  },
  description:
    'Explora el feed público de workouts, descubre nuevos workouts y conecta con la comunidad MyGym.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/feed',
  },
  openGraph: {
    title: 'Feed · MyGym',
    description: 'Explora rutinas de gimnasio compartidas por la comunidad.',
    url: '/feed',
    type: 'website',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Feed',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Feed · MyGym',
    description: 'Explora rutinas de gimnasio compartidas por la comunidad MyGym.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayoutClient>{children}</AppLayoutClient>
}
