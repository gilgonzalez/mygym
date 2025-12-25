'use client'

import WorkoutCard from '../../../components/WorkoutCard'
import type { Workout } from '../../../types/database'

const sampleExplore: Workout = {
  id: 'w2',
  user_id: 'u2',
  title: 'Cardio Blast',
  description: 'High-energy cardio session.',
  category: 'cardio',
  difficulty: 'intermediate',
  duration_minutes: 30,
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user: { id: 'u2', email: 'jane@example.com', username: 'jane', name: 'Jane Smith', avatar_url: '', created_at: '', updated_at: '' },
  sections: [
    {
      id: 's2',
      workout_id: 'w2',
      name: 'Main Set',
      order_index: 1,
      created_at: '',
    },
  ],
  likes_count: 7,
  is_liked: false,
}

export default function ExplorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
      <WorkoutCard workout={sampleExplore} />
    </div>
  )
}



