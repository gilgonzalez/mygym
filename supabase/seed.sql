CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Demo user
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
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@mygym.app',
  crypt('Demo123456!', gen_salt('bf')),
  timezone('utc'::text, now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"demoathlete","name":"Demo Athlete"}'::jsonb,
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
  bio
)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'demo@mygym.app',
  'demoathlete',
  'Demo Athlete',
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=fitness%20coach%20portrait%20clean%20studio%20lighting%20athletic%20app%20profile%20photo&image_size=square',
  'Usuario demo para poblar la aplicacion con rutinas y ejercicios de prueba.'
)
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
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
  '11111111-1111-4111-8111-111111111111',
  4,
  320,
  500,
  12,
  284,
  3,
  7,
  'Apprentice',
  '{"strength": 18, "agility": 11, "endurance": 14, "wisdom": 6}'::jsonb
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

-- Shared media library
INSERT INTO public.media (id, user_id, url, type, mime_type, filename, bucket_path)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=athlete%20doing%20push%20ups%20in%20modern%20gym%20clean%20editorial%20fitness%20photo&image_size=square_hd',
    'image',
    'image/png',
    'push-ups-thumb.png',
    'seed/push-ups-thumb.png'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=athlete%20performing%20air%20squats%20in%20bright%20training%20studio%20fitness%20photo&image_size=square_hd',
    'image',
    'image/png',
    'air-squats-thumb.png',
    'seed/air-squats-thumb.png'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=athlete%20holding%20forearm%20plank%20on%20mat%20minimal%20gym%20fitness%20photo&image_size=square_hd',
    'image',
    'image/png',
    'plank-thumb.png',
    'seed/plank-thumb.png'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=athlete%20doing%20jumping%20jacks%20warmup%20in%20training%20studio%20fitness%20photo&image_size=square_hd',
    'image',
    'image/png',
    'jumping-jacks-thumb.png',
    'seed/jumping-jacks-thumb.png'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=push%20up%20tutorial%20step%20by%20step%20fitness%20coach%20demonstration%20studio%20frame&image_size=landscape_16_9',
    'image',
    'image/png',
    'push-ups-tutorial.png',
    'seed/push-ups-tutorial.png'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '11111111-1111-4111-8111-111111111111',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=plank%20tutorial%20demonstration%20fitness%20coach%20showing%20core%20alignment%20studio&image_size=landscape_16_9',
    'image',
    'image/png',
    'plank-tutorial.png',
    'seed/plank-tutorial.png'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  url = EXCLUDED.url,
  type = EXCLUDED.type,
  mime_type = EXCLUDED.mime_type,
  filename = EXCLUDED.filename,
  bucket_path = EXCLUDED.bucket_path;

-- Shared exercise library
INSERT INTO public.exercises (
  id,
  user_id,
  name,
  description,
  difficulty,
  muscle_group,
  equipment,
  thumbnail_media_id,
  type,
  sets,
  reps,
  duration,
  rest,
  is_public
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Push-Ups',
    'Mantén el core activo y baja con control hasta rozar el suelo.',
    'beginner',
    ARRAY['chest', 'triceps', 'core'],
    ARRAY['bodyweight'],
    '20000000-0000-4000-8000-000000000001',
    'reps',
    3,
    12,
    0,
    45,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Air Squats',
    'Empuja la cadera atrás, baja estable y sube presionando el suelo con todo el pie.',
    'beginner',
    ARRAY['legs', 'glutes'],
    ARRAY['bodyweight'],
    '20000000-0000-4000-8000-000000000002',
    'reps',
    3,
    15,
    0,
    45,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'Forearm Plank',
    'Alinea hombros, cadera y talones para mantener una plancha firme durante todo el bloque.',
    'intermediate',
    ARRAY['core', 'shoulders'],
    ARRAY['mat'],
    '20000000-0000-4000-8000-000000000003',
    'time',
    3,
    0,
    40,
    30,
    true
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'Jumping Jacks',
    'Usa un ritmo alegre, aterriza suave y coordina la apertura con la respiración.',
    'beginner',
    ARRAY['cardio', 'legs'],
    ARRAY['bodyweight'],
    '20000000-0000-4000-8000-000000000004',
    'time',
    2,
    0,
    30,
    15,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  thumbnail_media_id = EXCLUDED.thumbnail_media_id,
  type = EXCLUDED.type,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  duration = EXCLUDED.duration,
  rest = EXCLUDED.rest,
  is_public = EXCLUDED.is_public;

INSERT INTO public.exercise_tutorials (id, exercise_id, media_id)
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000005'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000006'
  )
ON CONFLICT (id) DO UPDATE
SET
  exercise_id = EXCLUDED.exercise_id,
  media_id = EXCLUDED.media_id;

DELETE FROM public.exercise_tutorial_steps
WHERE tutorial_id IN (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002'
);

