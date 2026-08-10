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
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Registrarse',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Registrarse · MyGym',
    description:
      'Crea tu cuenta gratuita y empieza a entrenar con la plataforma fitness social.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
