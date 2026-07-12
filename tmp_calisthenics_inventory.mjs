import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const targets = [
  'push-up','dip','planche','pseudo planche','handstand','pull-up','chin-up','archer','typewriter','muscle-up',
  'front lever','hollow','arch hold','hanging knee raise','hanging leg raise','toes to bar','dragon flag','v-sit','l-sit','crow pose',
  'bulgarian split squat','shrimp squat','pistol squat','jump squat','scapular pull','scapular push','external rotation','wrist','forearm','cossack','thoracic','ankle','pallof'
]
for (const term of targets) {
  const { data, error } = await supabase
    .from('exercises')
    .select('name,source_provider,muscle_group,equipment')
    .ilike('name', `%${term}%`)
    .order('name')
    .limit(12)
  if (error) {
    console.error(term, error)
    process.exit(1)
  }
  console.log(`\n## ${term}`)
  console.log(JSON.stringify(data, null, 2))
}
