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

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-4333-8333-333333333333',
  'authenticated',
  'authenticated',
  'coachhybridlab@mygym.app',
  crypt('CoachHybridLab123!', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'coachhybridlab',
    'name', 'Coach Hybrid Lab',
    'avatar_url', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elite%20hybrid%20training%20coach%20portrait%2C%20realistic%20fitness%20app%20profile%20photo%2C%20clean%20studio%20lighting%2C%20confident%20strength%20and%20conditioning%20expert&image_size=square'
  ),
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.users (
  id,
  email,
  username,
  name,
  avatar_url,
  bio,
  "isPremium",
  role
)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'coachhybridlab@mygym.app',
  'coachhybridlab',
  'Coach Hybrid Lab',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elite%20hybrid%20training%20coach%20portrait%2C%20realistic%20fitness%20app%20profile%20photo%2C%20clean%20studio%20lighting%2C%20confident%20strength%20and%20conditioning%20expert&image_size=square',
  'Coach especializado en calistenia aplicada, HIIT, tabata, functional training, CrossFit y trabajo hibrido inspirado en Hyrox. Prioriza tecnica, densidad de trabajo util y progresion realista.',
  true,
  'COACH'::user_role
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  "isPremium" = EXCLUDED."isPremium",
  role = EXCLUDED.role,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.user_stats (
  user_id,
  level,
  current_xp,
  next_level_xp,
  total_workouts,
  total_minutes,
  streak_current,
  streak_longest,
  rank_title,
  attributes
)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  18,
  9200,
  11000,
  164,
  7420,
  41,
  63,
  'Hybrid Performance Coach',
  '{"strength":10,"agility":8,"endurance":10,"wisdom":9}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE
SET
  level = EXCLUDED.level,
  current_xp = EXCLUDED.current_xp,
  next_level_xp = EXCLUDED.next_level_xp,
  total_workouts = EXCLUDED.total_workouts,
  total_minutes = EXCLUDED.total_minutes,
  streak_current = EXCLUDED.streak_current,
  streak_longest = EXCLUDED.streak_longest,
  rank_title = EXCLUDED.rank_title,
  attributes = EXCLUDED.attributes,
  updated_at = timezone('utc'::text, now());

