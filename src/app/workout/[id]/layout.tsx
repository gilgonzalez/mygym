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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workout · MyGym',
    description: 'Ejecuta entrenamientos con retos AMRAP y seguimiento en tiempo real.',
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
