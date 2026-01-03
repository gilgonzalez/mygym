-- Enable RLS for workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Policies for workout_logs
CREATE POLICY "Users can view own workout logs"
ON public.workout_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
ON public.workout_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
ON public.workout_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
ON public.workout_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS for user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users can view own stats"
ON public.user_stats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.user_stats
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
ON public.user_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);