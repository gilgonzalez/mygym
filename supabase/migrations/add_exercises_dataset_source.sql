BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercises_source_provider_check'
      AND conrelid = 'public.exercises'::regclass
  ) THEN
    ALTER TABLE public.exercises
    DROP CONSTRAINT exercises_source_provider_check;
  END IF;

  ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_source_provider_check
  CHECK (
    source_provider IS NULL
    OR source_provider IN ('wger', 'exercise_db', 'exercises_dataset')
  );
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_source_provider_source_id_unique
ON public.exercises(source_provider, source_id)
WHERE source_provider IS NOT NULL
  AND source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_source_provider
ON public.exercises(source_provider);

COMMIT;
