-- Functional S&C coach + 60 min lower-body session.
-- Session maps athletic priorities onto existing workout structures:
--   Calentamiento   → single, timed + low-volume activation
--   Pliometría      → single, low-rep quality jumps (fresh legs first)
--   Fuerza          → single, 3×8–10 at RPE 7–8
--   Funcional       → single, unilateral + posterior chain
--   Potencia        → single, hip extension + sled
--   Vuelta a la calma → timed walk + mobility

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
  '44444444-4444-4444-8444-444444444444',
  'authenticated',
  'authenticated',
  'coachvega@mygym.app',
  crypt('VegaCoach123!', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'username', 'coachvega',
    'name', 'Coach Vega'
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
  '44444444-4444-4444-8444-444444444444',
  'coachvega@mygym.app',
  'coachvega',
  'Coach Vega',
  'Entrenadora de fuerza funcional y rendimiento. Diseña sesiones atléticas: primero calidad y potencia, después carga. La técnica manda; el volumen se gana, no se improvisa.',
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
  '44444444-4444-4444-8444-444444444444',
  12,
  4800,
  6000,
  41,
  2460,
  14,
  28,
  'Coach de rendimiento',
  '{"strength":9,"agility":9,"endurance":7,"wisdom":8}'::jsonb
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
  v_owner_id uuid := '44444444-4444-4444-8444-444444444444'::uuid;
  v_title text := 'Tren inferior funcional + pliometría';
  v_section_ids uuid[];
  v_exercise_names text[] := ARRAY[
    'Bicicleta o elíptica',
    'Caminata lateral con minibanda',
    'Sentadilla con peso corporal',
    'Zancada atrás + rotación',
    'Box jump',
    'Saltos laterales sobre línea',
    'Squat jump',
    'Prensa de piernas',
    'Peso muerto rumano con mancuernas',
    'Split squat búlgaro',
    'Step-up explosivo con mancuerna',
    'Pull-through en polea',
    'Zancada caminando con mancuernas',
    'Kettlebell swing',
    'Empuje de trineo',
    'Caminata suave y movilidad'
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
        'Sesión de 60 min. Objetivo: fuerza funcional, potencia, coordinación y estabilidad de tren inferior. Intensidad RPE 7–8/10 en los ejercicios de fuerza. Descansos 45–90 s según el bloque.',
        'Material: máquinas, poleas, mancuernas o kettlebells, cajón, minibanda, trineo y espacio libre.',
        'Orden atlético: pliometría → fuerza → funcional → potencia/metabólico. Los saltos van al principio, con las piernas frescas. La potencia y la técnica se trabajan cuando todavía hay calidad.',
        'Calentamiento (8 min): eleva temperatura y prepara tobillos, rodillas, cadera y glúteos. Evita estiramientos estáticos largos antes de la parte explosiva.',
        'Pliometría (12 min): prima la calidad, no el cansancio. Cada salto debe ser explosivo y técnicamente limpio.',
        'Fuerza (15 min): la prensa aporta fuerza de piernas, el rumano trabaja la cadena posterior y el búlgaro añade el componente unilateral.',
        'Funcional (13 min): movimientos que obligan a estabilizar y producir fuerza de forma unilateral.',
        'Potencia (8 min): el swing desarrolla extensión potente de cadera. El trineo cierra con estímulo metabólico sin impactos extra.',
        'Progresión: cuando completes todas las repeticiones con buena técnica y todavía sientas que podrías hacer 2–3 más, aumenta ligeramente la carga. En pliometría, primero sube la calidad o la dificultad del salto, no el volumen.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array(
        'Entrenamiento Funcional',
        'Pliometría',
        'Tren Inferior',
        'Piernas',
        'Glúteos',
        'Cuádriceps',
        'Isquios',
        'Fuerza',
        'Potencia',
        'Explosividad',
        'Coordinación',
        'Estabilidad',
        'Dumbbell',
        'Kettlebell',
        'Máquina',
        'Polea',
        'Cajón',
        'Goma',
        'Elíptica',
        'Gimnasio',
        'Intermedio',
        'Calentamiento',
        'Vuelta a la Calma'
      ),
      'visibility', 'public',
      'estimated_time', 3600,
      'exp_earned', 900,
      'stats', jsonb_build_object(
        'strength', 569,
        'cardio', 82,
        'flexibility', 74,
        'agility', 160,
        'mind', 16
      ),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Calentamiento',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Bicicleta o elíptica',
              'type', 'time',
              'sets', 1,
              'duration', 180,
              'rest', 0,
              'difficulty', 'beginner',
              'description', '3 min suaves para elevar temperatura. Ritmo conversacional, sin buscar fatiga. Prepara tobillos, rodillas y cadera para el trabajo explosivo.',
              'muscle_groups', jsonb_build_array('cardio', 'quadriceps', 'calves'),
              'equipment', jsonb_build_array('bike', 'elliptical')
            ),
            jsonb_build_object(
              'name', 'Caminata lateral con minibanda',
              'type', 'reps',
              'sets', 2,
              'reps', 10,
              'rest', 20,
              'difficulty', 'beginner',
              'description', '10 pasos por lado. Banda por encima de las rodillas, cadera atrás, tensión constante. Activa glúteo medio y estabiliza rodilla.',
              'muscle_groups', jsonb_build_array('glutes', 'hips', 'quadriceps'),
              'equipment', jsonb_build_array('band')
            ),
            jsonb_build_object(
              'name', 'Sentadilla con peso corporal',
              'type', 'reps',
              'sets', 2,
              'reps', 10,
              'rest', 20,
              'difficulty', 'beginner',
              'description', 'Baja controlada, rodillas en la línea de los pies y talones firmes. Sirve de ensayo técnico antes de saltos y carga.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Zancada atrás + rotación',
              'type', 'reps',
              'sets', 1,
              'reps', 8,
              'rest', 20,
              'difficulty', 'intermediate',
              'description', '8 repeticiones por lado. Zancada atrás estable y rota el tronco sobre la pierna delantera. Prepara cadera y control rotacional.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'core'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Pliometría',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Box jump',
              'type', 'reps',
              'sets', 3,
              'reps', 5,
              'rest', 90,
              'difficulty', 'intermediate',
              'description', 'Salto explosivo y aterrizaje estable en el cajón. Baja caminando, no saltes hacia abajo. Calidad por encima del cansancio.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'calves'),
              'equipment', jsonb_build_array('box')
            ),
            jsonb_build_object(
              'name', 'Saltos laterales sobre línea',
              'type', 'reps',
              'sets', 3,
              'reps', 8,
              'rest', 75,
              'difficulty', 'intermediate',
              'description', '8 saltos por lado. Contacto corto, cadera alta y aterrizaje silencioso. Busca reactividad, no amplitud descontrolada.',
              'muscle_groups', jsonb_build_array('glutes', 'quadriceps', 'calves'),
              'equipment', jsonb_build_array('bodyweight')
            ),
            jsonb_build_object(
              'name', 'Squat jump',
              'type', 'reps',
              'sets', 3,
              'reps', 5,
              'rest', 75,
              'difficulty', 'intermediate',
              'description', '5 saltos máximos por serie. Extiende cadera y rodillas a la vez, aterriza suave y resetea antes del siguiente. No encadenes fatiga.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'calves'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Prensa de piernas',
              'type', 'reps',
              'sets', 3,
              'reps', 10,
              'rest', 90,
              'difficulty', 'intermediate',
              'description', '3 × 8–10 a RPE 7–8. Baja con control y empuja con todo el pie. No bloquees las rodillas de golpe. Si te sobran 2–3 reps, sube carga.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes'),
              'equipment', jsonb_build_array('machine')
            ),
            jsonb_build_object(
              'name', 'Peso muerto rumano con mancuernas',
              'type', 'reps',
              'sets', 3,
              'reps', 10,
              'rest', 90,
              'difficulty', 'intermediate',
              'description', '3 × 8–10. Bisagra de cadera, espalda neutra y mancuernas pegadas a las piernas. Siente isquios y glúteos, no la lumbar.',
              'muscle_groups', jsonb_build_array('hamstrings', 'glutes', 'back'),
              'equipment', jsonb_build_array('dumbbell')
            ),
            jsonb_build_object(
              'name', 'Split squat búlgaro',
              'type', 'reps',
              'sets', 3,
              'reps', 8,
              'rest', 90,
              'difficulty', 'intermediate',
              'description', '8 repeticiones por lado. El pie delantero hace el trabajo; el de atrás solo estabiliza. Tronco alto y rodilla alineada.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'hamstrings'),
              'equipment', jsonb_build_array('dumbbell', 'bench')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Funcional',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Step-up explosivo con mancuerna',
              'type', 'reps',
              'sets', 3,
              'reps', 8,
              'rest', 60,
              'difficulty', 'intermediate',
              'description', '8 repeticiones por lado. La pierna de arriba hace casi todo el trabajo; evita impulsarte con la de abajo. Subida explosiva, bajada controlada.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'calves'),
              'equipment', jsonb_build_array('dumbbell', 'box')
            ),
            jsonb_build_object(
              'name', 'Pull-through en polea',
              'type', 'reps',
              'sets', 3,
              'reps', 12,
              'rest', 60,
              'difficulty', 'intermediate',
              'description', '3 × 10–12. Cuerda entre las piernas, bisagra de cadera y extensión potente de glúteos. Brazos relajados; el movimiento nace de la cadera.',
              'muscle_groups', jsonb_build_array('glutes', 'hamstrings'),
              'equipment', jsonb_build_array('cable')
            ),
            jsonb_build_object(
              'name', 'Zancada caminando con mancuernas',
              'type', 'reps',
              'sets', 2,
              'reps', 10,
              'rest', 60,
              'difficulty', 'intermediate',
              'description', '10 zancadas por lado. Paso largo, rodilla delantera estable y tronco erguido. Controla el descenso; no dejes caer la cadera.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'hamstrings'),
              'equipment', jsonb_build_array('dumbbell')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Potencia',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Kettlebell swing',
              'type', 'reps',
              'sets', 3,
              'reps', 10,
              'rest', 60,
              'difficulty', 'intermediate',
              'description', 'Extensión potente de cadera, no sentadilla. La campana flota a la altura del pecho. Aprieta glúteos arriba y deja que la cadera empuje, no los brazos.',
              'muscle_groups', jsonb_build_array('glutes', 'hamstrings', 'core'),
              'equipment', jsonb_build_array('kettlebell')
            ),
            jsonb_build_object(
              'name', 'Empuje de trineo',
              'type', 'reps',
              'sets', 4,
              'reps', 1,
              'rest', 45,
              'difficulty', 'intermediate',
              'description', 'Una pasada de 15–20 m por serie. Cuerpo inclinado, pasos cortos y empuje continuo. Cierra con estímulo metabólico fuerte, sin impactos extra.',
              'muscle_groups', jsonb_build_array('quadriceps', 'glutes', 'cardio'),
              'equipment', jsonb_build_array('sled')
            )
          )
        ),
        jsonb_build_object(
          'name', 'Vuelta a la calma',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object(
              'name', 'Caminata suave y movilidad',
              'type', 'time',
              'sets', 1,
              'duration', 240,
              'rest', 0,
              'difficulty', 'beginner',
              'description', '4 min. Camina suave para bajar el pulso y cierra con movilidad de cadera y tobillo. Sin forzar el rango ni rebotar.',
              'muscle_groups', jsonb_build_array('hips', 'calves', 'mobility'),
              'equipment', jsonb_build_array('bodyweight')
            )
          )
        )
      )
    )
  );
END;
$$;
