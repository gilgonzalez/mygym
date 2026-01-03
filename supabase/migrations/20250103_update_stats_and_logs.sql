-- 1. Add missing columns to workout_logs
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS xp_earned INTEGER DEFAULT 0;

-- 2. Add attributes column to user_stats for RPG stats
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{"strength": 0, "agility": 0, "endurance": 0, "wisdom": 0}'::jsonb;

-- 3. Update RPC Function to handle attributes and new columns
CREATE OR REPLACE FUNCTION public.complete_workout_session(
    p_user_id UUID,
    p_workout_id UUID,
    p_duration_minutes INTEGER,
    p_xp_earned INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stats public.user_stats%ROWTYPE;
    v_new_streak INTEGER;
    v_last_activity DATE;
    v_today DATE := CURRENT_DATE;
    v_level_up BOOLEAN := FALSE;
    v_workout_tags TEXT[];
    v_new_attributes JSONB;
    v_strength_gain INTEGER := 0;
    v_agility_gain INTEGER := 0;
    v_endurance_gain INTEGER := 0;
    v_wisdom_gain INTEGER := 0;
BEGIN
    -- 1. Get workout tags to determine attribute gains
    SELECT tags INTO v_workout_tags FROM public.workouts WHERE id = p_workout_id;
    
    -- Simple logic for attribute gains based on tags
    -- In a real app, this could be more complex or passed from client
    IF v_workout_tags IS NOT NULL THEN
        IF 'Strength' = ANY(v_workout_tags) OR 'Barbell' = ANY(v_workout_tags) OR 'Dumbbell' = ANY(v_workout_tags) THEN
            v_strength_gain := 2;
        END IF;
        IF 'Cardio' = ANY(v_workout_tags) OR 'HIIT' = ANY(v_workout_tags) OR 'Run' = ANY(v_workout_tags) THEN
            v_endurance_gain := 2;
        END IF;
        IF 'Yoga' = ANY(v_workout_tags) OR 'Mobility' = ANY(v_workout_tags) THEN
            v_agility_gain := 2;
            v_wisdom_gain := 1;
        END IF;
    END IF;
    
    -- Fallback if no specific tags match or to ensure some progress
    IF v_strength_gain = 0 AND v_agility_gain = 0 AND v_endurance_gain = 0 AND v_wisdom_gain = 0 THEN
        v_endurance_gain := 1;
        v_strength_gain := 1;
    END IF;

    -- 2. Log the workout
    INSERT INTO public.workout_logs (user_id, workout_id, completed_at, duration_seconds, xp_earned)
    VALUES (p_user_id, p_workout_id, timezone('utc'::text, now()), p_duration_minutes * 60, p_xp_earned);

    -- 3. Get current stats
    SELECT * INTO v_current_stats FROM public.user_stats WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        INSERT INTO public.user_stats (user_id) VALUES (p_user_id) RETURNING * INTO v_current_stats;
    END IF;

    -- Initialize attributes if null
    IF v_current_stats.attributes IS NULL THEN
        v_current_stats.attributes := '{"strength": 0, "agility": 0, "endurance": 0, "wisdom": 0}'::jsonb;
    END IF;

    -- 4. Calculate Streak
    IF v_current_stats.last_activity_date IS NULL THEN
        v_new_streak := 1;
    ELSE
        v_last_activity := v_current_stats.last_activity_date::DATE;
        
        IF v_last_activity = v_today THEN
            v_new_streak := v_current_stats.streak_current; 
        ELSIF v_last_activity = v_today - 1 THEN
            v_new_streak := v_current_stats.streak_current + 1; 
        ELSE
            v_new_streak := 1; 
        END IF;
    END IF;

    -- 5. Update Stats (XP, Level, Totals, Attributes)
    v_current_stats.current_xp := v_current_stats.current_xp + p_xp_earned;
    v_current_stats.total_workouts := v_current_stats.total_workouts + 1;
    v_current_stats.total_minutes := v_current_stats.total_minutes + p_duration_minutes;
    v_current_stats.streak_current := v_new_streak;
    v_current_stats.last_activity_date := timezone('utc'::text, now());
    
    IF v_new_streak > v_current_stats.streak_longest THEN
        v_current_stats.streak_longest := v_new_streak;
    END IF;

    -- Update Attributes JSONB
    v_new_attributes := jsonb_build_object(
        'strength', (v_current_stats.attributes->>'strength')::int + v_strength_gain,
        'agility', (v_current_stats.attributes->>'agility')::int + v_agility_gain,
        'endurance', (v_current_stats.attributes->>'endurance')::int + v_endurance_gain,
        'wisdom', (v_current_stats.attributes->>'wisdom')::int + v_wisdom_gain
    );

    -- Level Up Logic
    WHILE v_current_stats.current_xp >= v_current_stats.next_level_xp LOOP
        v_current_stats.current_xp := v_current_stats.current_xp - v_current_stats.next_level_xp;
        v_current_stats.level := v_current_stats.level + 1;
        v_current_stats.next_level_xp := floor(v_current_stats.next_level_xp * 1.2);
        v_level_up := TRUE;
    END LOOP;

    -- Update the record
    UPDATE public.user_stats
    SET 
        level = v_current_stats.level,
        current_xp = v_current_stats.current_xp,
        next_level_xp = v_current_stats.next_level_xp,
        streak_current = v_current_stats.streak_current,
        streak_longest = v_current_stats.streak_longest,
        last_activity_date = v_current_stats.last_activity_date,
        total_workouts = v_current_stats.total_workouts,
        total_minutes = v_current_stats.total_minutes,
        attributes = v_new_attributes,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'level', v_current_stats.level,
        'xp_earned', p_xp_earned,
        'level_up', v_level_up,
        'new_streak', v_new_streak,
        'attributes_gained', jsonb_build_object(
            'strength', v_strength_gain,
            'agility', v_agility_gain,
            'endurance', v_endurance_gain,
            'wisdom', v_wisdom_gain
        )
    );
END;
$$;