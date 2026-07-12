import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const targets = [
  'push-up','decline push-up','diamond push-up','dip','pull-up','chin-up','scapular pull-up','handstand','hollow','superman','hanging knee raise','hanging leg raise','toes to bar','l-sit','v-sit','split squats','single leg squat','jump squat','cossack','ankle','thoracic','wrist','external rotation'
]
for (const term of targets) {
  const { data, error } = await supabase
    .from('exercises')
    .select('name,source_provider,equipment,muscle_group')
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(15)
  if (error) {
    console.error(term, error)
    process.exit(1)
  }
  console.log(`\n## ${term}`)
  console.log(JSON.stringify(data, null, 2))
}
