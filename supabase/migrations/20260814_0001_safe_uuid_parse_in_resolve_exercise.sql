-- AI-generated workouts send placeholder ids like "new-calentamiento-hombros".
-- resolve_workout_exercise_id was casting p_exercise_data->>'id' to uuid
-- without checking the format, which aborted the whole create/update transaction.

CREATE OR REPLACE FUNCTION public.try_parse_uuid(p_value text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF p_value IS NULL OR btrim(p_value) = '' THEN
    RETURN NULL;
  END IF;

  IF p_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;

  RETURN p_value::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
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
          type = COALESCE(p_exercise_data->>'type', type),
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
          type = COALESCE(p_exercise_data->>'type', type),
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
    type,
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
    COALESCE(p_exercise_data->>'type', 'reps'),
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
