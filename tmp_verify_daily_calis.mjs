import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const { data, error } = await supabase
  .from('workouts')
  .select(`title, visibility, difficulty, estimated_time, tags, user_id, workout_sections(section_id, sections(name, section_exercises(id)))`)
  .eq('user_id', '22222222-2222-4222-8222-222222222222')
  .eq('title', 'Calistenia diaria sin material (barra opcional)')
  .single()
if (error) { console.error(error); process.exit(1) }
const summary = {
  title: data.title,
  visibility: data.visibility,
  difficulty: data.difficulty,
  estimated_time: data.estimated_time,
  tags: data.tags,
  user_id: data.user_id,
  sections: (data.workout_sections || []).length,
  exercises: (data.workout_sections || []).reduce((acc, ws) => acc + ((ws.sections?.section_exercises || []).length), 0)
}
console.log(JSON.stringify(summary, null, 2))
