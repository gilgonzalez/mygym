import type { Metadata } from 'next'
import { LandingExperience } from '@/components/landing/LandingExperience'

export const metadata: Metadata = {
  title: 'MyGym Landing',
  description: 'Descubre MyGym: crea, comparte y ejecuta rutinas con una biblioteca de mas de 2300 ejercicios.',
}

export default function LandingPage() {
  return <LandingExperience />
}
