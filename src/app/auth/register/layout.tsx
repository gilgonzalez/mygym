import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrarse',
  description:
    'Crea tu cuenta gratuita en MyGym y empieza a crear rutinas profesionales, seguir tu progreso y conectar con la comunidad fitness.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Registrarse · MyGym',
    description:
      'Únete a MyGym gratis. Crea rutinas profesionales, ejecuta entrenamientos y comparte tu progreso con la comunidad.',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registrarse · MyGym',
    description:
      'Crea tu cuenta gratuita y empieza a entrenar con la plataforma fitness social.',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
