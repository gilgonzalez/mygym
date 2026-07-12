import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const { data, error } = await supabase
  .from('workouts')
  .select('title,visibility,difficulty,tags,user_id,workout_sections(count), section_exercises:workout_sections(section_exercises:section_exercises(count))')
  .eq('user_id', 'fd4c358d-7cf7-410e-9637-1a95bd5bbd7a')
  .order('created_at', { ascending: true })
if (error) { console.error(error); process.exit(1) }
console.log(JSON.stringify(data, null, 2))
