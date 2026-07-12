import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)

const targets = [
  'barbell high bar squat',
  'barbell bench press',
  'barbell romanian deadlift',
  'barbell deadlift',
  'barbell seated overhead press',
  'barbell pendlay row',
  'pull-up',
  'chin-up',
  'burpee',
  'air bike',
  'jump rope',
  'step-up',
  "world's greatest stretch",
  'cossack squat',
  'jefferson curl',
  'shoulder cars',
  'hollow hold',
  'dip',
  'pike push-up',
  'farmer carry',
  'turkish get-up',
  'kettlebell swing',
  'goblet squat',
  'sled push',
  'landmine press',
  'bird dog',
  'dead bug',
  'copenhagen plank',
  'face pull',
  'glute bridge',
  'monster walk',
  'walking',
  'single leg balance'
]

const rows = []
for (const term of targets) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,name,muscle_group,equipment,source_provider')
    .ilike('name', `%${term}%`)
    .limit(8)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  rows.push({ term, matches: data })
}

console.log(JSON.stringify(rows, null, 2))
