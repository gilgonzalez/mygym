-- `exercises` (el vault) queda solo con lo propio del ejercicio: quien lo
-- creo, nombre, descripcion, thumbnail, dificultad y materiales. Las
-- propiedades de instancia (type/sets/reps/duration/rest) ya viven en
-- `section_exercises` y quedaban duplicadas sin uso real aqui.
--
-- `workouts.audio` (playlist) se elimina por completo: no aporta valor y se
-- retira tambien la UI/feature asociada en el frontend.
ALTER TABLE public.exercises
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS sets,
  DROP COLUMN IF EXISTS reps,
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS rest;

ALTER TABLE public.workouts
  DROP COLUMN IF EXISTS audio;

-- Reemplaza la version de 20260814_0001_safe_uuid_parse_in_resolve_exercise.sql
-- (la ultima CREATE OR REPLACE real de esta funcion) quitando solo la
-- escritura de `type` sobre `exercises`, que ya no existe como columna.
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
  v_incoming_muscle_groups text[];
  v_incoming_equipment text[];
  v_incoming_name text;
  v_normalized_name text;
  v_existing_is_owner boolean;
BEGIN
  v_existing_exercise_id := public.try_parse_uuid(p_exercise_data->>'id');
  v_thumbnail_media_id := public.try_parse_uuid(p_exercise_data->>'thumbnail_media_id');
  v_incoming_name := TRIM(COALESCE(p_exercise_data->>'name', ''));
  v_normalized_name := public.normalize_exercise_name(v_incoming_name);

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
    SELECT id, user_id = p_user_id
    INTO v_resolved_exercise_id, v_existing_is_owner
    FROM public.exercises
    WHERE id = v_existing_exercise_id;

    IF FOUND THEN
      IF v_existing_is_owner THEN
        UPDATE public.exercises
        SET
          name = COALESCE(NULLIF(v_incoming_name, ''), name),
          description = COALESCE(p_exercise_data->>'description', description),
          difficulty = COALESCE(p_exercise_data->>'difficulty', difficulty),
          muscle_group = COALESCE(v_incoming_muscle_groups, muscle_group),
          equipment = COALESCE(v_incoming_equipment, equipment),
          thumbnail_media_id = COALESCE(v_thumbnail_media_id, thumbnail_media_id)
        WHERE id = v_resolved_exercise_id;

        PERFORM public.sync_exercise_tutorial(v_resolved_exercise_id, p_user_id, p_exercise_data->'tutorial');
      END IF;

      RETURN v_resolved_exercise_id;
    END IF;
  END IF;

  IF v_normalized_name <> '' THEN
    SELECT e.id, e.user_id = p_user_id
    INTO v_resolved_exercise_id, v_existing_is_owner
    FROM public.exercises e
    WHERE public.normalize_exercise_name(e.name) = v_normalized_name
      AND (e.is_public = true OR e.user_id = p_user_id)
    ORDER BY
      CASE WHEN e.user_id = p_user_id THEN 0 ELSE 1 END,
      CASE WHEN e.is_public = true THEN 0 ELSE 1 END,
      e.created_at ASC
    LIMIT 1;

    IF FOUND THEN
      IF v_existing_is_owner THEN
        UPDATE public.exercises
        SET
          description = COALESCE(p_exercise_data->>'description', description),
          difficulty = COALESCE(p_exercise_data->>'difficulty', difficulty),
          muscle_group = CASE
                            WHEN COALESCE(array_length(v_incoming_muscle_groups, 1), 0) > 0
                            THEN v_incoming_muscle_groups ELSE muscle_group END,
          equipment = CASE
                         WHEN COALESCE(array_length(v_incoming_equipment, 1), 0) > 0
                         THEN v_incoming_equipment ELSE equipment END,
          thumbnail_media_id = COALESCE(v_thumbnail_media_id, thumbnail_media_id)
        WHERE id = v_resolved_exercise_id;

        PERFORM public.sync_exercise_tutorial(v_resolved_exercise_id, p_user_id, p_exercise_data->'tutorial');
      END IF;

      RETURN v_resolved_exercise_id;
    END IF;
  END IF;

  INSERT INTO public.exercises (
    name,
    user_id,
    thumbnail_media_id,
    description,
    difficulty,
    muscle_group,
    equipment,
    is_public
  )
  VALUES (
    v_incoming_name,
    p_user_id,
    v_thumbnail_media_id,
    p_exercise_data->>'description',
    p_exercise_data->>'difficulty',
    v_incoming_muscle_groups,
    v_incoming_equipment,
    false
  )
  RETURNING id INTO v_resolved_exercise_id;

  PERFORM public.sync_exercise_tutorial(v_resolved_exercise_id, p_user_id, p_exercise_data->'tutorial');

  RETURN v_resolved_exercise_id;
END;
$function$;

-- Reemplaza la version de 20260702_0002_workout_functions.sql quitando solo
-- la columna `audio` de `workouts` (el resto de la funcion no cambia).
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
  INSERT INTO public.workouts (user_id, title, description, difficulty, tags, cover, visibility, estimated_time, exp_earned, stats)
  VALUES (
    p_user_id,
    p_workout_data->>'title',
    p_workout_data->>'description',
    p_workout_data->>'difficulty',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(p_workout_data->'tags', '[]'::jsonb)) t(x)),
    p_workout_data->>'cover',
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