INSERT INTO public.exercise_tutorial_steps (id, tutorial_id, order_index, title, description)
VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    0,
    'Posición inicial',
    'Coloca las manos ligeramente más abiertas que los hombros y activa el abdomen antes de bajar.'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    1,
    'Descenso controlado',
    'Baja en bloque evitando que la cadera se hunda y mantén los codos a unos 45 grados.'
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000001',
    2,
    'Empuje',
    'Exhala al subir y termina con brazos extendidos sin perder la línea del cuerpo.'
  ),
  (
    '41000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000002',
    0,
    'Apoyo de antebrazos',
    'Alinea los codos debajo de los hombros y apoya los antebrazos paralelos.'
  ),
  (
    '41000000-0000-4000-8000-000000000005',
    '40000000-0000-4000-8000-000000000002',
    1,
    'Cuerpo en línea',
    'Aprieta glúteos y abdomen para mantener hombros, cadera y talones en una sola línea.'
  ),
  (
    '41000000-0000-4000-8000-000000000006',
    '40000000-0000-4000-8000-000000000002',
    2,
    'Respiración',
    'Respira corto y controlado sin elevar la cadera ni encoger los hombros.'
  );

-- Workouts
INSERT INTO public.workouts (
  id,
  user_id,
  title,
  description,
  difficulty,
  tags,
  cover,
  audio,
  visibility,
  estimated_time,
  exp_earned,
  stats
)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'Full Body Starter',
    'Rutina corta de cuerpo completo para probar el flujo del editor y la ejecución del workout.',
    'beginner',
    ARRAY['strength', 'mobility', 'home'],
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=full%20body%20beginner%20workout%20cover%20modern%20gym%20editorial%20fitness%20scene&image_size=landscape_16_9',
    ARRAY[]::text[],
    'public',
    900,
    150,
    '{"strength": 70, "cardio": 30, "flexibility": 20, "agility": 15, "mind": 15}'::jsonb
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Core and Conditioning',
    'Workout de prueba con reutilización de ejercicios y parámetros distintos en section_exercises.',
    'intermediate',
    ARRAY['cardio', 'core', 'conditioning'],
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=core%20conditioning%20workout%20cover%20athletic%20studio%20dark%20editorial%20fitness&image_size=landscape_16_9',
    ARRAY[]::text[],
    'public',
    1080,
    220,
    '{"strength": 35, "cardio": 70, "flexibility": 10, "agility": 35, "mind": 20}'::jsonb
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  tags = EXCLUDED.tags,
  cover = EXCLUDED.cover,
  audio = EXCLUDED.audio,
  visibility = EXCLUDED.visibility,
  estimated_time = EXCLUDED.estimated_time,
  exp_earned = EXCLUDED.exp_earned,
  stats = EXCLUDED.stats,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.sections (id, name, type)
VALUES
  ('60000000-0000-4000-8000-000000000001', 'Warm-Up', 'single'),
  ('60000000-0000-4000-8000-000000000002', 'Main Set', 'single'),
  ('60000000-0000-4000-8000-000000000003', 'Activation', 'linear'),
  ('60000000-0000-4000-8000-000000000004', 'Finisher', 'single')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  type = EXCLUDED.type;

INSERT INTO public.workout_sections (id, workout_id, section_id, order_index)
VALUES
  ('70000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 0),
  ('70000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', 1),
  ('70000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000003', 0),
  ('70000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000004', 1)
ON CONFLICT (id) DO UPDATE
SET
  workout_id = EXCLUDED.workout_id,
  section_id = EXCLUDED.section_id,
  order_index = EXCLUDED.order_index;

INSERT INTO public.section_exercises (
  id,
  section_id,
  exercise_id,
  order_index,
  type,
  sets,
  reps,
  rest,
  weight_kg,
  duration
)
VALUES
  (
    '80000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000004',
    0,
    'time',
    1,
    0,
    15,
    NULL,
    45
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    0,
    'reps',
    3,
    12,
    45,
    NULL,
    0
  ),
  (
    '80000000-0000-4000-8000-000000000003',
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    1,
    'reps',
    3,
    15,
    45,
    NULL,
    0
  ),
  (
    '80000000-0000-4000-8000-000000000004',
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000003',
    2,
    'time',
    3,
    0,
    30,
    NULL,
    40
  ),
  (
    '80000000-0000-4000-8000-000000000005',
    '60000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000004',
    0,
    'time',
    2,
    0,
    10,
    NULL,
    30
  ),
  (
    '80000000-0000-4000-8000-000000000006',
    '60000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000003',
    1,
    'time',
    4,
    0,
    20,
    NULL,
    30
  ),
  (
    '80000000-0000-4000-8000-000000000007',
    '60000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    0,
    'reps',
    4,
    10,
    30,
    NULL,
    0
  ),
  (
    '80000000-0000-4000-8000-000000000008',
    '60000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    1,
    'reps',
    4,
    18,
    30,
    NULL,
    0
  )
ON CONFLICT (id) DO UPDATE
SET
  section_id = EXCLUDED.section_id,
  exercise_id = EXCLUDED.exercise_id,
  order_index = EXCLUDED.order_index,
  type = EXCLUDED.type,
  sets = EXCLUDED.sets,
  reps = EXCLUDED.reps,
  rest = EXCLUDED.rest,
  weight_kg = EXCLUDED.weight_kg,
  duration = EXCLUDED.duration;

COMMIT;
