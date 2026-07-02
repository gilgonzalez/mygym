CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid CONSTRAINT media_user_id_fkey REFERENCES public.users(id) ON DELETE SET NULL,
  url text NOT NULL,
  type text NOT NULL,
  mime_type text,
  filename text,
  bucket_path text,
  size_bytes bigint,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT media_type_check CHECK (type IN ('image', 'video', 'audio'))
);

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid CONSTRAINT exercises_user_id_fkey REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  difficulty text,
  muscle_group text[],
  equipment text[],
  thumbnail_media_id uuid CONSTRAINT exercises_thumbnail_media_id_fkey REFERENCES public.media(id) ON DELETE SET NULL,
  type text DEFAULT 'reps',
  sets integer,
  reps integer,
  duration integer,
  rest integer,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT exercises_type_check CHECK (type IS NULL OR type IN ('reps', 'time'))
);

CREATE TABLE public.exercise_tutorials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id uuid NOT NULL UNIQUE CONSTRAINT exercise_tutorials_exercise_id_fkey REFERENCES public.exercises(id) ON DELETE CASCADE,
  media_id uuid NOT NULL CONSTRAINT exercise_tutorials_media_id_fkey REFERENCES public.media(id) ON DELETE RESTRICT,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.exercise_tutorial_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutorial_id uuid NOT NULL CONSTRAINT exercise_tutorial_steps_tutorial_id_fkey REFERENCES public.exercise_tutorials(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL CONSTRAINT workouts_user_id_fkey REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  difficulty text,
  tags text[],
  cover text,
  audio text[],
  visibility text DEFAULT 'private',
  estimated_time integer,
  exp_earned integer,
  stats jsonb,
  rating numeric(3,1),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workouts_visibility_check CHECK (visibility IS NULL OR visibility IN ('draft', 'public', 'private'))
);

CREATE TABLE public.workout_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL CONSTRAINT workout_sections_workout_id_fkey REFERENCES public.workouts(id) ON DELETE CASCADE,
  section_id uuid NOT NULL CONSTRAINT workout_sections_section_id_fkey REFERENCES public.sections(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.section_exercises (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id uuid NOT NULL CONSTRAINT section_exercises_section_id_fkey REFERENCES public.sections(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL CONSTRAINT section_exercises_exercise_id_fkey REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  type text DEFAULT 'reps',
  sets integer,
  reps integer,
  rest integer,
  weight_kg numeric,
  duration integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT section_exercises_type_check CHECK (type IS NULL OR type IN ('reps', 'time'))
);

CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid CONSTRAINT workout_logs_user_id_fkey REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id uuid CONSTRAINT workout_logs_workout_id_fkey REFERENCES public.workouts(id) ON DELETE SET NULL,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  duration_seconds integer,
  xp_earned integer,
  notes text,
  rating numeric(3,1),
  feeling text
);

CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY CONSTRAINT user_stats_user_id_fkey REFERENCES public.users(id) ON DELETE CASCADE,
  level integer DEFAULT 1,
  current_xp integer DEFAULT 0,
  next_level_xp integer DEFAULT 100,
  total_workouts integer DEFAULT 0,
  total_minutes integer DEFAULT 0,
  streak_current integer DEFAULT 0,
  streak_longest integer DEFAULT 0,
  last_activity_date timestamp with time zone,
  rank_title text DEFAULT 'Rookie',
  attributes jsonb DEFAULT '{"strength": 0, "agility": 0, "endurance": 0, "wisdom": 0}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_media_user_id ON public.media(user_id);
CREATE INDEX idx_exercises_user_id ON public.exercises(user_id);
CREATE INDEX idx_exercises_created_at ON public.exercises(created_at DESC);
CREATE INDEX idx_exercise_tutorials_exercise_id ON public.exercise_tutorials(exercise_id);
CREATE INDEX idx_exercise_tutorial_steps_tutorial_id ON public.exercise_tutorial_steps(tutorial_id, order_index);
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_visibility ON public.workouts(visibility);
CREATE INDEX idx_workout_sections_workout_id ON public.workout_sections(workout_id, order_index);
CREATE INDEX idx_section_exercises_section_id ON public.section_exercises(section_id, order_index);
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id, completed_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(NULLIF(EXCLUDED.username, ''), public.users.username),
    name = COALESCE(EXCLUDED.name, public.users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_tutorial_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view profiles" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Users insert own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Media viewable by everyone" ON public.media
FOR SELECT USING (true);

CREATE POLICY "Users can upload own media" ON public.media
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media" ON public.media
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media" ON public.media
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Exercises viewable if public or owner" ON public.exercises
FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users create own exercises" ON public.exercises
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own exercises" ON public.exercises
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own exercises" ON public.exercises
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Exercise tutorials viewable by everyone" ON public.exercise_tutorials
FOR SELECT USING (true);

CREATE POLICY "Exercise tutorial steps viewable by everyone" ON public.exercise_tutorial_steps
FOR SELECT USING (true);

CREATE POLICY "Sections viewable by everyone" ON public.sections
FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage sections" ON public.sections
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Workouts viewable if public or owner" ON public.workouts
FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users create own workouts" ON public.workouts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workouts" ON public.workouts
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own workouts" ON public.workouts
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Workout sections viewable by everyone" ON public.workout_sections
FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage workout sections" ON public.workout_sections
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Section exercises viewable by everyone" ON public.section_exercises
FOR SELECT USING (true);

CREATE POLICY "Authenticated users manage section exercises" ON public.section_exercises
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users view own workout logs" ON public.workout_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own workout logs" ON public.workout_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workout logs" ON public.workout_logs
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own workout logs" ON public.workout_logs
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own stats" ON public.user_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own stats" ON public.user_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stats" ON public.user_stats
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
