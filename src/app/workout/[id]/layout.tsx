import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrenamiento',
  description:
    'Ejecuta tu entrenamiento en MyGym con soporte para retos AMRAP, descansos automáticos y seguimiento en tiempo real.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Workout · MyGym',
    description: 'Ejecuta entrenamientos con retos AMRAP, seguimiento y estadísticas.',
    type: 'article',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Entrenamiento',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workout · MyGym',
    description: 'Ejecuta entrenamientos con retos AMRAP y seguimiento en tiempo real.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen  w-full bg-background">
      {children}
    </main>
  );
}
