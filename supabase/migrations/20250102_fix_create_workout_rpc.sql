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
  INSERT INTO workouts (user_id, title, description, difficulty, tags, cover, audio)
  VALUES (
    p_user_id,
    p_workout_data->>'title',
    p_workout_data->>'description',
    p_workout_data->>'difficulty',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'tags') t(x)),
    p_workout_data->>'cover',
    (SELECT array_agg(x) FROM jsonb_array_elements_text(p_workout_data->'audio') t(x))
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
$function$
;