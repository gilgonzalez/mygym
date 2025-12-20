import './globals.css'
import WorkoutCard from '../components/WorkoutCard'
import type { Workout } from '../types/database'
import { Card, CardHeader, CardContent } from '@/components/Card'
import { Button } from '@/components/Button'
import { TrendingUp, Users, Flame } from 'lucide-react'

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
      { id: 's1', workout_id: 'w1', name: 'Warm Up', order: 1, created_at: '', exercises: [{}, {}, {}] as any },
      { id: 's2', workout_id: 'w1', name: 'Main Circuit', order: 2, created_at: '', exercises: [{}, {}, {}, {}] as any },
      { id: 's3', workout_id: 'w1', name: 'Cool Down', order: 3, created_at: '', exercises: [{}, {}] as any },
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
    sections: [
       { id: 's4', workout_id: 'w2', name: 'High Intensity Intervals', order: 1, created_at: '', exercises: [{}, {}, {}, {}, {}] as any },
       { id: 's5', workout_id: 'w2', name: 'Active Recovery', order: 2, created_at: '', exercises: [{}, {}] as any },
    ],
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Sidebar Column */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        {/* Trending Section */}
        <Card className="glass border-none shadow-lg">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-lg">Trending Now</h2>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {['#SummerBody', '#CrossFitGames', '#MorningRoutine', '#Calisthenics'].map((tag, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{tag}</span>
                <span className="text-xs text-muted-foreground/60">{10 + i}k posts</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Suggested Users Section */}
        <Card className="glass border-none shadow-lg">
          <CardHeader className="pb-3 border-b border-border/50">
             <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-lg">Who to Follow</h2>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
                  <div>
                    <p className="text-sm font-medium leading-none">Gym Rat {i + 1}</p>
                    <p className="text-xs text-muted-foreground">Suggested for you</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">Follow</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

