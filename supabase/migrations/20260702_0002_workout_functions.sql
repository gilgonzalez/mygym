CREATE OR REPLACE FUNCTION public.sync_exercise_tutorial(
  p_exercise_id uuid,
  p_user_id uuid,
  p_tutorial_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_tutorial_id uuid;
  v_step jsonb;
  v_step_order int := 0;
  v_tutorial_media_id uuid;
BEGIN
  DELETE FROM public.exercise_tutorials
  WHERE exercise_id = p_exercise_id;

  IF p_tutorial_data IS NULL THEN
    RETURN;
  END IF;

  v_tutorial_media_id := NULLIF(p_tutorial_data->>'media_id', '')::uuid;

  IF v_tutorial_media_id IS NULL AND NULLIF(p_tutorial_data->>'media_url', '') IS NOT NULL THEN
    INSERT INTO public.media (user_id, url, type, mime_type, filename, bucket_path)
    VALUES (
      p_user_id,
      p_tutorial_data->>'media_url',
      CASE
        WHEN COALESCE(p_tutorial_data->>'media_type', '') = 'audio' THEN 'audio'
        WHEN COALESCE(p_tutorial_data->>'media_type', '') = 'video' THEN 'video'
        ELSE 'image'
      END,
      'application/octet-stream',
      p_tutorial_data->>'filename',
      p_tutorial_data->>'bucket_path'
    )
    RETURNING id INTO v_tutorial_media_id;
  END IF;

  IF v_tutorial_media_id IS NULL THEN
    RAISE EXCEPTION 'Tutorial media is required';
  END IF;

  IF jsonb_typeof(p_tutorial_data->'steps') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_tutorial_data->'steps') = 0 THEN
    RAISE EXCEPTION 'Tutorial requires at least one step';
  END IF;

  INSERT INTO public.exercise_tutorials (exercise_id, media_id)
  VALUES (p_exercise_id, v_tutorial_media_id)
  RETURNING id INTO v_tutorial_id;

  FOR v_step IN SELECT * FROM jsonb_array_elements(p_tutorial_data->'steps')
  LOOP
    IF COALESCE(trim(v_step->>'title'), '') = '' OR COALESCE(trim(v_step->>'description'), '') = '' THEN
      RAISE EXCEPTION 'Tutorial steps require title and description';
    END IF;

    INSERT INTO public.exercise_tutorial_steps (tutorial_id, order_index, title, description)
    VALUES (
      v_tutorial_id,
      v_step_order,
      v_step->>'title',
      v_step->>'description'
    );

    v_step_order := v_step_order + 1;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.exercise_tutorial_matches(
  p_exercise_id uuid,
  p_tutorial_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_existing_media_id text;
  v_existing_media_url text;
  v_incoming_media_id text;
  v_incoming_media_url text;
  v_existing_steps jsonb;
  v_incoming_steps jsonb;
BEGIN
  IF p_tutorial_data IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.exercise_tutorials
      WHERE exercise_id = p_exercise_id
    );
  END IF;

  SELECT
    et.media_id::text,
    m.url,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'title', ets.title,
          'description', ets.description
        )
        ORDER BY ets.order_index
      ) FILTER (WHERE ets.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_existing_media_id, v_existing_media_url, v_existing_steps
  FROM public.exercise_tutorials et
  LEFT JOIN public.media m ON m.id = et.media_id
  LEFT JOIN public.exercise_tutorial_steps ets ON ets.tutorial_id = et.id
  WHERE et.exercise_id = p_exercise_id
  GROUP BY et.id, et.media_id, m.url;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_incoming_media_id := NULLIF(p_tutorial_data->>'media_id', '');
  v_incoming_media_url := NULLIF(p_tutorial_data->>'media_url', '');

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'title', COALESCE(step->>'title', ''),
        'description', COALESCE(step->>'description', '')
      )
      ORDER BY ordinality
    ),
    '[]'::jsonb
  )
  INTO v_incoming_steps
  FROM jsonb_array_elements(COALESCE(p_tutorial_data->'steps', '[]'::jsonb)) WITH ORDINALITY AS arr(step, ordinality);

  IF COALESCE(v_existing_steps, '[]'::jsonb) <> COALESCE(v_incoming_steps, '[]'::jsonb) THEN
    RETURN false;
  END IF;

  IF v_incoming_media_id IS NOT NULL AND v_incoming_media_id = v_existing_media_id THEN
    RETURN true;
  END IF;

  IF v_incoming_media_url IS NOT NULL AND v_incoming_media_url = v_existing_media_url THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_workout_exercise_id(
  p_user_id uuid,
  p_exercise_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_existing_exercise_id uuid;
  v_resolved_exercise_id uuid;
  v_thumbnail_media_id uuid;
  v_existing_exercise public.exercises%ROWTYPE;
  v_incoming_muscle_groups text[];
  v_incoming_equipment text[];
BEGIN
  v_existing_exercise_id := NULLIF(p_exercise_data->>'id', '')::uuid;
  v_thumbnail_media_id := NULLIF(p_exercise_data->>'thumbnail_media_id', '')::uuid;

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(COALESCE(p_exercise_data->'muscle_groups', '[]'::jsonb))
  )
  INTO v_incoming_muscle_groups;

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(COALESCE(p_exercise_data->'equipment', '[]'::jsonb))
  )
  INTO v_incoming_equipment;

  IF v_thumbnail_media_id IS NULL AND NULLIF(p_exercise_data->>'thumbnail_url', '') IS NOT NULL THEN
    INSERT INTO public.media (user_id, url, type, mime_type, filename, bucket_path)
    VALUES (
      p_user_id,
      p_exercise_data->>'thumbnail_url',
      'image',
      'application/octet-stream',
      p_exercise_data->>'filename',
      p_exercise_data->>'bucket_path'
    )
    RETURNING id INTO v_thumbnail_media_id;
  END IF;

  IF v_existing_exercise_id IS NOT NULL THEN
    SELECT *
    INTO v_existing_exercise
    FROM public.exercises
    WHERE id = v_existing_exercise_id;

    IF FOUND THEN
      IF COALESCE(v_existing_exercise.name, '') = COALESCE(p_exercise_data->>'name', '')
        AND COALESCE(v_existing_exercise.description, '') = COALESCE(p_exercise_data->>'description', '')
        AND COALESCE(v_existing_exercise.difficulty, '') = COALESCE(p_exercise_data->>'difficulty', '')
        AND COALESCE(v_existing_exercise.thumbnail_media_id, '00000000-0000-0000-0000-000000000000'::uuid)
          = COALESCE(v_thumbnail_media_id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND COALESCE(v_existing_exercise.muscle_group, ARRAY[]::text[]) = COALESCE(v_incoming_muscle_groups, ARRAY[]::text[])
        AND COALESCE(v_existing_exercise.equipment, ARRAY[]::text[]) = COALESCE(v_incoming_equipment, ARRAY[]::text[])
        AND public.exercise_tutorial_matches(v_existing_exercise_id, p_exercise_data->'tutorial')
      THEN
        RETURN v_existing_exercise_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.exercises (name, user_id, thumbnail_media_id, type, description, difficulty, muscle_group, equipment)
  VALUES (
    p_exercise_data->>'name',
    p_user_id,
    v_thumbnail_media_id,
    COALESCE(p_exercise_data->>'type', 'reps'),
    p_exercise_data->>'description',
    p_exercise_data->>'difficulty',
    v_incoming_muscle_groups,
    v_incoming_equipment
  )
  RETURNING id INTO v_resolved_exercise_id;

  PERFORM public.sync_exercise_tutorial(v_resolved_exercise_id, p_user_id, p_exercise_data->'tutorial');

  RETURN v_resolved_exercise_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_complete_workout(
  p_user_id uuid,
  p_workout_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_workout_id uuid;
  v_section jsonb;
  v_exercise jsonb;
  v_section_id uuid;
  v_exercise_id uuid;
  v_section_order int := 0;
  v_exercise_order int;
BEGIN
  INSERT INTO public.workouts (user_id, title, description, difficulty, tags, cover, audio, visibility, estimated_time, exp_earned, stats)
  VALUES (
    p_user_id,
    p_workout_data->>'title',
    p_workout_data->>'description',
    p_workout_data->>'difficulty',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(p_workout_data->'tags', '[]'::jsonb)) t(x)),
    p_workout_data->>'cover',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(p_workout_data->'audio', '[]'::jsonb)) t(x)),
    COALESCE(p_workout_data->>'visibility', 'public'),
    (p_workout_data->>'estimated_time')::int,
    (p_workout_data->>'exp_earned')::int,
    p_workout_data->'stats'
  )
  RETURNING id INTO v_workout_id;

  FOR v_section IN SELECT * FROM jsonb_array_elements(COALESCE(p_workout_data->'sections', '[]'::jsonb))
  LOOP
    INSERT INTO public.sections (name, type)
    VALUES (v_section->>'name', v_section->>'orderType')
    RETURNING id INTO v_section_id;

    INSERT INTO public.workout_sections (workout_id, section_id, order_index)
    VALUES (v_workout_id, v_section_id, v_section_order);

    v_section_order := v_section_order + 1;
    v_exercise_order := 0;

    FOR v_exercise IN SELECT * FROM jsonb_array_elements(COALESCE(v_section->'exercises', '[]'::jsonb))
    LOOP
      v_exercise_id := public.resolve_workout_exercise_id(p_user_id, v_exercise);

      INSERT INTO public.section_exercises (
        section_id,
        exercise_id,
        order_index,
        type,
        sets,
        reps,
        rest,
        weight_kg,
        duration
      )
      VALUES (
        v_section_id,
        v_exercise_id,
        v_exercise_order,
        COALESCE(v_exercise->>'type', 'reps'),
        (v_exercise->>'sets')::int,
        (v_exercise->>'reps')::int,
        (v_exercise->>'rest')::int,
        (v_exercise->>'weight_kg')::numeric,
        (v_exercise->>'duration')::int
      );

      v_exercise_order := v_exercise_order + 1;
    END LOOP;
  END LOOP;

  RETURN v_workout_id;
