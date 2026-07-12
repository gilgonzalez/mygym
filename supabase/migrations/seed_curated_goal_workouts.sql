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
      IF NULLIF(v_exercise->>'exercise_id', '') IS NULL THEN
        RAISE EXCEPTION 'Curated workout % contains an exercise without exercise_id', p_workout->>'title';
      END IF;

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
  v_owner_id uuid := 'fd4c358d-7cf7-410e-9637-1a95bd5bbd7a'::uuid;
  v_titles text[] := ARRAY[
    'Hipertrofia basada en evidencia',
    'Fuerza maxima: patrones basicos',
    'Perdida de grasa sin perder musculo',
    'Recomposicion corporal equilibrada',
    'Resistencia total',
    'Movilidad y flexibilidad funcional',
    'Calistenia progresiva',
    'Entrenamiento funcional completo',
    'Prevencion de lesiones y control motor',
    'Salud general a largo plazo'
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
      'title', 'Hipertrofia basada en evidencia',
      'description', concat_ws(
        E'\n',
        'Rutina orientada a maximizar la hipertrofia con prioridad para ejercicios multiarticulares, estabilidad y progresion sostenible.',
        'La base del estimulo la aportan sentadilla, press, remo y bisagra; los complementos afinan hombro, patron de empuje y core sin redundancias.',
        'Mantiene equilibrio entre empujes y tracciones, cadena anterior y posterior, y usa rangos completos cuando es posible.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Hipertrofia', 'Strength', 'Barbell'),
      'visibility', 'public',
      'estimated_time', 75,
      'exp_earned', 140,
      'stats', jsonb_build_object('goal', 'hypertrophy', 'focus', 'muscle_gain'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Base multiarticular',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell high bar squat', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 150),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bench press', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 150),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell pendlay row', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell romanian deadlift', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 120)
          )
        ),
        jsonb_build_object(
          'name', 'Complementos y core',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell seated overhead press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest dip', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Face pulls con banda amarilla/verde', 'wger'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Fuerza maxima: patrones basicos',
      'description', concat_ws(
        E'\n',
        'Rutina construida alrededor de sentadilla, press horizontal, press vertical, peso muerto y traccion pesada.',
        'Los accesorios solo refuerzan el rendimiento tecnico y la estabilidad del core para mover mas carga con menos fatiga inutil.',
        'La distribucion prioriza calidad de repeticion, descanso suficiente y progresion planificada.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Fuerza', 'Strength', 'Barbell'),
      'visibility', 'public',
      'estimated_time', 80,
      'exp_earned', 150,
      'stats', jsonb_build_object('goal', 'strength', 'focus', 'max_strength'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Levantamientos principales',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell high bar squat', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 3, 'rest', 180),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bench press', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 3, 'rest', 180),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell deadlift', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 3, 'rest', 210)
          )
        ),
        jsonb_build_object(
          'name', 'Soporte tecnico',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell seated overhead press', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 4, 'rest', 150),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell pendlay row', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 150),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chin-ups (narrow parallel grip)', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band horizontal pallof press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 45)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Perdida de grasa sin perder musculo',
      'description', concat_ws(
        E'\n',
        'Rutina pensada para elevar el gasto energetico manteniendo la fuerza como nucleo del entrenamiento.',
        'Los compuestos ocupan la parte central de la sesion y el cardio aparece solo como complemento util y sostenible.',
        'Se priorizan grandes grupos musculares, continuidad de trabajo y buena relacion estimulo-fatiga.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Perdida de grasa', 'Strength', 'Cardio'),
      'visibility', 'public',
      'estimated_time', 65,
      'exp_earned', 130,
      'stats', jsonb_build_object('goal', 'fat_loss', 'focus', 'energy_expenditure'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza densa',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell high bar squat', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bench press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bent over row', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dumbbell goblet squat', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('kettlebell swing', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 45)
          )
        ),
        jsonb_build_object(
          'name', 'Condicionamiento complementario',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercise_db'), 'type', 'time', 'sets', 6, 'duration', 40, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('walking on incline treadmill', 'exercise_db'), 'type', 'time', 'sets', 1, 'duration', 600, 'rest', 0)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Recomposicion corporal equilibrada',
      'description', concat_ws(
        E'\n',
        'Rutina orientada a ganar musculo y reducir grasa con un balance cuidadoso entre fuerza, hipertrofia y cardio moderado.',
        'La fatiga esta contenida para sostener adherencia, recuperacion y progresion durante varias semanas.',
        'Combina compuestos eficaces, trabajo unilateral y un cierre metabolico moderado.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Recomposicion', 'Strength', 'Cardio'),
      'visibility', 'public',
      'estimated_time', 70,
      'exp_earned', 135,
      'stats', jsonb_build_object('goal', 'recomp', 'focus', 'muscle_plus_fat_loss'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza util',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell high bar squat', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 5, 'rest', 150),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bench press', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('traditional barbell romanian deadlift', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('barbell bent over row', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 90)
          )
        ),
        jsonb_build_object(
          'name', 'Complemento y gasto',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('walking lunge', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band horizontal pallof press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('stationary bike run', 'exercise_db'), 'type', 'time', 'sets', 1, 'duration', 480, 'rest', 0)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Resistencia total',
      'description', concat_ws(
        E'\n',
        'Rutina destinada a mejorar la capacidad para sostener esfuerzos largos con movimientos repetitivos y grandes cadenas musculares.',
        'El bloque central encadena patrones de locomocion, salto, traccion global y trabajo ciclico con baja complejidad tecnica.',
        'Se busca continuidad, eficiencia cardiovascular y fatiga articular controlada.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Resistencia', 'Cardio', 'HIIT'),
      'visibility', 'public',
      'estimated_time', 55,
      'exp_earned', 125,
      'stats', jsonb_build_object('goal', 'endurance', 'focus', 'sustained_effort'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Circuito continuo',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('burpee', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 30, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('jump rope', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 60, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('air bike', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 60, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dumbbell step-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('kettlebell swing', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('walking on stepmill', 'exercise_db'), 'type', 'time', 'sets', 1, 'duration', 480, 'rest', 0)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Movilidad y flexibilidad funcional',
      'description', concat_ws(
        E'\n',
        'Rutina enfocada en movilidad activa, control motor y estabilidad articular, no solo en flexibilidad pasiva.',
        'Da prioridad a tobillo, cadera, columna toracica y hombro con ejercicios que combinan rango util y capacidad de controlarlo.',
        'El bloque final integra movilidad con fuerza ligera para consolidar el nuevo rango.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Movilidad', 'Mobility', 'Recovery'),
      'visibility', 'public',
      'estimated_time', 35,
      'exp_earned', 90,
      'stats', jsonb_build_object('goal', 'mobility', 'focus', 'active_range_of_motion'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Movilidad activa',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Banded Ankle Mobility', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('ankle circles', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 15, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Rotación torácica en media rodilla', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Balanceo de piernas (adelante y atrás)', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20)
          )
        ),
        jsonb_build_object(
          'name', 'Control y rango',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('weighted cossack squats (male)', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('upward facing dog', 'exercise_db'), 'type', 'reps', 'sets', 2, 'reps', 8, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest and front of shoulder stretch', 'exercise_db'), 'type', 'time', 'sets', 2, 'duration', 30, 'rest', 15),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('low glute bridge on floor', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Calistenia progresiva',
      'description', concat_ws(
        E'\n',
        'Rutina orientada al desarrollo progresivo de habilidades con peso corporal y fuerza relativa.',
        'Cada ejercicio acerca al siguiente nivel: empuje basico hacia fondos, traccion asistida hacia muscle-up, y control del core hacia L-sit.',
        'Se priorizan control corporal, estabilidad escapular, core y dominio tecnico.'
      ),
      'difficulty', 'advanced',
      'tags', jsonb_build_array('Calistenia', 'Calisthenics', 'Bodyweight'),
      'visibility', 'public',
      'estimated_time', 60,
      'exp_earned', 140,
      'stats', jsonb_build_object('goal', 'calisthenics', 'focus', 'skill_progression'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Empuje y control',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('close-grip push-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('chest dip (on dip-pull-up cage)', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 6, 'rest', 90),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand', 'exercise_db'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('handstand push-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 4, 'rest', 90)
          )
        ),
        jsonb_build_object(
          'name', 'Traccion y skills',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band assisted pull-up', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('muscle-up (on vertical bar)', 'exercise_db'), 'type', 'reps', 'sets', 5, 'reps', 3, 'rest', 120),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('L-Sit (Foot Supported)', 'wger'), 'type', 'time', 'sets', 4, 'duration', 20, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Hollow hold', 'wger'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 30)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Entrenamiento funcional completo',
      'description', concat_ws(
        E'\n',
        'Rutina basada en patrones fundamentales del movimiento humano: empuje, traccion, sentadilla, bisagra, rotacion, anti-rotacion, transporte y locomocion.',
        'El objetivo es transferir fuerza y coordinacion a tareas reales con ejercicios versatiles y buena relacion estimulo-fatiga.',
        'Se mantienen cadenas anterior y posterior en equilibrio y el core trabaja como nexo entre patrones.'
      ),
      'difficulty', 'intermediate',
      'tags', jsonb_build_array('Funcional', 'Strength', 'Dumbbell'),
      'visibility', 'public',
      'estimated_time', 55,
      'exp_earned', 120,
      'stats', jsonb_build_object('goal', 'functional', 'focus', 'movement_patterns'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Patrones fundamentales',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('kettlebell goblet squat', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('kettlebell swing', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 15, 'rest', 45),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Landmine press', 'wger'), 'type', 'reps', 'sets', 4, 'reps', 8, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band one arm standing low row', 'exercise_db'), 'type', 'reps', 'sets', 4, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Turkish Get-Up', 'wger'), 'type', 'reps', 'sets', 3, 'reps', 4, 'rest', 60)
          )
        ),
        jsonb_build_object(
          'name', 'Core, carry y locomocion',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band horizontal pallof press', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Dumbbell farmer''s carry', 'wger'), 'type', 'time', 'sets', 4, 'duration', 40, 'rest', 40),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('walking lunge', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Prevencion de lesiones y control motor',
      'description', concat_ws(
        E'\n',
        'Rutina centrada en estabilidad, propiocepcion, control neuromuscular y refuerzo progresivo sin provocar dolor.',
        'El trabajo de core, cadera, escpula y hombro se reparte para mejorar calidad de movimiento y reducir asimetrias.',
        'La progresion es conservadora y usa ejercicios de alta utilidad clinica y preventiva.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Prevencion', 'Recovery', 'Mobility'),
      'visibility', 'public',
      'estimated_time', 40,
      'exp_earned', 95,
      'stats', jsonb_build_object('goal', 'prehab', 'focus', 'stability_and_control'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Estabilidad y core',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Bird Dog', 'wger'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dead bug', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('bodyweight incline side plank', 'exercise_db'), 'type', 'time', 'sets', 3, 'duration', 30, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('low glute bridge on floor', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30)
          )
        ),
        jsonb_build_object(
          'name', 'Cadera, escapula y hombro',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('monster walk', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Face pulls con banda amarilla/verde', 'wger'), 'type', 'reps', 'sets', 3, 'reps', 15, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('cable standing shoulder external rotation', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 30),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('balance board', 'exercise_db'), 'type', 'time', 'sets', 3, 'duration', 45, 'rest', 20)
          )
        )
      )
    )
  );

  PERFORM public._seed_insert_curated_workout(
    v_owner_id,
    jsonb_build_object(
      'title', 'Salud general a largo plazo',
      'description', concat_ws(
        E'\n',
        'Rutina sostenible para desarrollar fuerza, capacidad cardiovascular, movilidad, equilibrio, coordinacion y una dosis ligera de potencia.',
        'Ninguna capacidad domina por completo: se mezclan patrones basicos, locomocion y trabajo preventivo para mejorar calidad de vida.',
        'Se priorizan ejercicios versatiles, accesibles y faciles de sostener durante anos.'
      ),
      'difficulty', 'beginner',
      'tags', jsonb_build_array('Salud general', 'Strength', 'Cardio'),
      'visibility', 'public',
      'estimated_time', 50,
      'exp_earned', 110,
      'stats', jsonb_build_object('goal', 'general_health', 'focus', 'longevity'),
      'sections', jsonb_build_array(
        jsonb_build_object(
          'name', 'Fuerza basica',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('dumbbell goblet squat', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Landmine press', 'wger'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 75),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('band one arm standing low row', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 10, 'rest', 60),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('traditional barbell romanian deadlift', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 8, 'rest', 90)
          )
        ),
        jsonb_build_object(
          'name', 'Capacidad fisica global',
          'orderType', 'linear',
          'exercises', jsonb_build_array(
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Walking', 'wger'), 'type', 'time', 'sets', 1, 'duration', 900, 'rest', 0),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('balance board', 'exercise_db'), 'type', 'time', 'sets', 2, 'duration', 45, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Banded Ankle Mobility', 'wger'), 'type', 'reps', 'sets', 2, 'reps', 12, 'rest', 20),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('Dumbbell farmer''s carry', 'wger'), 'type', 'time', 'sets', 3, 'duration', 40, 'rest', 40),
            jsonb_build_object('exercise_id', public._seed_find_exercise_id('kettlebell swing', 'exercise_db'), 'type', 'reps', 'sets', 3, 'reps', 12, 'rest', 45)
          )
        )
      )
    )
  );
END;
$$;

DROP FUNCTION public._seed_insert_curated_workout(uuid, jsonb);
DROP FUNCTION public._seed_find_exercise_id(text, text);
