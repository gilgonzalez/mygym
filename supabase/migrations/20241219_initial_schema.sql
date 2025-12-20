-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Workouts table
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('cardio', 'strength', 'flexibility', 'mixed')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_category ON workouts(category);
CREATE INDEX idx_workouts_public ON workouts(is_public) WHERE is_public = true;

-- Sections table
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sections_workout_id ON sections(workout_id);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    repetitions INTEGER,
    duration_seconds INTEGER,
    type VARCHAR(50) CHECK (type IN ('repetitions', 'time', 'rest')),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercises_section_id ON exercises(section_id);

-- Followers table
CREATE TABLE followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);

-- Likes table
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, workout_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_workout ON likes(workout_id);

-- Grant permissions
GRANT SELECT ON users TO anon;
GRANT SELECT ON workouts TO anon;
GRANT SELECT ON sections TO anon;
GRANT SELECT ON exercises TO anon;

GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON workouts TO authenticated;
GRANT ALL PRIVILEGES ON sections TO authenticated;
GRANT ALL PRIVILEGES ON exercises TO authenticated;
GRANT ALL PRIVILEGES ON followers TO authenticated;
GRANT ALL PRIVILEGES ON likes TO authenticated;

-- RLS Policies
CREATE POLICY "Public workouts are visible" ON workouts
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own private workouts" ON workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" ON workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON workouts
    FOR DELETE USING (auth.uid() = user_id);