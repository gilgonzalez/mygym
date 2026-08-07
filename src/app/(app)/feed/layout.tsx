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
}

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
