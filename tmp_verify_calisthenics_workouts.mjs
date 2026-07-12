import { createClient } from '@supabase/supabase-js'
const titles = [
  'From Zero To Hero I - Fundamentos',
  'From Zero To Hero II - Fuerza estructural',
  'From Zero To Hero III - Fuerza avanzada',
  'From Zero To Hero IV - Habilidades avanzadas',
  'From Zero To Hero V - Elite calistenica'
]
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const { data, error } = await supabase
  .from('workouts')
  .select(`title, visibility, difficulty, estimated_time, workout_sections(section_id, sections(name, section_exercises(id)))`)
  .eq('user_id', '22222222-2222-4222-8222-222222222222')
  .in('title', titles)
if (error) { console.error(error); process.exit(1) }
const summary = (data || []).map((workout) => ({
  title: workout.title,
  visibility: workout.visibility,
  difficulty: workout.difficulty,
  estimated_time: workout.estimated_time,
  sections: (workout.workout_sections || []).length,
  exercises: (workout.workout_sections || []).reduce((acc, ws) => acc + ((ws.sections?.section_exercises || []).length), 0)
}))
console.log(JSON.stringify({ seeded: summary.length, summary: summary.sort((a,b) => a.title.localeCompare(b.title)) }, null, 2))
