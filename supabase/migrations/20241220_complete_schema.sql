-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS (Extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MEDIA (For images/videos)
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video')),
    filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EXERCISES (Library of exercises)
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT, -- e.g., 'chest', 'legs', 'back'
    equipment TEXT, -- e.g., 'dumbbell', 'bodyweight'
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Null implies system default
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. WORKOUTS (Routines)
CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'hiit', 'other')),
    duration_minutes INTEGER,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. WORKOUT_SECTIONS (Grouping within a workout)
CREATE TABLE public.workout_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Warmup', 'Main Set', 'Cooldown'
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SECTION_EXERCISES (Junction: Section <-> Exercise)
CREATE TABLE public.section_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES public.workout_sections(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
    sets INTEGER,
    reps INTEGER,
    weight_kg DECIMAL(5,2),
    duration_seconds INTEGER,
    rest_seconds INTEGER,
    order_index INTEGER NOT NULL,
    notes TEXT
);

-- 7. WORKOUT_LOGS (User completion history - "workout_users")
CREATE TABLE public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- 8. FOLLOWS (User follows User)
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- 9. WORKOUT_LIKES (User likes Workout)
CREATE TABLE public.workout_likes (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, workout_id)
);

-- Indexes for performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_section_exercises_section_id ON public.section_exercises(section_id);
CREATE INDEX idx_workout_sections_workout_id ON public.workout_sections(workout_id);
CREATE INDEX idx_exercises_name ON public.exercises(name);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Examples - adjust as needed)

-- Users: Public read, Self update
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Workouts: Public read if is_public, Self read/write
CREATE POLICY "Public workouts are viewable by everyone" ON public.workouts FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for sections/exercises cascade from workout ownership usually, 
-- but for simplicity we'll allow viewing everything for now, restrict writes.
CREATE POLICY "Sections viewable by everyone" ON public.workout_sections FOR SELECT USING (true);
CREATE POLICY "Sections editable by workout owner" ON public.workout_sections FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workouts WHERE id = workout_sections.workout_id AND user_id = auth.uid())
);

CREATE POLICY "Section exercises viewable by everyone" ON public.section_exercises FOR SELECT USING (true);
-- (Complex write policies omitted for brevity, rely on app logic + simple checks)

-- Follows
CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes
CREATE POLICY "Likes viewable by everyone" ON public.workout_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.workout_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.workout_likes FOR DELETE USING (auth.uid() = user_id);

-- AUTOMATIC USER PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.users (id, email, username, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    -- Priorizar username de metadata, sino parte del email
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    -- Priorizar full_name (Google), luego name, luego email
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar fallos si el usuario ya existe
  RETURN new;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid error on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();