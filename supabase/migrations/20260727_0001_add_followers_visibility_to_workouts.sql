ALTER TABLE public.workouts
DROP CONSTRAINT IF EXISTS workouts_visibility_check;

ALTER TABLE public.workouts
ADD CONSTRAINT workouts_visibility_check
CHECK (visibility IS NULL OR visibility IN ('draft', 'public', 'private', 'followers'));
