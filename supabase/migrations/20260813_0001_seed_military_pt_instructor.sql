-- Military PT instructor + intermediate platoon session.
-- Session maps H2F / ATP 7-22.02 blocks onto existing workout structures:
--   Preparation Drill     → timed blocks (single)
--   30:60 intervals       → time exercise, 6 sets, 30s work / 60s rest
--   Conditioning Circuit  → linear circuit, 3 rounds, 50s work / 10s transition
--   Aerobic run           → single timed effort
--   Recovery Drill        → timed cooldown blocks

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
  'sgtreyes@mygym.app',
  crypt('SgtReyes123!', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'sgtreyes',
    'name', 'Sargento Reyes'
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
  bio,
  "isPremium",
  role
)
VALUES (
  '33333333-3333-4333-8333-333333333333',
  'sgtreyes@mygym.app',
  'sgtreyes',
  'Sargento Reyes',
  'Instructor de preparación física militar. Entrena pelotones con doctrina H2F: precisión, progresión e integración. La técnica manda sobre la velocidad; la carga se adapta al soldado, no al revés.',
  true,
  'COACH'::user_role
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  name = EXCLUDED.name,
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
  14,
  6200,
  7500,
  52,
  2860,
  21,
  36,
  'Instructor H2F',
  '{"strength":8,"agility":8,"endurance":10,"wisdom":9}'::jsonb
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
  v_title text := 'Preparación física militar — pelotón intermedio';
  v_section_ids uuid[];
  v_exercise_names text[] := ARRAY[
    'Desplazamiento y activación',
    'Movilidad dinámica',
    'Activación dinámica',
    'Military Movement Drill',
    'Intervalos 30:60',
    'Sentadilla',
    'Flexiones',
    'Zancada inversa',
    'Mountain climber',
    'Plancha',
    'Bear crawl',
    'Carrera continua',
    'Caminar y respiración',
    'Movilidad suave',
    'Estiramientos'
  ];
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

  DELETE FROM public.exercises
  WHERE user_id = v_owner_id
    AND name = ANY(v_exercise_names);

  PERFORM public.create_complete_workout(
    v_owner_id,
    jsonb_build_object(
      'title', v_title,
      'description', concat_ws(
        E'\n',
        'Sesión colectiva de pelotón (55 min, intermedio). Desarrolla resistencia aeróbica y anaeróbica, resistencia muscular, fuerza relativa, coordinación y capacidad de trabajo.',
        'Estructura militar: preparación dinámica, actividad principal, acondicionamiento y recuperación. No se busca el agotamiento absoluto. En doctrina H2F priman precisión, progresión e integración; cada soldado trabaja a su nivel.',
        'Material: cronómetro, espacio exterior de 30–50 m y agua. Colchonetas opcionales. Sin pesas. Formar en filas con espacio entre soldados.',
        'Antes de empezar: revisar estado general, lesiones, meteorología, superficie, hidratación y procedimiento de emergencia. Durante la sesión, corregir técnica antes que velocidad. Quien no pueda mantener la técnica reduce intensidad.',
        'Plantilla de preparación física general, no una prescripción individual ni “la rutina oficial” de un ejército. Los ejércitos programan según unidad, misión y fase de entrenamiento.',
        'Desplazamiento y activación: trote suave, cambios de dirección, desplazamiento lateral y marcha con elevación de rodillas. Sin buscar velocidad; solo elevar el pulso.',
        'Movilidad dinámica: rotaciones de brazos, círculos de hombros, rotaciones de tronco, balanceos controlados de piernas y sentadillas sin carga. Prioriza amplitud y control.',
        'Activación dinámica: walking lunges, high knees, butt kicks, desplazamiento lateral y trote progresivo. Sube la intensidad de forma gradual.',
        'Military Movement Drill: desplazamientos de 10–20 m en este orden: trote, lateral, carrera con aceleración progresiva, frenada controlada y regreso caminando o trotando. Prepara carrera, aceleración, desaceleración y cambio de dirección.',
        'Intervalos 30:60: 30 s de carrera al 80–85 % del máximo individual y 60 s de recuperación activa (caminar rápido o trote muy suave). No es un sprint máximo. Mantén técnica. El pelotón trabaja a ritmo homogéneo, no en competición.',
        'Sentadilla: pies al ancho de hombros, rodillas en la línea de los pies, espalda estable. Profundidad que puedas mantener con buena técnica.',
        'Flexiones: no busques el máximo número. Si la técnica se deteriora, baja el ritmo o usa una variante más sencilla.',
        'Zancada inversa: zancadas hacia atrás alternando piernas. Movimiento controlado, rodilla delantera estable.',
        'Mountain climber: tronco estable y velocidad que permita conservar la técnica. No rebotes.',
        'Plancha: abdomen contraído, glúteos activos, cabeza y columna alineadas. Si falla la postura, baja a rodillas.',
        'Bear crawl: desplazamiento controlado a cuatro apoyos. Si no hay espacio, sustituye por marching plank.',
        'Carrera continua: ritmo moderado, RPE 6/10, formación abierta. Los más rápidos no convierten esto en una carrera. Quien lo necesite combina trote y marcha rápida.',
        'Caminar y respiración: camina lento y recupera el control de la respiración.',
        'Movilidad suave: cadera, tobillo, hombro y columna torácica. Sin forzar el rango.',
        'Estiramientos: cuádriceps, isquiotibiales, gemelos y flexores de cadera. Suaves, sin rebotes. Cierra con respiración controlada.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array(
        'Militar',
        'Entrenamiento Funcional',
        'Entrenamiento en Circuito',
        'Entrenamiento por Intervalos',
        'HIIT',
        'Carrera',
        'Sprints',
        'Cuerpo Completo',
        'Resistencia',
        'Peso Corporal',
        'Exterior',
        'Sin Material',
        'Intermedio',
        'Calentamiento',
        'Vuelta a la Calma'
      ),
      'visibility', 'public',
      'estimated_time', 3300,
      'exp_earned', 825,
      'stats', jsonb_build_object(
        'strength', 193,
        'cardio', 447,
        'flexibility', 89,
        'agility', 83,
        'mind', 14
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Preparation Drill',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Desplazamiento y activación',
              'type', 'time',
              'sets', 1,
              'duration', 120,
              'rest', 0,
              'difficulty', 'beginner',
              'description', 'Trote suave, cambios de dirección, desplazamiento lateral y marcha con elevación de rodillas. Sin buscar velocidad; solo elevar el pulso.',
              'muscle_groups', jsonb_build_array('full body', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Movilidad dinámica',
              'type', 'time',
              'sets', 1,
              'duration', 120,
              'rest', 0,
              'difficulty', 'beginner',
              'description', 'Rotaciones de brazos, círculos de hombros, rotaciones de tronco, balanceos controlados de piernas y sentadillas sin carga. Prioriza amplitud y control, no velocidad.',
              'muscle_groups', jsonb_build_array('full body', 'shoulders', 'hips'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Activación dinámica',
              'type', 'time',
              'sets', 1,
              'duration', 180,
              'rest', 0,
              'difficulty', 'intermediate',
              'description', 'Walking lunges, high knees, butt kicks, desplazamiento lateral y trote progresivo. Sube la intensidad de forma gradual.',
              'muscle_groups', jsonb_build_array('full body', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Military Movement Drill',
              'type', 'time',
              'sets', 1,
              'duration', 180,
              'rest', 0,
              'difficulty', 'intermediate',
              'description', 'Desplazamientos de 10–20 m: trote, lateral, carrera con aceleración progresiva, frenada controlada y regreso caminando o trotando. Repite la secuencia hasta el final del bloque.',
              'muscle_groups', jsonb_build_array('full body', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Resistencia anaeróbica 30:60',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Intervalos 30:60',
              'type', 'time',
              'sets', 6,
              'duration', 30,
              'rest', 60,
              'difficulty', 'intermediate',
              'description', '30 s de carrera al 80–85 % del máximo individual y 60 s de recuperación activa (caminar rápido o trote muy suave). No es un sprint máximo. Mantén técnica. Cada soldado trabaja a su propio ritmo.',
              'muscle_groups', jsonb_build_array('cardio', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Conditioning Circuit',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Sentadilla',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'Pies al ancho de hombros, rodillas en la línea de los pies, espalda estable. Profundidad que puedas mantener con buena técnica. Vuelta 1: control. Vuelta 2: ritmo moderado. Vuelta 3: mantén el ritmo sin sacrificar técnica.',
              'muscle_groups', jsonb_build_array('quads', 'glutes', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Flexiones',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'No busques el máximo número. Si la técnica se deteriora, baja el ritmo o usa una variante más sencilla (rodillas o inclinada).',
              'muscle_groups', jsonb_build_array('chest', 'triceps', 'shoulders', 'core'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Zancada inversa',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'Zancadas hacia atrás alternando piernas. Movimiento controlado, rodilla delantera estable y tronco erguido.',
              'muscle_groups', jsonb_build_array('quads', 'glutes', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Mountain climber',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'Tronco estable y velocidad que permita conservar la técnica. Caderas bajas, sin rebotar ni hundir la lumbar.',
              'muscle_groups', jsonb_build_array('core', 'shoulders', 'cardio'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Plancha',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'Abdomen contraído, glúteos activos, cabeza y columna alineadas. Si falla la postura, baja a rodillas.',
              'muscle_groups', jsonb_build_array('core', 'shoulders'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Bear crawl',
              'type', 'time',
              'sets', 3,
              'duration', 50,
              'rest', 10,
              'difficulty', 'intermediate',
              'description', 'Desplazamiento controlado a cuatro apoyos, rodillas cerca del suelo y tronco estable. Si no hay espacio, sustituye por marching plank.',
              'muscle_groups', jsonb_build_array('full body', 'core', 'shoulders'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Capacidad aeróbica',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Carrera continua',
              'type', 'time',
              'sets', 1,
              'duration', 420,
              'rest', 0,
              'difficulty', 'intermediate',
              'description', 'Ritmo moderado, RPE 6/10, formación abierta. Los más rápidos no convierten esto en una carrera. Quien lo necesite combina trote y marcha rápida.',
              'muscle_groups', jsonb_build_array('cardio', 'legs'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Recovery Drill',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Caminar y respiración',
              'type', 'time',
              'sets', 1,
              'duration', 60,
              'rest', 0,
              'difficulty', 'beginner',
              'description', 'Camina lento y recupera el control de la respiración. Baja el pulso de forma progresiva.',
              'muscle_groups', jsonb_build_array('cardio'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Movilidad suave',
              'type', 'time',
              'sets', 1,
              'duration', 120,
              'rest', 0,
              'difficulty', 'beginner',
              'description', 'Movilidad suave de cadera, tobillo, hombro y columna torácica. Sin forzar el rango.',
              'muscle_groups', jsonb_build_array('hips', 'shoulders', 'mobility'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Estiramientos',
              'type', 'time',
              'sets', 1,
              'duration', 120,
              'rest', 0,
              'difficulty', 'beginner',
              'description', 'Estiramientos suaves, sin rebotes: cuádriceps, isquiotibiales, gemelos y flexores de cadera. Cierra con respiración controlada.',
              'muscle_groups', jsonb_build_array('legs', 'hips', 'mobility'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        )
      )
    )
  );
END;
$$;