END;
$func$;

CREATE OR REPLACE FUNCTION public.update_complete_workout(
  p_workout_id uuid,
  p_user_id uuid,
  p_workout_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_section jsonb;
  v_exercise jsonb;
  v_section_id uuid;
  v_exercise_id uuid;
  v_link_id uuid;
  v_section_order int := 0;
  v_exercise_order int;
  v_incoming_section_ids uuid[];
  v_incoming_link_ids uuid[];
BEGIN
  UPDATE public.workouts
  SET
    title = p_workout_data->>'title',
    description = p_workout_data->>'description',
    difficulty = p_workout_data->>'difficulty',
    tags = (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(p_workout_data->'tags', '[]'::jsonb)) t(x)),
    cover = p_workout_data->>'cover',
    audio = (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(p_workout_data->'audio', '[]'::jsonb)) t(x)),
    updated_at = timezone('utc'::text, now()),
    estimated_time = (p_workout_data->>'estimated_time')::int,
    exp_earned = (p_workout_data->>'exp_earned')::int,
    stats = p_workout_data->'stats',
    visibility = COALESCE(p_workout_data->>'visibility', visibility)
  WHERE id = p_workout_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found or unauthorized';
  END IF;

  SELECT array_agg((x->>'id')::uuid)
  INTO v_incoming_section_ids
  FROM jsonb_array_elements(COALESCE(p_workout_data->'sections', '[]'::jsonb)) x
  WHERE NULLIF(x->>'id', '') IS NOT NULL
    AND length(x->>'id') > 30;

  DELETE FROM public.workout_sections
  WHERE workout_id = p_workout_id
    AND (section_id != ALL(v_incoming_section_ids) OR v_incoming_section_ids IS NULL);

  FOR v_section IN SELECT * FROM jsonb_array_elements(COALESCE(p_workout_data->'sections', '[]'::jsonb))
  LOOP
    IF NULLIF(v_section->>'id', '') IS NOT NULL AND length(v_section->>'id') > 30 THEN
      v_section_id := (v_section->>'id')::uuid;

      UPDATE public.sections
      SET
        name = v_section->>'name',
        type = v_section->>'orderType'
      WHERE id = v_section_id;
    ELSE
      INSERT INTO public.sections (name, type)
      VALUES (v_section->>'name', v_section->>'orderType')
      RETURNING id INTO v_section_id;
    END IF;

    SELECT id
    INTO v_link_id
    FROM public.workout_sections
    WHERE workout_id = p_workout_id
      AND section_id = v_section_id
    LIMIT 1;

    IF v_link_id IS NOT NULL THEN
      UPDATE public.workout_sections
      SET order_index = v_section_order
      WHERE id = v_link_id;
    ELSE
      INSERT INTO public.workout_sections (workout_id, section_id, order_index)
      VALUES (p_workout_id, v_section_id, v_section_order);
    END IF;

    v_section_order := v_section_order + 1;
    v_incoming_link_ids := NULL;

    SELECT array_agg((x->>'link_id')::uuid)
    INTO v_incoming_link_ids
    FROM jsonb_array_elements(COALESCE(v_section->'exercises', '[]'::jsonb)) x
    WHERE NULLIF(x->>'link_id', '') IS NOT NULL
      AND length(x->>'link_id') > 30;

    DELETE FROM public.section_exercises
    WHERE section_id = v_section_id
      AND (id != ALL(v_incoming_link_ids) OR v_incoming_link_ids IS NULL);

    v_exercise_order := 0;

    FOR v_exercise IN SELECT * FROM jsonb_array_elements(COALESCE(v_section->'exercises', '[]'::jsonb))
    LOOP
      v_exercise_id := public.resolve_workout_exercise_id(p_user_id, v_exercise);

      IF NULLIF(v_exercise->>'link_id', '') IS NOT NULL AND length(v_exercise->>'link_id') > 30 THEN
        UPDATE public.section_exercises
        SET
          exercise_id = v_exercise_id,
          order_index = v_exercise_order,
          type = COALESCE(v_exercise->>'type', 'reps'),
          sets = (v_exercise->>'sets')::int,
          reps = (v_exercise->>'reps')::int,
          rest = (v_exercise->>'rest')::int,
          weight_kg = (v_exercise->>'weight_kg')::numeric,
          duration = (v_exercise->>'duration')::int
        WHERE id = (v_exercise->>'link_id')::uuid;
      ELSE
        INSERT INTO public.section_exercises (
          section_id,
          exercise_id,
          order_index,
          type,
          sets,
          reps,
          rest,
          weight_kg,
          duration
        )
        VALUES (
          v_section_id,
          v_exercise_id,
          v_exercise_order,
          COALESCE(v_exercise->>'type', 'reps'),
          (v_exercise->>'sets')::int,
          (v_exercise->>'reps')::int,
          (v_exercise->>'rest')::int,
          (v_exercise->>'weight_kg')::numeric,
          (v_exercise->>'duration')::int
        );
      END IF;

      v_exercise_order := v_exercise_order + 1;
    END LOOP;
  END LOOP;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_workout_session(
  p_user_id uuid,
  p_workout_id uuid,
  p_duration_minutes integer,
  p_xp_earned integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stats public.user_stats%ROWTYPE;
  v_new_streak integer;
  v_last_activity date;
  v_today date := current_date;
  v_level_up boolean := false;
  v_workout_tags text[];
  v_new_attributes jsonb;
  v_strength_gain integer := 0;
  v_agility_gain integer := 0;
  v_endurance_gain integer := 0;
  v_wisdom_gain integer := 0;
  v_log_id uuid;
BEGIN
  SELECT tags INTO v_workout_tags
  FROM public.workouts
  WHERE id = p_workout_id;

  IF v_workout_tags IS NOT NULL THEN
    IF 'Strength' = ANY(v_workout_tags) OR 'Barbell' = ANY(v_workout_tags) OR 'Dumbbell' = ANY(v_workout_tags) THEN
      v_strength_gain := 2;
    END IF;
    IF 'Cardio' = ANY(v_workout_tags) OR 'HIIT' = ANY(v_workout_tags) OR 'Run' = ANY(v_workout_tags) THEN
      v_endurance_gain := 2;
    END IF;
    IF 'Yoga' = ANY(v_workout_tags) OR 'Mobility' = ANY(v_workout_tags) THEN
      v_agility_gain := 2;
      v_wisdom_gain := 1;
    END IF;
  END IF;

  IF v_strength_gain = 0 AND v_agility_gain = 0 AND v_endurance_gain = 0 AND v_wisdom_gain = 0 THEN
    v_endurance_gain := 1;
    v_strength_gain := 1;
  END IF;

  INSERT INTO public.workout_logs (user_id, workout_id, completed_at, duration_seconds, xp_earned)
  VALUES (p_user_id, p_workout_id, timezone('utc'::text, now()), p_duration_minutes * 60, p_xp_earned)
  RETURNING id INTO v_log_id;

  SELECT * INTO v_current_stats
  FROM public.user_stats
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_current_stats;
  END IF;

  IF v_current_stats.attributes IS NULL THEN
    v_current_stats.attributes := '{"strength": 0, "agility": 0, "endurance": 0, "wisdom": 0}'::jsonb;
  END IF;

  IF v_current_stats.last_activity_date IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_last_activity := v_current_stats.last_activity_date::date;

    IF v_last_activity = v_today THEN
      v_new_streak := v_current_stats.streak_current;
    ELSIF v_last_activity = v_today - 1 THEN
      v_new_streak := v_current_stats.streak_current + 1;
    ELSE
      v_new_streak := 1;
    END IF;
  END IF;

  v_current_stats.current_xp := COALESCE(v_current_stats.current_xp, 0) + p_xp_earned;
  v_current_stats.total_workouts := COALESCE(v_current_stats.total_workouts, 0) + 1;
  v_current_stats.total_minutes := COALESCE(v_current_stats.total_minutes, 0) + p_duration_minutes;
  v_current_stats.streak_current := v_new_streak;
  v_current_stats.last_activity_date := timezone('utc'::text, now());

  IF v_new_streak > COALESCE(v_current_stats.streak_longest, 0) THEN
    v_current_stats.streak_longest := v_new_streak;
  END IF;

  v_new_attributes := jsonb_build_object(
    'strength', COALESCE((v_current_stats.attributes->>'strength')::int, 0) + v_strength_gain,
    'agility', COALESCE((v_current_stats.attributes->>'agility')::int, 0) + v_agility_gain,
    'endurance', COALESCE((v_current_stats.attributes->>'endurance')::int, 0) + v_endurance_gain,
    'wisdom', COALESCE((v_current_stats.attributes->>'wisdom')::int, 0) + v_wisdom_gain
  );

  WHILE v_current_stats.current_xp >= COALESCE(v_current_stats.next_level_xp, 100) LOOP
    v_current_stats.current_xp := v_current_stats.current_xp - COALESCE(v_current_stats.next_level_xp, 100);
    v_current_stats.level := COALESCE(v_current_stats.level, 1) + 1;
    v_current_stats.next_level_xp := floor(COALESCE(v_current_stats.next_level_xp, 100) * 1.2);
    v_level_up := true;
  END LOOP;

  UPDATE public.user_stats
  SET
    level = v_current_stats.level,
    current_xp = v_current_stats.current_xp,
    next_level_xp = v_current_stats.next_level_xp,
    streak_current = v_current_stats.streak_current,
    streak_longest = v_current_stats.streak_longest,
    last_activity_date = v_current_stats.last_activity_date,
    total_workouts = v_current_stats.total_workouts,
    total_minutes = v_current_stats.total_minutes,
    attributes = v_new_attributes,
    updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'log_id', v_log_id,
    'level', v_current_stats.level,
    'xp_earned', p_xp_earned,
    'level_up', v_level_up,
    'new_streak', v_new_streak,
    'attributes_gained', jsonb_build_object(
      'strength', v_strength_gain,
      'agility', v_agility_gain,
      'endurance', v_endurance_gain,
      'wisdom', v_wisdom_gain
    )
  );
END;
$$;
