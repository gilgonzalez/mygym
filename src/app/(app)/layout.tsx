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
    description: 'Explora workouts de gimnasio compartidas por la comunidad.',
    url: '/feed',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary',
    title: 'Feed · MyGym',
    description: 'Explora workouts de gimnasio compartidas por la comunidad.',
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayoutClient>{children}</AppLayoutClient>
}
