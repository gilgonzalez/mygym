import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Creador de Workouts',
  description:
    'Crea y edita tus rutinas de gimnasio con el editor drag & drop de MyGym. Añade ejercicios, descansos y retos AMRAP.',
  robots: {
    index: false,
    follow: false,
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
