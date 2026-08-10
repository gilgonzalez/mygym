-- ============================================================
-- FIX: Evitar duplicacion de exercises al crear/actualizar workouts
-- ============================================================
-- Causa raiz: la funcion resolve_workout_exercise_id requeria que TODOS
-- los campos (name, description, difficulty, muscle_group, equipment, tutorial)
-- coincidieran EXACTAMENTE para reutilizar un exercise existente.
-- Esto provocaba que:
--  1. La IA generase description con "coaching cues" personalizadas -> INSERT duplicado
--  2. El usuario modificase cualquier detalle en el editor -> INSERT duplicado
--  3. Al no venir id, no se buscaba por nombre -> INSERT duplicado
--
-- Nueva estrategia:
--  A. Si viene id Y EXISTE en BD: reutilizar SIEMPRE. No se modifican exercises
--     publicos o de otros usuarios. Si el exercise es del usuario actual y
--     tiene datos nuevos, se actualizan SOLO los campos descriptivos (no el id).
--  B. Si no viene id o no existe: BUSCAR POR NOMBRE NORMALIZADO en la tabla
--     exercises (ejercicios publicos + del propio usuario).
--  C. Solo si no se encuentra por ID ni por NOMBRE -> INSERT nuevo.
-- ============================================================

CREATE OR REPLACE FUNCTION public._unaccent_letters(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT TRANSLATE(
    COALESCE(p_text, ''),
    'áàâäãåÁÀÂÄÃÅéèêëÉÈÊËíìîïÍÌÎÏóòôöõøÓÒÔÖÕØúùûüÚÙÛÜñÑçÇ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIooooooOOOOOOuuuuUUUUnNcC'
  );
$function$;

CREATE OR REPLACE FUNCTION public.normalize_exercise_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT REGEXP_REPLACE(
           LOWER(TRIM(public._unaccent_letters(p_name))),
           '\s+', ' ', 'g'
         );
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
  v_existing_exercise_id := NULLIF(p_exercise_data->>'id', '')::uuid;
  v_thumbnail_media_id := NULLIF(p_exercise_data->>'thumbnail_media_id', '')::uuid;
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

  -- ------------------------------------------------------------------
  -- PASO 1: Resolver / crear media para thumbnail (no afecta al exercise)
  -- ------------------------------------------------------------------
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

  -- ------------------------------------------------------------------
  -- PASO 2A: Si viene id, buscarlo y REUTILIZARLO (nunca duplicar por ID)
  -- ------------------------------------------------------------------
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

  -- ------------------------------------------------------------------
  -- PASO 2B: Buscar por NOMBRE normalizado (publicos o propios)
  -- ------------------------------------------------------------------
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

  -- ------------------------------------------------------------------
  -- PASO 3: No se encontro por ID ni por nombre -> CREAR nuevo exercise
  -- ------------------------------------------------------------------
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
