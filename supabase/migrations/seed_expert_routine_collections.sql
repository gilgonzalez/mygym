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
  'Coach especializado en calistenia, HIIT, cardio orientado a quema grasa y protocolos tabata. Programa rutinas con criterio de progresion, tecnica y control de fatiga.',
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

DO $$
DECLARE
  v_owner_id uuid := '33333333-3333-4333-8333-333333333333'::uuid;
  v_section_ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT ws.section_id)
  INTO v_section_ids
  FROM public.workouts w
  JOIN public.workout_sections ws ON ws.workout_id = w.id
  WHERE w.user_id = v_owner_id;

  DELETE FROM public.workouts
  WHERE user_id = v_owner_id;

  IF v_section_ids IS NOT NULL THEN
    DELETE FROM public.sections
    WHERE id = ANY(v_section_ids);
  END IF;

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Calistenia I: base tecnica',
      'description', concat_ws(
        E'\n',
        'Rutina inicial de calistenia pensada para aprender a organizar escápulas, empujar con control y construir una primera base de traccion.',
        'El volumen esta medido para que una persona principiante pueda repetir la sesion varias veces por semana sin acumular fatiga excesiva.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Calisthenics', 'Bodyweight', 'Beginner'),
      'visibility', 'public',
      'estimated_time', 1800,
      'exp_earned', 85,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20calisthenics%20practice%20in%20a%20clean%20modern%20gym%2C%20coach%20teaching%20strict%20bodyweight%20technique%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'calisthenics_foundation', 'collection', 'calisthenics', 'level', 1),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Activacion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('zancada hacia adelante (hombre)', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha de rodillas tocando el hombro (hombre)', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('abdominales 3/4', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza base',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('flexiones inclinadas', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominadas en banco', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('fondos en paralelas asistidos (de rodillas)', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 60)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Calistenia II: empuje y traccion',
      'description', concat_ws(
        E'\n',
        'Sesion intermedia para mejorar la relacion entre empuje horizontal, traccion y trabajo del core colgado.',
        'La idea es consolidar un volumen serio de repeticiones de calidad antes de pasar a variantes mas exigentes en barra.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Calisthenics', 'Bodyweight', 'Intermediate'),
      'visibility', 'public',
      'estimated_time', 2100,
      'exp_earned', 100,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=intermediate%20calisthenics%20pull%20and%20push%20session%20on%20bars%2C%20athlete%20performing%20controlled%20bodyweight%20training%2C%20editorial%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'calisthenics_progression', 'collection', 'calisthenics', 'level', 2),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Entrada en calor',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('sentadilla con salto y caída con peso corporal', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('remo invertido en banco', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha frontal con giro', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Bloque principal',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominada asistida con banda', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('remo invertido', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('flexiones con agarre cerrado', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('fondos en paralelas (en jaula de fondos y dominadas)', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('elevación de rodillas colgado asistido', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 40)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Calistenia III: barra y fuerza relativa',
      'description', concat_ws(
        E'\n',
        'Rutina avanzada de calistenia orientada a fuerza relativa y dominio de barra.',
        'Prioriza variantes mas exigentes de dominada y fondos, con descansos suficientes para sostener tecnica y rango de movimiento.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Calisthenics', 'Bodyweight', 'Advanced', 'Pull-up Bar'),
      'visibility', 'public',
      'estimated_time', 2400,
      'exp_earned', 120,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20calisthenics%20strength%20session%20on%20pull-up%20bars%20and%20parallel%20bars%2C%20elite%20bodyweight%20athlete%2C%20editorial%20sports%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'relative_strength', 'collection', 'calisthenics', 'level', 3),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Preparacion neural',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('sentadilla con salto', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('planchas en punto de potencia', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Fuerza en barra',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominadas (agarre paralelo estrecho)', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 6, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominada con agarre cerrado', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dominada arquera', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 4, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('fondos en paralelas con agarre ancho', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('flexiones en reloj', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'HIIT I: activacion metabolica',
      'description', concat_ws(
        E'\n',
        'Propuesta de HIIT accesible para elevar pulsaciones con impacto moderado y patrones sencillos.',
        'Ideal para dias en los que se busca densidad de trabajo sin recurrir a cargas altas ni tecnicas complejas.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('HIIT', 'Conditioning', 'Beginner'),
      'visibility', 'public',
      'estimated_time', 1700,
      'exp_earned', 90,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20hiit%20conditioning%20session%20with%20jump%20rope%20step-ups%20and%20bodyweight%20intervals%20in%20a%20modern%20gym%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'hiit_conditioning', 'collection', 'hiit', 'level', 1),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Circuito principal',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 35, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('step-up con banda', 'exercises_dataset'), 'type', 'reps', 'sets', 4, 'reps', 12, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 30, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 25)
          )
        ),
        jsonb_build_object(
          'name', 'Cierre',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('abdominales 3/4', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 20, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha frontal con giro', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 25)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'HIIT II: functional burn',
      'description', concat_ws(
        E'\n',
        'HIIT intermedio con implementos sencillos para atacar tren inferior, empuje y bisagra dentro de rondas cortas.',
        'El objetivo es sostener intensidad alta con tecnica limpia, sin convertir el bloque en un AMRAP desordenado.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('HIIT', 'Functional Training', 'Intermediate'),
      'visibility', 'public',
      'estimated_time', 2100,
      'exp_earned', 110,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=intermediate%20functional%20hiit%20workout%20with%20battle%20ropes%20dumbbells%20lunges%20and%20burpees%2C%20intense%20gym%20training%20scene%2C%20editorial%20sports%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'hiit_functional', 'collection', 'hiit', 'level', 2),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Primer',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 25, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 40, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('zancada con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Rondas intensas',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 25, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('zancada con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('press alterno con mancuerna', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('peso muerto con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 12, 'rest', 20)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'HIIT III: potencia y barra',
      'description', concat_ws(
        E'\n',
        'Sesion avanzada de HIIT enfocada en potencia de cadera y tolerancia a la fatiga con barra.',
        'Las repeticiones son relativamente bajas para que la intensidad venga del ritmo global y no de degradar la tecnica.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('HIIT', 'Barbell', 'Advanced'),
      'visibility', 'public',
      'estimated_time', 2300,
      'exp_earned', 125,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20barbell%20hiit%20workout%20with%20dumbbell%20cleans%20thrusters%20and%20burpees%20in%20a%20high%20performance%20gym%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'hiit_power', 'collection', 'hiit', 'level', 3),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Entrada',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 2, 'duration', 45, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('clean con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('sentadilla con salto', 'exercises_dataset'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Bloque explosivo',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('clean con mancuernas', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('thruster con barra', 'exercises_dataset'), 'type', 'reps', 'sets', 5, 'reps', 6, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee con salto', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 25, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 30, 'rest', 20)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Cardio I: quema grasa base',
      'description', concat_ws(
        E'\n',
        'Bloque cardiovascular de entrada para elevar gasto energetico con una intensidad sostenible.',
        'Se combina locomocion continua con pequeños picos de pulsaciones para favorecer adherencia y tolerancia al esfuerzo.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Cardio', 'Fat Loss', 'Beginner'),
      'visibility', 'public',
      'estimated_time', 2400,
      'exp_earned', 95,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20cardio%20fat%20loss%20session%20with%20incline%20walking%20jump%20rope%20and%20simple%20conditioning%20in%20a%20clean%20gym%2C%20editorial%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'fat_loss', 'collection', 'cardio', 'level', 1),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Base aerobica',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('caminar en cinta de correr inclinada', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 240, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 45, 'rest', 25)
          )
        ),
        jsonb_build_object(
          'name', 'Aceleraciones',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('step-up con banda', 'exercises_dataset'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 25)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Cardio II: intervalos de carrera',
      'description', concat_ws(
        E'\n',
        'Sesion intermedia con predominio de carrera por intervalos y apoyos cortos de cuerda y batalla.',
        'Muy util para mejorar capacidad de sostener cambios de ritmo y elevar gasto calorico sin recurrir a mucha carga externa.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Cardio', 'Fat Loss', 'Intervals'),
      'visibility', 'public',
      'estimated_time', 2500,
      'exp_earned', 110,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=intermediate%20interval%20running%20and%20conditioning%20session%20with%20jump%20rope%20battle%20ropes%20and%20cardio%20focus%2C%20editorial%20sports%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'fat_loss_intervals', 'collection', 'cardio', 'level', 2),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Carrera',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('correr (máquina)', 'exercises_dataset'), 'type', 'time', 'sets', 6, 'duration', 90, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 45, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Pulso alto',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 35, 'rest', 25),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee con salto', 'exercises_dataset'), 'type', 'time', 'sets', 4, 'duration', 30, 'rest', 25)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Cardio III: engine mixto',
      'description', concat_ws(
        E'\n',
        'Rutina avanzada de cardio y quema grasa para atletas con buena base de trabajo continuo.',
        'Combina carrera libre, estaciones de alta demanda y balon medicinal para sostener el pulso alto durante gran parte de la sesion.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Cardio', 'Fat Loss', 'Advanced'),
      'visibility', 'public',
      'estimated_time', 2800,
      'exp_earned', 130,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20cardio%20fat%20loss%20mixed%20engine%20session%20with%20running%20battle%20ropes%20medicine%20ball%20slams%20and%20burpees%20in%20a%20performance%20gym%2C%20editorial%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'mixed_engine', 'collection', 'cardio', 'level', 3),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Base',
          'orderType', 'single',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('correr', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 120, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('caminar en cinta de correr inclinada', 'exercises_dataset'), 'type', 'time', 'sets', 3, 'duration', 180, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Engine',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 40, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('golpe de balón medicinal por encima de la cabeza', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 30, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 25, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 5, 'duration', 35, 'rest', 20)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Tabata I: bodyweight express',
      'description', concat_ws(
        E'\n',
        'Tabata de nivel inicial usando solo peso corporal y patrones muy faciles de comprender.',
        'La clave aqui es respetar el formato 20 segundos de trabajo y 10 de pausa manteniendo calidad de movimiento en cada ronda.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Tabata', 'Bodyweight', 'Beginner'),
      'visibility', 'public',
      'estimated_time', 1500,
      'exp_earned', 90,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=beginner%20bodyweight%20tabata%20session%20with%20jumping%20jacks%20squat%20jumps%20and%20mountain%20climbers%20in%20a%20modern%20studio%2C%20editorial%20fitness%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'tabata_bodyweight', 'collection', 'tabata', 'level', 1),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Tabata central',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('salto de jack (hombre)', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('sentadilla con salto', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('escalador', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('plancha de rodillas tocando el hombro (hombre)', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Tabata II: cardio burn',
      'description', concat_ws(
        E'\n',
        'Tabata intermedio con enfasis en pulsaciones altas y recuperaciones muy cortas.',
        'Se usan ejercicios sencillos pero demandantes para que el formato haga el trabajo duro.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Tabata', 'Cardio', 'Intermediate'),
      'visibility', 'public',
      'estimated_time', 1550,
      'exp_earned', 100,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=intermediate%20tabata%20cardio%20session%20with%20jump%20rope%20burpees%20battle%20ropes%20and%20medicine%20ball%20slams%2C%20editorial%20sports%20photography&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'tabata_cardio', 'collection', 'tabata', 'level', 2),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Tabata central',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('soga de saltar', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('golpe de balón medicinal por encima de la cabeza', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Tabata III: power output',
      'description', concat_ws(
        E'\n',
        'Version avanzada del protocolo tabata con implementos y mayor demanda de potencia total.',
        'Pensada para personas entrenadas que pueden sostener intensidad muy alta sin perder calidad mecanica.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Tabata', 'Power', 'Advanced'),
      'visibility', 'public',
      'estimated_time', 1600,
      'exp_earned', 115,
      'cover', 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=advanced%20power%20tabata%20workout%20with%20kettlebell%20thrusters%20dumbbell%20burpees%20battle%20ropes%20and%20medicine%20ball%20slams%2C%20editorial%20fitness%20photo&image_size=landscape_16_9',
      'stats', jsonb_build_object('goal', 'tabata_power', 'collection', 'tabata', 'level', 3),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Tabata central',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('thruster con kettlebell', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee con mancuernas', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cuerdas de batalla', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('golpe de balón medicinal por encima de la cabeza', 'exercises_dataset'), 'type', 'time', 'sets', 8, 'duration', 20, 'rest', 10)
          )
        )
      )
    )
  );
END;
$$;
