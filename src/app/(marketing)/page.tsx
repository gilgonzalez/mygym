import type { Metadata } from 'next'
import LandingExperience from '@/components/landing/LandingExperience'

export const metadata: Metadata = {
  title: 'MyGym · Crea, comparte y ejecuta workouts de gimnasio',
  description:
    'MyGym es la plataforma fitness para crear workouts profesionales, ejecutar entrenamientos con retos AMRAP, compartir tu progreso y gamificar cada repetición con una biblioteca de más de 2300 ejercicios.',
  keywords: [
    'mygym',
    'workouts gimnasio',
    'entrenamiento',
    'workout',
    'ejercicios gym',
    'plan de entrenamiento',
    'AMRAP',
    'gamificacion fitness',
    'social network gym',
    'gym rats',
    'crear workout',
    'retos fitness',
    'progreso gym',
    'ejercicios musculacion',
  ],
  authors: [{ name: 'MyGym Team' }],
  creator: 'MyGym',
  publisher: 'MyGym',
  alternates: {
    canonical: '/',
    languages: {
      es: '/',
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'MyGym',
    title: 'MyGym · Entrena. Comparte. Evoluciona.',
    description:
      'Crea workouts profesionales, ejecuta entrenamientos con retos AMRAP, comparte tu progreso y gamifica cada repetición. Todo en una sola app.',
    locale: 'es_ES',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym - Crea, comparte y ejecuta workouts de gimnasio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyGym · Entrena. Comparte. Evoluciona.',
    description:
      'Crea workouts profesionales, ejecuta entrenamientos con retos AMRAP, comparte tu progreso y gamifica cada repetición.',
    creator: '@mygym',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'Fitness',
}

export default function LandingPage() {
  return <LandingExperience />
}
