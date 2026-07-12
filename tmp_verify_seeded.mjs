import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://kbjdrsfrfgtyyntfxfns.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiamRyc2ZyZmd0eXludGZ4Zm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNzMzMiwiZXhwIjoyMDgxNzEzMzMyfQ.xs9hoE3Of2vZluw8zypQNIZSO5RbAq1TsmWOG67Vfmo'
)
const titles = [
  'Hipertrofia basada en evidencia',
  'Fuerza maxima: patrones basicos',
  'Perdida de grasa sin perder musculo',
  'Recomposicion corporal equilibrada',
  'Resistencia total',
  'Movilidad y flexibilidad funcional',
  'Calistenia progresiva',
  'Entrenamiento funcional completo',
  'Prevencion de lesiones y control motor',
  'Salud general a largo plazo'
]
const { data, error } = await supabase
  .from('workouts')
  .select('title, description')
  .in('title', titles)
  .order('title')
if (error) { console.error(error); process.exit(1) }
console.log(JSON.stringify({ seeded: data.length, titles: data.map(x => x.title) }, null, 2))
