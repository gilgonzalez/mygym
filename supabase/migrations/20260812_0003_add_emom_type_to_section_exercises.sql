ALTER TABLE public.section_exercises
  DROP CONSTRAINT IF EXISTS section_exercises_type_check;

ALTER TABLE public.section_exercises
  ADD CONSTRAINT section_exercises_type_check 
  CHECK (type IS NULL OR type IN ('reps', 'time', 'emom'));
