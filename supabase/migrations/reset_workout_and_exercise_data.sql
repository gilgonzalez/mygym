BEGIN;

DO $$
DECLARE
  v_exercise_count bigint;
  v_tutorial_count bigint;
  v_tutorial_step_count bigint;
  v_workout_count bigint;
  v_workout_section_count bigint;
  v_section_count bigint;
  v_section_exercise_count bigint;
  v_workout_log_count bigint;
  v_media_count bigint;
  v_media_ids uuid[];
BEGIN
  SELECT COUNT(*) INTO v_exercise_count FROM public.exercises;
  SELECT COUNT(*) INTO v_tutorial_count FROM public.exercise_tutorials;
  SELECT COUNT(*) INTO v_tutorial_step_count FROM public.exercise_tutorial_steps;
  SELECT COUNT(*) INTO v_workout_count FROM public.workouts;
  SELECT COUNT(*) INTO v_workout_section_count FROM public.workout_sections;
  SELECT COUNT(*) INTO v_section_count FROM public.sections;
  SELECT COUNT(*) INTO v_section_exercise_count FROM public.section_exercises;
  SELECT COUNT(*) INTO v_workout_log_count FROM public.workout_logs;

  WITH referenced_media AS (
    SELECT DISTINCT e.thumbnail_media_id AS id
    FROM public.exercises e
    WHERE e.thumbnail_media_id IS NOT NULL

    UNION

    SELECT DISTINCT et.media_id AS id
    FROM public.exercise_tutorials et
    WHERE et.media_id IS NOT NULL
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO v_media_ids
  FROM referenced_media;

  v_media_count := COALESCE(array_length(v_media_ids, 1), 0);

  DELETE FROM public.workout_logs;
  DELETE FROM public.workout_sections;
  DELETE FROM public.section_exercises;
  DELETE FROM public.exercise_tutorial_steps;
  DELETE FROM public.exercise_tutorials;
  DELETE FROM public.sections;
  DELETE FROM public.workouts;
  DELETE FROM public.exercises;

  IF v_media_count > 0 THEN
    DELETE FROM public.media
    WHERE id = ANY(v_media_ids);
  END IF;

  UPDATE public.user_stats
  SET
    level = 1,
    current_xp = 0,
    next_level_xp = 100,
    total_workouts = 0,
    total_minutes = 0,
    streak_current = 0,
    streak_longest = 0,
    last_activity_date = NULL,
    rank_title = 'Rookie',
    attributes = '{"strength": 0, "agility": 0, "endurance": 0, "wisdom": 0}'::jsonb,
    updated_at = timezone('utc'::text, now());

  RAISE NOTICE 'Reset completado. exercises=% tutorials=% tutorial_steps=% workouts=% workout_sections=% sections=% section_exercises=% workout_logs=% media=%',
    v_exercise_count,
    v_tutorial_count,
    v_tutorial_step_count,
    v_workout_count,
    v_workout_section_count,
    v_section_count,
    v_section_exercise_count,
    v_workout_log_count,
    v_media_count;
END $$;

COMMIT;
