import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Creador de Workouts',
  description:
    'Crea y edita tus workouts de gimnasio con el editor drag & drop de MyGym. Añade ejercicios, descansos y retos AMRAP.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Creador de Workouts · MyGym',
    description:
      'Editor drag & drop para crear rutinas de gimnasio profesionales. Añade ejercicios, descansos y retos AMRAP.',
    type: 'website',
    locale: 'es_ES',
    countryName: 'España',
    siteName: 'MyGym',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MyGym · Creador de Workouts',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creador de Workouts · MyGym',
    description:
      'Crea rutinas profesionales con el editor drag & drop de MyGym.',
    creator: '@mygym',
    site: '@mygym',
    images: ['/og-image.png'],
  },
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}
