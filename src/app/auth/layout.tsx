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
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
