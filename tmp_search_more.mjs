import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)

const targets = [
  'rotation',
  'thoracic',
  'shoulder',
  'stretch',
  'mobility',
  'curl',
  'carry',
  'pallof',
  'row',
  'lunge',
  'plank',
  'balance',
  'treadmill',
  'run',
  'assault',
  'bike',
  'rope',
  'stepmill',
  'calf raise',
  'ankle',
  'band walk',
  'monster walk',
  'bridge',
  'push-up',
  'dip',
  'pull-up',
  'muscle-up',
  'handstand',
  'lsit',
  'l-sit'
]

for (const term of targets) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,name,muscle_group,equipment,source_provider')
    .ilike('name', `%${term}%`)
    .limit(12)
    .order('name')

  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log(`\n## ${term}`)
  console.log(JSON.stringify(data, null, 2))
}