DO $$
DECLARE
  v_owner_id uuid := '33333333-3333-4333-8333-333333333333'::uuid;
  v_titles text[] := ARRAY[
    'Calistenia esencial: base tecnica',
    'Tabata funcional: motor intermedio',
    'CrossFit + Hyrox: engine avanzado'
  ];
  v_section_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT ws.section_id)
  INTO v_section_ids
  FROM public.workouts w
  JOIN public.workout_sections ws ON ws.workout_id = w.id
  WHERE w.user_id = v_owner_id
    AND w.title = ANY(v_titles);

  DELETE FROM public.workouts
  WHERE user_id = v_owner_id
    AND title = ANY(v_titles);

  IF v_section_ids IS NOT NULL THEN
    DELETE FROM public.sections
    WHERE id = ANY(v_section_ids);
  END IF;

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Calistenia esencial: base tecnica',
      'description', concat_ws(
        E'\n',
        'Rutina de nivel inicial pensada para construir control corporal, fuerza relativa basica y tolerancia de volumen sin fatigar en exceso codos ni hombros.',
        'La seleccion combina asistencia inteligente en la traccion, empuje horizontal accesible, trabajo de escorpulas y core simple pero eficaz para que la progresion sea sostenible.',
        'Es una base realista para quien quiere entrar en calistenia con criterio tecnico antes de buscar repeticiones altas o habilidades avanzadas.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Calisthenics', 'Technique', 'Bodyweight', 'Beginner'),
      'visibility', 'public',
      'estimated_time', 2100,
      'exp_earned', 90,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20calisthenics%20training%20session%20in%20a%20clean%20modern%20gym%2C%20bodyweight%20coach%20guiding%20strict%20technique%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'goal', 'calisthenics_foundation',
        'discipline', 'calisthenics',
        'author_track', 'coach_hybrid_lab',
        'focus', jsonb_build_array('pull', 'push', 'core', 'body_control')
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Activacion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('salto de jack (hombre)', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 30, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha de rodillas tocando el hombro (hombre)', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('puente de glúteos bajo en el suelo', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza base',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominada asistida con banda', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('remo invertido con rodillas flexionadas', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('flexiones con agarre cerrado (de rodillas)', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 50),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('fondos en banco (rodillas flexionadas)', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Core y postura',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('bicicleta de aire', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 20, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('abdominales 3/4', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha frontal con giro', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Tabata funcional: motor intermedio',
      'description', concat_ws(
        E'\n',
        'Sesion orientada a mejorar tolerancia al lactato, capacidad de recuperar rapido entre esfuerzos y eficiencia tecnica bajo fatiga moderada.',
        'El bloque principal esta planteado como tabata real en formato lineal por rondas, seguido de un cierre funcional con patron de zancada, empuje vertical y bisagra.',
        'Esta rutina encaja en una fase intermedia donde ya existe base tecnica y se busca elevar el motor sin convertir cada entrenamiento en un caos.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Tabata', 'Functional Training', 'HIIT', 'Conditioning'),
      'visibility', 'public',
      'estimated_time', 2400,
      'exp_earned', 115,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=functional%20tabata%20conditioning%20workout%20with%20battle%20ropes%20medicine%20ball%20and%20jump%20rope%2C%20intense%20modern%20gym%20scene%2C%20editorial%20sports%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'goal', 'conditioning',
        'discipline', 'functional_tabata',
        'author_track', 'coach_hybrid_lab',
        'focus', jsonb_build_array('engine', 'work_capacity', 'cardio_resistance')
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Primer',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 45, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 25, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('puente de glúteos con marcha', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Tabata central',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('golpe de balón medicinal por encima de la cabeza', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10)
          )
        ),
        jsonb_build_object(
          'name', 'Finisher funcional',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('zancada con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('press alterno con mancuerna', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('peso muerto con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 12, 'rest', 20)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'CrossFit + Hyrox: engine avanzado',
      'description', concat_ws(
        E'\n',
        'Sesion avanzada pensada para atletas con buena tecnica de barra y capacidad de sostener potencia cuando la respiracion ya esta comprometida.',
        'Combina un bloque de fuerza-potencia con una simulacion de carrera hibrida por rondas. La inspiracion viene de CrossFit y de las demandas energeticas de Hyrox, adaptada al inventario actual disponible.',
        'El resultado es una rutina exigente pero coherente: empuje, bisagra, squat, locomocion vertical y carga metabolica alta sin perder estructura.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('CrossFit', 'Hyrox', 'HIIT', 'Barbell', 'Hybrid'),
      'visibility', 'public',
      'estimated_time', 3000,
      'exp_earned', 145,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20hybrid%20crossfit%20workout%20with%20barbell%20thrusters%20burpees%20medicine%20ball%20slams%20and%20jump%20rope%2C%20high%20performance%20training%20floor%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'goal', 'hybrid_performance',
        'discipline', 'crossfit_hyrox',
        'author_track', 'coach_hybrid_lab',
        'focus', jsonb_build_array('power', 'engine', 'barbell_capacity', 'fatigue_resistance')
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Preparacion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 60, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('step-up con barra', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('remo renegado alterno con kettlebell', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza y potencia',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('clean y press con barra', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 5, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('thruster con barra', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('peso muerto con barra', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 150)
          )
        ),
        jsonb_build_object(
          'name', 'Hybrid metcon',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee con salto', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 30, 'rest', 15),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 45, 'rest', 15),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('golpe de balón medicinal por encima de la cabeza', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 30, 'rest', 15),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('remo renegado alterno con kettlebell', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 10, 'rest', 15)
          )
        )
      )
    )
  );
END;
$$;
