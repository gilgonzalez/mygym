import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)

const checks = [
  ['barbell high bar squat', 'exercise_db'],
  ['barbell bench press', 'exercise_db'],
  ['barbell pendlay row', 'exercise_db'],
  ['barbell romanian deadlift', 'exercise_db'],
  ['barbell seated overhead press', 'exercise_db'],
  ['chest dip', 'exercise_db'],
  ['Face pulls con banda amarilla/verde', 'wger'],
  ['Hollow hold', 'wger'],
  ['barbell deadlift', 'exercise_db'],
  ['chin-ups (narrow parallel grip)', 'exercise_db'],
  ['band horizontal pallof press', 'exercise_db'],
  ['barbell bent over row', 'exercise_db'],
  ['dumbbell goblet squat', 'exercise_db'],
  ['kettlebell swing', 'exercise_db'],
  ['burpee', 'exercise_db'],
  ['walking on incline treadmill', 'exercise_db'],
  ['traditional barbell romanian deadlift', 'exercise_db'],
  ['walking lunge', 'exercise_db'],
  ['stationary bike run', 'exercise_db'],
  ['air bike', 'exercise_db'],
  ['jump rope', 'exercise_db'],
  ['dumbbell step-up', 'exercise_db'],
  ['walking on stepmill', 'exercise_db'],
  ['Banded Ankle Mobility', 'wger'],
  ['ankle circles', 'exercise_db'],
  ['Rotación torácica en media rodilla', 'wger'],
  ['Balanceo de piernas (adelante y atrás)', 'wger'],
  ['weighted cossack squats (male)', 'exercise_db'],
  ['upward facing dog', 'exercise_db'],
  ['chest and front of shoulder stretch', 'exercise_db'],
  ['low glute bridge on floor', 'exercise_db'],
  ['close-grip push-up', 'exercise_db'],
  ['chest dip (on dip-pull-up cage)', 'exercise_db'],
  ['handstand', 'exercise_db'],
  ['handstand push-up', 'exercise_db'],
  ['band assisted pull-up', 'exercise_db'],
  ['muscle-up (on vertical bar)', 'exercise_db'],
  ['L-Sit (Foot Supported)', 'wger'],
  ['kettlebell goblet squat', 'exercise_db'],
  ['Landmine press', 'wger'],
  ['band one arm standing low row', 'exercise_db'],
  ['Turkish Get-Up', 'wger'],
  ["Dumbbell farmer's carry", 'wger'],
  ['Bird Dog', 'wger'],
  ['dead bug', 'exercise_db'],
  ['bodyweight incline side plank', 'exercise_db'],
  ['monster walk', 'exercise_db'],
  ['cable standing shoulder external rotation', 'exercise_db'],
  ['balance board', 'exercise_db'],
  ['Walking', 'wger']
]

const missing = []
for (const [name, provider] of checks) {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,name,source_provider')
    .eq('source_provider', provider)
    .ilike('name', name)
    .limit(5)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    missing.push({ name, provider })
  }
}

console.log(JSON.stringify({ total: checks.length, missing }, null, 2))
