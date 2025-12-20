'use client'

import WorkoutCard from '@/components/WorkoutCard'
import type { Workout } from '@/types/database'
import { Button } from '@/components/Button'

// Temporary mock data until we connect to Supabase
const sampleWorkouts: Workout[] = [
  {
    id: 'w1',
    user_id: 'u1',
    title: 'Full Body Starter',
    description: 'A beginner-friendly full body routine to get your muscles moving.',
    category: 'strength',
    difficulty: 'beginner',
    duration_minutes: 45,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 'u1', email: 'john@example.com', username: 'johndoe', name: 'John Doe', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', created_at: '', updated_at: '' },
    sections: [
      { id: 's1', workout_id: 'w1', name: 'Warm Up', order_index: 1, created_at: '' },
      { id: 's2', workout_id: 'w1', name: 'Main Circuit', order_index: 2, created_at: '' },
      { id: 's3', workout_id: 'w1', name: 'Cool Down', order_index: 3, created_at: '' },
    ],
    likes_count: 12,
    is_liked: false,
  },
  {
    id: 'w2',
    user_id: 'u2',
    title: 'HIIT Cardio Blast',
    description: 'Intense high-interval training to burn fat quickly.',
    category: 'cardio',
    difficulty: 'intermediate',
    duration_minutes: 30,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 'u2', email: 'jane@example.com', username: 'janefit', name: 'Jane Fit', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane', created_at: '', updated_at: '' },
    sections: [],
    likes_count: 45,
    is_liked: true,
  },
  {
    id: 'w3',
    user_id: 'u3',
    title: 'Yoga for Flexibility',
    description: 'Relaxing yoga flow to improve flexibility and reduce stress.',
    category: 'flexibility',
    difficulty: 'beginner',
    duration_minutes: 60,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 'u3', email: 'yoga@example.com', username: 'yogamaster', name: 'Yoga Master', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yoga', created_at: '', updated_at: '' },
    sections: [],
    likes_count: 89,
    is_liked: false,
  },
  {
    id: 'w4',
    user_id: 'u4',
    title: 'Powerlifting 5x5',
    description: 'Classic strength program focused on compound movements.',
    category: 'strength',
    difficulty: 'advanced',
    duration_minutes: 90,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: 'u4', email: 'power@example.com', username: 'ironlifter', name: 'Iron Lifter', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iron', created_at: '', updated_at: '' },
    sections: [],
    likes_count: 120,
    is_liked: true,
  },
]

export default function Page() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 via-green-600 to-slate-900 dark:from-emerald-700 via-emerald-400 dark:to-slate-400 bg-clip-text text-transparent">
            Discover Workouts
          </h1>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Newest</Button>
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Popular</Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          {sampleWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </div>
      
      {/* Sidebar Column (Optional - for trending tags, suggested users, etc.) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
         <div className="sticky top-24 p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold mb-4">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
                {['#SummerBody', '#HIIT', '#YogaLife', '#Bulking', '#Calisthenics'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs cursor-pointer hover:bg-primary/20 transition-colors">
                        {tag}
                    </span>
                ))}
            </div>
         </div>
      </div>
    </div>
  )
}