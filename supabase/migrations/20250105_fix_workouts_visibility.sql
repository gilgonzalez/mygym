-- 1. Update RLS Policies for Workouts to use 'visibility' column
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Public workouts are visible" ON public.workouts;
DROP POLICY IF EXISTS "Public workouts are viewable by everyone" ON public.workouts;
DROP POLICY IF EXISTS "Users can view their own private workouts" ON public.workouts;

CREATE POLICY "Workouts are viewable by everyone if public or owner"
ON public.workouts FOR SELECT
USING (
  visibility = 'public' 
  OR auth.uid() = user_id
);

-- 2. Update create_complete_workout to handle visibility
CREATE OR REPLACE FUNCTION public.create_complete_workout(p_user_id uuid, p_workout_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_workout_id uuid;
  v_section jsonb;
  v_exercise jsonb;
  v_section_id uuid;
  v_exercise_id uuid;
  v_media_id uuid;
  v_section_order int := 0;
  v_exercise_order int;
BEGIN
  -- 1. Create Workout
  INSERT INTO workouts (user_id, title, description, difficulty, tags, cover, audio, visibility)
  VALUES (
    p_user_id,
    p_workout_data->>'title',
    p_workout_data->>'description',
    p_workout_data->>'difficulty',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'tags') t(x)),
    p_workout_data->>'cover',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'audio') t(x)),
    COALESCE(p_workout_data->>'visibility', 'public') -- Default to public if not provided
  )
  RETURNING id INTO v_workout_id;

  -- 2. Loop Sections
  FOR v_section IN SELECT * FROM jsonb_array_elements(p_workout_data->'sections')
  LOOP
    INSERT INTO sections (name, type)
    VALUES (v_section->>'name', v_section->>'orderType')
    RETURNING id INTO v_section_id;

    INSERT INTO workout_sections (workout_id, section_id, order_index)
    VALUES (v_workout_id, v_section_id, v_section_order);
    v_section_order := v_section_order + 1;

    -- 3. Loop Exercises
    v_exercise_order := 0;
    FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_section->'exercises')
    LOOP
      -- Handle Media (Reuse or Create)
      v_media_id := (v_exercise->>'media_id')::uuid;
      
      IF v_media_id IS NULL AND (v_exercise->>'media_url') IS NOT NULL THEN
        INSERT INTO media (user_id, url, type, mime_type, filename, bucket_path)
        VALUES (
          p_user_id,
          v_exercise->>'media_url',
          CASE WHEN (v_exercise->>'media_url') LIKE '%youtube%' THEN 'video' ELSE 'image' END,
          'application/octet-stream',
          v_exercise->>'filename',
          v_exercise->>'bucket_path'
        )
        RETURNING id INTO v_media_id;
      END IF;

      -- Create Exercise
      INSERT INTO exercises (name, created_by, media_id, type)
      VALUES (
        v_exercise->>'name',
        p_user_id,
        v_media_id,
        v_exercise->>'type'
      )
      RETURNING id INTO v_exercise_id;

      -- Link to Section
      INSERT INTO section_exercises (
        section_id, exercise_id, order_index, 
        sets, reps, rest, weight_kg, duration
      )
      VALUES (
        v_section_id, v_exercise_id, v_exercise_order,
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
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

-- 3. Update update_complete_workout to handle visibility
CREATE OR REPLACE FUNCTION public.update_complete_workout(p_workout_id uuid, p_user_id uuid, p_workout_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_section jsonb;
  v_exercise jsonb;
  v_section_id uuid;
  v_exercise_id uuid;
  v_link_id uuid;
  v_media_id uuid;
  v_section_order int := 0;
  v_exercise_order int;
  v_incoming_section_ids uuid[];
  v_incoming_link_ids uuid[];
BEGIN
  -- 1. Verify Ownership & Update Workout
  UPDATE workouts
  SET
    title = p_workout_data->>'title',
    description = p_workout_data->>'description',
    difficulty = p_workout_data->>'difficulty',
    tags = (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'tags') t(x)),
    cover = p_workout_data->>'cover',
    audio = (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'audio') t(x)),
    updated_at = NOW(),
    estimated_time = (p_workout_data->>'estimated_time')::int,
    exp_earned = (p_workout_data->>'exp_earned')::int,
    stats = (p_workout_data->'stats'),
    visibility = COALESCE(p_workout_data->>'visibility', visibility) -- Update if provided, else keep existing
  WHERE id = p_workout_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout not found or unauthorized';
  END IF;

  -- 2. Handle Sections Removal
  -- Collect incoming section IDs that are valid UUIDs
  SELECT array_agg((x->>'id')::uuid)
  INTO v_incoming_section_ids
  FROM jsonb_array_elements(p_workout_data->'sections') x
  WHERE (x->>'id') IS NOT NULL AND length(x->>'id') > 30;

  -- Delete workout_sections not in incoming list
  DELETE FROM workout_sections
  WHERE workout_id = p_workout_id
  AND (section_id != ALL(v_incoming_section_ids) OR v_incoming_section_ids IS NULL);

  -- 3. Loop Sections (Upsert)
  FOR v_section IN SELECT * FROM jsonb_array_elements(p_workout_data->'sections')
  LOOP
    -- Upsert Section Definition
    IF (v_section->>'id') IS NOT NULL AND length(v_section->>'id') > 30 THEN
      v_section_id := (v_section->>'id')::uuid;
      UPDATE sections SET name = v_section->>'name', type = v_section->>'orderType' WHERE id = v_section_id;
    ELSE
      INSERT INTO sections (name, type) VALUES (v_section->>'name', v_section->>'orderType') RETURNING id INTO v_section_id;
    END IF;

    -- Upsert Workout-Section Link
    SELECT id INTO v_link_id FROM workout_sections WHERE workout_id = p_workout_id AND section_id = v_section_id LIMIT 1;
    
    IF v_link_id IS NOT NULL THEN
        UPDATE workout_sections SET order_index = v_section_order WHERE id = v_link_id;
    ELSE
        INSERT INTO workout_sections (workout_id, section_id, order_index)
        VALUES (p_workout_id, v_section_id, v_section_order);
    END IF;
    
    v_section_order := v_section_order + 1;

    -- 4. Handle Exercises Removal (Smart Sync within Section)
    v_incoming_link_ids := NULL;
    
    SELECT array_agg((x->>'link_id')::uuid)
    INTO v_incoming_link_ids
    FROM jsonb_array_elements(v_section->'exercises') x
    WHERE (x->>'link_id') IS NOT NULL AND length(x->>'link_id') > 30;

    DELETE FROM section_exercises
    WHERE section_id = v_section_id
    AND (id != ALL(v_incoming_link_ids) OR v_incoming_link_ids IS NULL);

    -- 5. Loop Exercises
    v_exercise_order := 0;
    FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_section->'exercises')
    LOOP
       -- Handle Media (Same as Create)
      v_media_id := (v_exercise->>'media_id')::uuid;
      IF v_media_id IS NULL AND (v_exercise->>'media_url') IS NOT NULL THEN
         INSERT INTO media (user_id, url, type, mime_type, filename, bucket_path)
         VALUES (p_user_id, v_exercise->>'media_url', 
                CASE WHEN (v_exercise->>'media_url') LIKE '%youtube%' THEN 'video' ELSE 'image' END,
                'application/octet-stream', v_exercise->>'filename', v_exercise->>'bucket_path')
         RETURNING id INTO v_media_id;
      END IF;

      -- Upsert Exercise Definition
      IF (v_exercise->>'id') IS NOT NULL AND length(v_exercise->>'id') > 30 THEN
         v_exercise_id := (v_exercise->>'id')::uuid;
         UPDATE exercises SET 
            name = v_exercise->>'name',
            description = v_exercise->>'description',
            muscle_group = (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(v_exercise->'muscle_groups', '[]'::jsonb)) t(x)),
            equipment = (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(v_exercise->'equipment', '[]'::jsonb)) t(x)),
            difficulty = v_exercise->>'difficulty',
            media_id = v_media_id
         WHERE id = v_exercise_id;
      ELSE
         INSERT INTO exercises (name, created_by, media_id, type, description, muscle_group, equipment, difficulty)
         VALUES (
            v_exercise->>'name', 
            p_user_id, 
            v_media_id, 
            v_exercise->>'type', 
            v_exercise->>'description', 
            (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(v_exercise->'muscle_groups', '[]'::jsonb)) t(x)),
            (SELECT array_agg(x) FROM jsonb_array_elements_text(COALESCE(v_exercise->'equipment', '[]'::jsonb)) t(x)),
            v_exercise->>'difficulty'
         )
         RETURNING id INTO v_exercise_id;
      END IF;

      -- Upsert Section-Exercise Link
      IF (v_exercise->>'link_id') IS NOT NULL AND length(v_exercise->>'link_id') > 30 THEN
         UPDATE section_exercises SET
            exercise_id = v_exercise_id, 
            order_index = v_exercise_order,
            sets = (v_exercise->>'sets')::int,
            reps = (v_exercise->>'reps')::int,
            rest = (v_exercise->>'rest')::int,
            weight_kg = (v_exercise->>'weight_kg')::numeric,
            duration = (v_exercise->>'duration')::int
         WHERE id = (v_exercise->>'link_id')::uuid;
      ELSE
         INSERT INTO section_exercises (section_id, exercise_id, order_index, sets, reps, rest, weight_kg, duration)
         VALUES (v_section_id, v_exercise_id, v_exercise_order, (v_exercise->>'sets')::int, (v_exercise->>'reps')::int, (v_exercise->>'rest')::int, (v_exercise->>'weight_kg')::numeric, (v_exercise->>'duration')::int);
      END IF;

      v_exercise_order := v_exercise_order + 1;
    END LOOP;

  END LOOP;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;