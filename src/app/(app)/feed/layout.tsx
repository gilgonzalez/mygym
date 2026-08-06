import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover Workouts',
  description:
    'Feed público de rutinas de gimnasio. Encuentra workouts por popularidad, novedad, tags y creadores de la comunidad MyGym.',
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
