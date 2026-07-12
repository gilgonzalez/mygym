import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const targets = [
  'split squat','bulgarian','single leg squat','single-leg squat','pistol','shrimp','skater squat','step-up','jump squat','explosive pull-up','chest-to-bar','chest to bar','clap pull-up','pull up high','high pull-up','wall handstand','handstand walk','wall walk','arch hold','superman','back extension','dead hang','support hold','dip support','straight bar dip'
]
for (const term of targets) {
  const { data, error } = await supabase.from('exercises').select('name,source_provider,muscle_group,equipment').ilike('name', `%${term}%`).order('name').limit(12)
  if (error) { console.error(term, error); process.exit(1) }
  console.log(`\n## ${term}`)
  console.log(JSON.stringify(data, null, 2))
}
