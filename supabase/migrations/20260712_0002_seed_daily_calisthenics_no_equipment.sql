CREATE OR REPLACE FUNCTION public._seed_find_exercise_id(
  p_name text,
  p_source_provider text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT e.id
  INTO v_id
  FROM public.exercises e
  WHERE lower(e.name) = lower(p_name)
    AND (p_source_provider IS NULL OR e.source_provider = p_source_provider)
  ORDER BY
    CASE
      WHEN p_source_provider IS NOT NULL AND e.source_provider = p_source_provider THEN 0
      ELSE 1
    END,
    e.created_at NULLS LAST
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Exercise not found for seed: % (%)', p_name, COALESCE(p_source_provider, 'any');
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._seed_insert_curated_workout(
  p_user_id uuid,
  p_workout jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_workout_id uuid;
  v_section jsonb;
  v_exercise jsonb;
  v_section_id uuid;
  v_section_order integer := 0;
  v_exercise_order integer;
BEGIN
  INSERT INTO public.workouts (
    user_id,
    title,
    description,
    difficulty,
    tags,
    visibility,
    estimated_time,
    exp_earned,
    stats,
    cover,
    audio
  )
  VALUES (
    p_user_id,
    p_workout->>'title',
    p_workout->>'description',
    p_workout->>'difficulty',
    (
      SELECT COALESCE(array_agg(x), ARRAY[]::text[])
      FROM jsonb_array_elements_text(COALESCE(p_workout->'tags', '[]'::jsonb)) AS t(x)
    ),
    COALESCE(p_workout->>'visibility', 'public'),
    NULLIF(p_workout->>'estimated_time', '')::integer,
    NULLIF(p_workout->>'exp_earned', '')::integer,
    p_workout->'stats',
    NULLIF(p_workout->>'cover', ''),
    (
      SELECT COALESCE(array_agg(x), ARRAY[]::text[])
      FROM jsonb_array_elements_text(COALESCE(p_workout->'audio', '[]'::jsonb)) AS t(x)
    )
  )
  RETURNING id INTO v_workout_id;

  FOR v_section IN
    SELECT *
    FROM jsonb_array_elements(COALESCE(p_workout->'sections', '[]'::jsonb))
  LOOP
    INSERT INTO public.sections (name, type)
    VALUES (
      v_section->>'name',
      COALESCE(v_section->>'orderType', 'linear')
    )
    RETURNING id INTO v_section_id;

    INSERT INTO public.workout_sections (workout_id, section_id, order_index)
    VALUES (v_workout_id, v_section_id, v_section_order);

    v_section_order := v_section_order + 1;
    v_exercise_order := 0;

    FOR v_exercise IN
      SELECT *
      FROM jsonb_array_elements(COALESCE(v_section->'exercises', '[]'::jsonb))
    LOOP
      INSERT INTO public.section_exercises (
        section_id,
        exercise_id,
        order_index,
        type,
        sets,
        reps,
        rest,
        duration,
        weight_kg
      )
      VALUES (
        v_section_id,
        (v_exercise->>'exercise_id')::uuid,
        v_exercise_order,
        COALESCE(v_exercise->>'type', 'reps'),
        NULLIF(v_exercise->>'sets', '')::integer,
        NULLIF(v_exercise->>'reps', '')::integer,
        NULLIF(v_exercise->>'rest', '')::integer,
        NULLIF(v_exercise->>'duration', '')::integer,
        NULLIF(v_exercise->>'weight_kg', '')::numeric
      );

      v_exercise_order := v_exercise_order + 1;
    END LOOP;
  END LOOP;

  RETURN v_workout_id;
END;
$$;

DO $$
DECLARE
  v_owner_id uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  v_title text := 'Calistenia diaria sin material (barra opcional)';
  v_section_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT ws.section_id)
  INTO v_section_ids
  FROM public.workouts w
  JOIN public.workout_sections ws ON ws.workout_id = w.id
  WHERE w.user_id = v_owner_id
    AND w.title = v_title;

  DELETE FROM public.workouts
  WHERE user_id = v_owner_id
    AND title = v_title;

  IF v_section_ids IS NOT NULL THEN
    DELETE FROM public.sections
    WHERE id = ANY(v_section_ids);
  END IF;

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', v_title,
      'description', concat_ws(
        E'\n',
        'Rutina diaria de calistenia pensada para repetirse con alta adherencia, sin material salvo una barra de dominadas. Busca mantener fuerza relativa, control corporal, movilidad util y salud escapular sin convertir cada dia en una sesion destructiva.',
        'La estructura toca empuje, traccion, piernas, core, escápulas y movilidad con volumen moderado para que sea sostenible como practica diaria.',
        'Close-grip push-up: aporta empuje horizontal eficiente, refuerza linea corporal y transfiere a flexiones perfectas, fondos y handstand push-up.',
        'Chin-up: desarrolla traccion vertical con alta transferencia a dominadas, muscle-up y control escapular en barra.',
        'Split squats: construyen fuerza unilateral y estabilidad de cadera y rodilla sin necesitar carga externa; ayudan a progresar hacia pistol squat.',
        'Jump squat: añade potencia ligera y reactividad sin sobrecargar articulaciones cuando el volumen es contenido.',
        'Hollow hold: trabaja anti-extension y posicion global del cuerpo; es una de las mejores bases para handstand, L-Sit y front lever.',
        'Hanging leg raise: mejora compresion activa, control de pelvis y fuerza colgada; transfiere a toes to bar y control en barra.',
        'L-sit on floor: refuerza compresion, soporte activo y fuerza relativa del core con cero material.',
        'Superman: equilibra el trabajo del core anterior con extension posterior y ayuda a mantener buena higiene de hombro y espalda.',
        'Scapular pull-up: desarrolla depresion escapular y calidad de traccion; reduce compensaciones en dominadas y protege el hombro.',
        'High style scapula push-up: fortalece serrato y protraccion escapular; mejora estabilidad de empuje, handstand y salud escapular general.',
        'Ankle circles: mantienen movilidad y control del tobillo, clave para sentadillas unilaterales y recepcion de saltos.',
        'Ankle Roll: complementa el trabajo del tobillo con movilidad suave para uso diario y ayuda a sostener la calidad de movimiento.',
        'Notas de uso: deja 1-2 repeticiones en reserva en la mayoria de series, y baja un set si notas fatiga de codos, hombros o agarre. La idea es practicar a diario, no agotarte.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Calisthenics', 'Daily', 'No Equipment', 'Pull-up Bar'),
      'visibility', 'public',
      'estimated_time', 2400,
      'exp_earned', 95,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=daily%20bodyweight%20calisthenics%20routine%20with%20pull-up%20bar%20in%20a%20minimal%20home%20gym%2C%20realistic%20fitness%20editorial%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'goal', 'daily_calisthenics',
        'program', 'daily_bodyweight',
        'author_track', 'master_calisthenic',
        'equipment', jsonb_build_array('bodyweight', 'pull-up_bar_optional'),
        'frequency', 'daily',
        'focus', jsonb_build_array('push', 'pull', 'legs', 'core', 'scapula', 'mobility')
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Activacion y control',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('ankle circles', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Ankle Roll', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza diaria',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('close-grip push-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chin-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('split squats', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('jump squat', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('hanging leg raise', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('l-sit on floor', 'exercise_db'), 'type', 'time', 'sets', 3, 'duration', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Superman', 'wger'), 'type', 'time', 'sets', 3, 'duration', 25, 'rest', 30)
          )
        )
      )
    )
  );
END;
$$;

DROP FUNCTION public._seed_insert_curated_workout(uuid, jsonb);
DROP FUNCTION public._seed_find_exercise_id(text, text);
