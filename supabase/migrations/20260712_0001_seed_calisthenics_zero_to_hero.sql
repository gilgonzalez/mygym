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
  '22222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'mastercalisthenic@mygym.app',
  crypt('MasterCalisthenic123!', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'mastercalisthenic',
    'name', 'Master Calisthenic',
    'avatar_url', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elite%20calisthenics%20coach%20portrait%2C%20realistic%20fitness%20app%20profile%20photo%2C%20clean%20studio%20lighting%2C%20confident%20athletic%20trainer&image_size=square'
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
  '22222222-2222-4222-8222-222222222222',
  'mastercalisthenic@mygym.app',
  'mastercalisthenic',
  'Master Calisthenic',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elite%20calisthenics%20coach%20portrait%2C%20realistic%20fitness%20app%20profile%20photo%2C%20clean%20studio%20lighting%2C%20confident%20athletic%20trainer&image_size=square',
  'Coach especializado en progresiones largas de calistenia, control corporal, salud articular y dominio tecnico desde nivel basico hasta habilidades elite.',
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
  '22222222-2222-4222-8222-222222222222',
  12,
  4800,
  6000,
  38,
  2140,
  18,
  31,
  'Calisthenics Coach',
  '{"strength":8,"agility":9,"endurance":7,"wisdom":10}'::jsonb
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
  v_owner_id uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  v_titles text[] := ARRAY[
    'From Zero To Hero I - Fundamentos',
    'From Zero To Hero II - Fuerza estructural',
    'From Zero To Hero III - Fuerza avanzada',
    'From Zero To Hero IV - Habilidades avanzadas',
    'From Zero To Hero V - Elite calistenica'
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
      'title', 'From Zero To Hero I - Fundamentos',
      'description', concat_ws(
        E'\n',
        'Fase 1: construir base real. Prioriza tecnica, control escapular, core, movilidad y tolerancia tendinosa antes de buscar gestos espectaculares.',
        'Criterios de avance: 3x12 close-grip push-up perfectas; 3x10 bench pull-ups limpias; 3x8 band assisted pull-up con pausa abajo; 3x30 s hollow hold; 3x20 s L-Sit (Foot Supported) sin perder compresion.',
        'Close-grip push-up: crea el patron de empuje horizontal, mejora tension corporal y prepara flexiones perfectas, fondos y handstand push-up.',
        'Bench pull-ups: ensena traccion horizontal con escápula estable, refuerza dorsales y facilita dominadas futuras y control para front lever.',
        'Split squats: desarrolla fuerza unilateral, estabilidad de cadera y rodilla; prepara shrimp squat, pistol squat y saltos unilaterales seguros.',
        'Band assisted pull-up: introduce la traccion vertical con fatiga asumible y transferencia directa a dominadas estrictas y muscle-up.',
        'Hollow hold: crea anti-extension y linea corporal; transfiere a handstand, front lever, planche y L-Sit.',
        'Superman: compensa el trabajo anterior con extension posterior; mejora arch hold, salud lumbar y control global del cuerpo.',
        'Band horizontal pallof press: entrena anti-rotacion y control del tronco; protege la linea media en dominadas, fondos y handstand.',
        'L-Sit (Foot Supported): inicia compresion activa y fuerza de hombro en soporte; abre camino hacia L-Sit, V-Sit y dragon flag.',
        'Scapular pull-up: desarrolla depresion escapular; tiene transferencia alta a dominadas, muscle-up y front lever y reduce riesgo en hombro.',
        'High style scapula push-up: fortalece protraccion y serrato; es base para empujes estables, handstand y progresiones de planche.',
        'Banded Ankle Mobility: mejora dorsiflexion y permite sentadillas unilaterales mas limpias y pistols mas estables.',
        'Rotación torácica en media rodilla: mejora extension y rotacion toracica, clave para overhead estable y lineas limpias en handstand.',
        'Cable standing shoulder external rotation: fortalece manguito rotador y protege hombro y codo frente a volumen de empuje y soporte.',
        'Band reverse wrist curl: prepara extensores de antebrazo y ayuda a prevenir codo de tenista y molestias de muñeca.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Calisthenics', 'From Zero To Hero', 'Phase 1', 'Foundations'),
      'visibility', 'public',
      'estimated_time', 3360,
      'exp_earned', 110,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20calisthenics%20athlete%20training%20push-ups%20and%20scapular%20control%20in%20a%20minimal%20gym%2C%20realistic%20fitness%20editorial%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'program', 'from_zero_to_hero',
        'phase', 1,
        'phase_name', 'fundamentos',
        'target_skills', jsonb_build_array('push-up', 'assisted pull-up', 'hollow body', 'scapular control', 'split squat'),
        'advance_when', jsonb_build_array(
          '3x12 close-grip push-up perfectas',
          '3x10 bench pull-ups controladas',
          '3x8 band assisted pull-up sin perder depresion escapular',
          '3x30 s hollow hold',
          '3x20 s L-Sit (Foot Supported)'
        )
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('close-grip push-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('bench pull-ups', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('split squats', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band assisted pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 6, 'rest', 90)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 3, 'duration', 20, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Superman', 'wger'), 'type', 'time', 'sets', 3, 'duration', 20, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band horizontal pallof press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('L-Sit (Foot Supported)', 'wger'), 'type', 'time', 'sets', 3, 'duration', 15, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Escapulas y soporte',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Movilidad',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Banded Ankle Mobility', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Rotación torácica en media rodilla', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Prehab',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band reverse wrist curl', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'From Zero To Hero II - Fuerza estructural',
      'description', concat_ws(
        E'\n',
        'Fase 2: convertir la base en fuerza estructural. El objetivo es solidificar dominadas, fondos, L-Sit basico y handstand asistido con tecnica limpia y fatiga controlada.',
        'Criterios de avance: 3x12 decline push-up; 4x5 chin-up estricta; 4x8 chest dip; 4x20 s handstand estable; 3x10 assisted hanging knee raise; 3x30 s hollow hold.',
        'Decline push-up: desplaza carga hacia hombro y serrato; prepara handstand push-up y pseudo planche push-up.',
        'Chin-up: consolida la traccion vertical estricta; es requisito para dominadas explosivas, archer pull-up y muscle-up.',
        'Chest dip: desarrolla empuje vertical y control en soporte; abre el camino hacia fondos profundos y transicion de muscle-up.',
        'Handstand: mejora linea corporal, estabilidad escapular y equilibrio invertido; facilita handstand libre y handstand walking.',
        'Hollow hold: mantiene la base de anti-extension necesaria para handstand, front lever y L-Sit.',
        'Assisted hanging knee raise: introduce compresion colgada con control; transfiere a hanging leg raise y toes to bar.',
        'L-Sit (Foot Supported): aumenta compresion activa y fuerza de soporte; conecta con L-Sit libre, V-Sit y dragon flag.',
        'Superman: refuerza cadena posterior y control de extension; equilibra el volumen de hollow y soporte invertido.',
        'Scapular pull-up: sigue construyendo depresion y control escapular para dominadas mas eficientes y front lever futuro.',
        'High style scapula push-up: mejora protraccion y estabilidad del hombro; clave para handstand y futuras progresiones de planche.',
        'Weighted cossack squats (male): aporta movilidad activa de cadera y tobillo y mejora control lateral util para pistols y aterrizajes.',
        'Chest and front of shoulder stretch: mantiene extension de hombro y apertura toracica para fondos, soporte y handstand.',
        'Cable standing shoulder external rotation: protege manguito rotador frente al aumento de volumen en empuje y soporte.',
        'Band wrist curl: fortalece flexores y ayuda a prevenir codo de golfista en dominadas y soporte.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Calisthenics', 'From Zero To Hero', 'Phase 2', 'Structural Strength'),
      'visibility', 'public',
      'estimated_time', 3540,
      'exp_earned', 120,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=calisthenics%20athlete%20doing%20strict%20chin-up%20and%20dip%20strength%20work%20in%20a%20modern%20gym%2C%20realistic%20editorial%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'program', 'from_zero_to_hero',
        'phase', 2,
        'phase_name', 'fuerza_estructural',
        'target_skills', jsonb_build_array('chin-up', 'dip', 'L-Sit base', 'handstand assisted'),
        'advance_when', jsonb_build_array(
          '3x12 decline push-up',
          '4x5 chin-up estricta',
          '4x8 chest dip limpia',
          '4x20 s handstand estable',
          '3x10 assisted hanging knee raise'
        )
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('decline push-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chin-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 105),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest dip', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 60)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('assisted hanging knee raise', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('L-Sit (Foot Supported)', 'wger'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Superman', 'wger'), 'type', 'time', 'sets', 3, 'duration', 20, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Escapulas y soporte',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Movilidad',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('weighted cossack squats (male)', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest and front of shoulder stretch', 'exercise_db'), 'type', 'time', 'sets', 2, 'duration', 30, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Prehab',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band wrist curl', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'From Zero To Hero III - Fuerza avanzada',
      'description', concat_ws(
        E'\n',
        'Fase 3: empezar a convertir fuerza basica en fuerza especifica de skill. Aqui aparecen pseudo planche, tuck front lever y mayor compresion sin saltarse prerequisitos.',
        'Criterios de avance: 4x6 Flexión pseudo planche; 4x8 chest dip en jaula; 4x6 chin-ups (narrow parallel grip); 4x12 s Front lever agrupado; 4x30 s handstand; 4x8 hanging leg raise.',
        'Flexión pseudo planche: aumenta inclinacion anterior y demanda sobre hombro y serrato; tiene transferencia directa a planche lean y tuck planche.',
        'Chest dip (on dip-pull-up cage): mejora rango y estabilidad en soporte; facilita fondos profundos y la fase de empuje del muscle-up.',
        'Chin-ups (narrow parallel grip): refuerza dorsales, flexores de codo y control escapular; acerca a dominadas lastradas y transicion de muscle-up.',
        'Handstand: se mantiene para consolidar linea y equilibrio; prepara handstand libre y handstand push-up mas adelante.',
        'Front lever agrupado: introduce la palanca con un nivel seguro; desarrolla depresion escapular y rigidez corporal para front lever real.',
        'Hanging leg raise: incrementa compresion colgada y control de pelvis; transfiere a toes to bar y V-Sit.',
        'L-Sit: ya se trabaja sin soporte, elevando la exigencia de compresion y soporte escapular; paso clave hacia V-Sit.',
        'V-sit on floor: refuerza compresion activa y flexores de cadera; mejora L-Sit avanzado y control de dragon flag.',
        'Superman: mantiene equilibrio entre core anterior y posterior y mejora arch hold para transiciones y control en barra.',
        'Scapular pull-up: sigue siendo el puente entre dominada eficiente, front lever y salud del hombro.',
        'High style scapula push-up: mantiene serrato fuerte y control de protraccion necesario para planche y handstand estable.',
        'Banded Ankle Mobility: evita perder movilidad al subir la exigencia de fuerza unilateral y apoyo.',
        'Weighted cossack squats (male): combina movilidad activa con fuerza lateral y estabilidad util para shrimp squat y pistol squat.',
        'Cable standing shoulder external rotation: protege manguito rotador cuando crece el volumen de empuje especifico.',
        'Band reverse wrist curl: da resiliencia a muñeca y extensores, vital cuando se introducen leans y apoyos mas agresivos.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Calisthenics', 'From Zero To Hero', 'Phase 3', 'Advanced Strength'),
      'visibility', 'public',
      'estimated_time', 3780,
      'exp_earned', 135,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=intermediate%20calisthenics%20athlete%20practicing%20pseudo%20planche%20push-up%20and%20tuck%20front%20lever%20in%20a%20clean%20gym%2C%20realistic%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'program', 'from_zero_to_hero',
        'phase', 3,
        'phase_name', 'fuerza_avanzada',
        'target_skills', jsonb_build_array('pseudo planche push-up', 'tuck front lever', 'strict support strength', 'free handstand base'),
        'advance_when', jsonb_build_array(
          '4x6 Flexion pseudo planche',
          '4x8 chest dip en jaula',
          '4x6 chin-ups narrow parallel grip',
          '4x12 s Front lever agrupado',
          '4x8 hanging leg raise'
        )
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Flexión pseudo planche', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest dip (on dip-pull-up cage)', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chin-ups (narrow parallel grip)', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 105),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 30, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Front lever agrupado', 'wger'), 'type', 'time', 'sets', 4, 'duration', 12, 'rest', 75)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('hanging leg raise', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('L-Sit', 'wger'), 'type', 'time', 'sets', 4, 'duration', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('v-sit on floor', 'exercise_db'), 'type', 'time', 'sets', 3, 'duration', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Superman', 'wger'), 'type', 'time', 'sets', 3, 'duration', 25, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Escapulas y soporte',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Movilidad',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Banded Ankle Mobility', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('weighted cossack squats (male)', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Prehab',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band reverse wrist curl', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'From Zero To Hero IV - Habilidades avanzadas',
      'description', concat_ws(
        E'\n',
        'Fase 4: traducir la fuerza acumulada en habilidades avanzadas limpias. Solo debe usarse cuando los prerrequisitos de la fase 3 esten consolidados sin dolor ni compensaciones.',
        'Criterios de avance: 5x3 muscle-up limpio; 4x4 archer pull up por lado; 4x8 s front lever; 4x40 s handstand estable; 4x5 single leg squat (pistol) male por pierna; 4x6 toes to bar.',
        'Muscle-up (on vertical bar): integra tiron explosivo, transicion y empuje; es una de las mejores pruebas de coordinacion y fuerza relativa en barra.',
        'Archer pull up: aumenta fuerza unilateral y control en traccion; aproxima a typewriter pull-up y one arm progressions.',
        'Front lever: exige rigidez global, depresion escapular y traccion horizontal isometrica; es la habilidad objetivo de esta fase.',
        'Handstand: se sostiene para pulir equilibrio libre y respiracion bajo carga invertida; facilita handstand walking.',
        'Single leg squat (pistol) male: convierte la base unilateral en fuerza real y control de rango completo; transfiere a pistols, saltos y recepciones unilaterales.',
        'Toes to bar (pies a la barra): eleva la compresion colgada y la velocidad de flexion de cadera; conecta con V-Sit y dragon flag.',
        'Dragon flag: desarrolla anti-extension maxima y control corporal; facilita front lever y compresion avanzada.',
        'L-sit on floor: mantiene el soporte y la compresion mientras el foco principal se mueve a barra y skills avanzadas.',
        'Superman: conserva balance posterior y evita que el trabajo de hollow domine en exceso.',
        'Scapular pull-up: sigue refinando depresion escapular y posicion de hombro para front lever y muscle-up.',
        'High style scapula push-up: sostiene protraccion y control serrato; ayuda a que el handstand no colapse y prepara planche futura.',
        'Rotación torácica en media rodilla: mantiene movilidad toracica para overhead limpio y transiciones mas seguras.',
        'Chest and front of shoulder stretch: preserva extension de hombro tras muscle-up, dips y handstand.',
        'Cable standing shoulder external rotation: protege hombro frente a la mayor demanda tecnica de esta fase.',
        'Band wrist curl: aumenta tolerancia de flexores y ayuda a soportar mas volumen de barra y apoyo.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Calisthenics', 'From Zero To Hero', 'Phase 4', 'Advanced Skills'),
      'visibility', 'public',
      'estimated_time', 3960,
      'exp_earned', 150,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20calisthenics%20athlete%20performing%20muscle-up%20and%20front%20lever%20on%20bar%20in%20a%20bright%20minimal%20gym%2C%20realistic%20sports%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'program', 'from_zero_to_hero',
        'phase', 4,
        'phase_name', 'habilidades_avanzadas',
        'target_skills', jsonb_build_array('muscle-up', 'front lever', 'free handstand', 'pistol squat'),
        'advance_when', jsonb_build_array(
          '5x3 muscle-up limpio',
          '4x4 archer pull up por lado',
          '4x8 s front lever',
          '4x40 s handstand estable',
          '4x5 pistol squat por pierna'
        )
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('muscle-up (on vertical bar)', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 3, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('archer pull up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 4, 'rest', 105),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('front lever', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 8, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 40, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('single leg squat (pistol) male', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 75)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Toes to bar (pies a la barra)', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Dragon flag', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 4, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('l-sit on floor', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Superman', 'wger'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Escapulas y soporte',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Movilidad',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Rotación torácica en media rodilla', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest and front of shoulder stretch', 'exercise_db'), 'type', 'time', 'sets', 2, 'duration', 30, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Prehab',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band wrist curl', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'From Zero To Hero V - Elite calistenica',
      'description', concat_ws(
        E'\n',
        'Fase 5: refinamiento elite. Solo entra quien ya domina las puertas de la fase 4. Aqui se trabaja una exposicion especifica a planche, front lever avanzado, handstand push-up y muscle-up estricto sin sacrificar salud articular.',
        'Criterios de dominio: 5x12 s lean planche; 5x10 s Tuck planche; 5x6 s straddle planche; 5x5 handstand push-up; 5x3 muscle-up limpio; 5x10 s front lever; sin dolor de muñeca, codo u hombro.',
        'Lean planche: enseña a proyectar hombros delante de manos con control escapular; es el puente hacia tuck planche y straddle planche.',
        'Tuck planche: primera planche real con carga significativa; desarrolla protraccion, fuerza de hombro y control de pelvis con alta transferencia a advanced tuck y straddle.',
        'Straddle planche: reduce palanca sin perder especificidad; acerca a planche completa con mejor relacion estimulo-fatiga que intentar full demasiado pronto.',
        'Handstand push-up: convierte el equilibrio invertido en fuerza vertical pura; culmina la via de handstand y fortalece empuje relativo.',
        'Muscle-up (on vertical bar): se mantiene como gesto de coordinacion y potencia especifica; en esta fase debe verse limpio y estricto.',
        'Front lever: consolida la capacidad de palanca completa; requiere dorsales, hombros y core trabajando como una sola unidad.',
        'Dragon flag: sigue elevando anti-extension y tension global, con transferencia directa a front lever y control corporal total.',
        'Toes to bar (pies a la barra): mantiene compresion explosiva y ritmo colgado para no perder capacidad dinamica.',
        'V-sit on floor: empuja la compresion por encima del L-Sit y mejora el control activo de flexores de cadera y abdomen.',
        'Hollow hold: sigue siendo la referencia de linea corporal para cualquier skill avanzada.',
        'Scapular pull-up: mantiene depresion escapular y calidad de posicion incluso en fases donde el ego suele empujar demasiado.',
        'High style scapula push-up: garantiza serrato y protraccion activos para que planche y handstand no castiguen hombro.',
        'Weighted cossack squats (male): conserva movilidad util y fuerza lateral en piernas para que el programa siga equilibrado.',
        'Banded Ankle Mobility: mantiene el rango de tobillo y evita rigidez acumulada por volumen isometrico y trabajo unilateral.',
        'Cable standing shoulder external rotation: protege manguito rotador en la fase de mayor estres articular.',
        'Band reverse wrist curl: aporta tolerancia a extensores de antebrazo, fundamental para planche y handstand push-up.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Calisthenics', 'From Zero To Hero', 'Phase 5', 'Elite'),
      'visibility', 'public',
      'estimated_time', 4200,
      'exp_earned', 170,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=elite%20calisthenics%20athlete%20performing%20straddle%20planche%20and%20handstand%20push-up%20in%20a%20minimal%20gym%2C%20realistic%20high%20end%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object(
        'program', 'from_zero_to_hero',
        'phase', 5,
        'phase_name', 'elite',
        'target_skills', jsonb_build_array('planche', 'front lever advanced', 'handstand push-up', 'strict muscle-up'),
        'advance_when', jsonb_build_array(
          '5x12 s lean planche',
          '5x10 s Tuck planche',
          '5x6 s straddle planche',
          '5x5 handstand push-up',
          '5x3 muscle-up limpio',
          '5x10 s front lever'
        )
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('lean planche', 'exercise_db'), 'type', 'time', 'sets', 5, 'duration', 12, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Tuck planche', 'wger'), 'type', 'time', 'sets', 5, 'duration', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('straddle planche', 'exercise_db'), 'type', 'time', 'sets', 5, 'duration', 6, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand push-up', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 5, 'rest', 105),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('muscle-up (on vertical bar)', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 3, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('front lever', 'exercise_db'), 'type', 'time', 'sets', 5, 'duration', 10, 'rest', 90)
          )
        ),
        jsonb_build_object(
          'name', 'Core y compresion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Dragon flag', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Toes to bar (pies a la barra)', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('v-sit on floor', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 4, 'duration', 30, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Escapulas y soporte',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('scapular pull-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('high style scapula push-up', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Movilidad',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('weighted cossack squats (male)', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Banded Ankle Mobility', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Prehab',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band reverse wrist curl', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 20, 'rest', 30)
          )
        )
      )
    )
  );
END;
$$;

DROP FUNCTION public._seed_insert_curated_workout(uuid, jsonb);
DROP FUNCTION public._seed_find_exercise_id(text, text);
