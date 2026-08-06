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
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
