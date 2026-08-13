-- EMOM exercises set both duration (the time window) and reps (target reps within that
-- window) simultaneously, with rest always 0 — the "rest" is whatever time is left over
-- after the reps are done. Only section_exercises (per-workout exercise instances) need
-- this; the reusable exercise vault (public.exercises) is unaffected.
ALTER TABLE public.section_exercises
DROP CONSTRAINT IF EXISTS section_exercises_type_check;

ALTER TABLE public.section_exercises
ADD CONSTRAINT section_exercises_type_check
CHECK (type IS NULL OR type IN ('reps', 'time', 'emom'));
