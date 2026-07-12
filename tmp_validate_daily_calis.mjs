import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const sql = fs.readFileSync('supabase/migrations/20260712_0002_seed_daily_calisthenics_no_equipment.sql', 'utf8')
const regex = /_seed_find_exercise_id\('([^']*(?:''[^']*)*)',\s*'([^']+)'\)/g
const checks = []
let match
while ((match = regex.exec(sql)) !== null) {
  checks.push({ name: match[1].replace(/''/g, "'"), provider: match[2] })
}
const uniqueChecks = Array.from(new Map(checks.map(item => [`${item.provider}::${item.name}`, item])).values())
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const missing = []
for (const item of uniqueChecks) {
  const { data, error } = await supabase.from('exercises').select('id,name,source_provider,equipment').eq('source_provider', item.provider).ilike('name', item.name).limit(3)
  if (error) { console.error(error); process.exit(1) }
  if (!data || data.length === 0) missing.push(item)
}
console.log(JSON.stringify({ total: uniqueChecks.length, missing }, null, 2))
