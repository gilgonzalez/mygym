CREATE TABLE IF NOT EXISTS public.workout_likes (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, workout_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_likes_workout
  ON public.workout_likes(workout_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_likes_user
  ON public.workout_likes(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.toggle_workout_like(
  p_workout_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_exists boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_workout_id IS NULL THEN
    RAISE EXCEPTION 'Workout id is required';
  END IF;

  IF NOT public.can_access_workout(p_workout_id, v_user_id) THEN
    RAISE EXCEPTION 'You cannot like this workout';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.workout_likes
    WHERE user_id = v_user_id
      AND workout_id = p_workout_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.workout_likes
    WHERE user_id = v_user_id
      AND workout_id = p_workout_id;
    RETURN false;
  ELSE
    INSERT INTO public.workout_likes (user_id, workout_id)
    VALUES (v_user_id, p_workout_id);
    RETURN true;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_workout_likes_count(
  p_workout_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT COUNT(*)::integer
  FROM public.workout_likes
  WHERE workout_id = p_workout_id;
$function$;

CREATE OR REPLACE FUNCTION public.is_workout_liked_by_user(
  p_workout_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_likes
    WHERE workout_id = p_workout_id
      AND user_id = p_user_id
  );
$function$;

ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own workout likes" ON public.workout_likes;
CREATE POLICY "Users view own workout likes" ON public.workout_likes
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view likes on accessible workouts" ON public.workout_likes;
CREATE POLICY "Users can view likes on accessible workouts" ON public.workout_likes
FOR SELECT USING (public.can_access_workout(workout_id));

DROP POLICY IF EXISTS "Users can insert own workout likes" ON public.workout_likes;
CREATE POLICY "Users can insert own workout likes" ON public.workout_likes
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND public.can_access_workout(workout_id)
);

DROP POLICY IF EXISTS "Users can delete own workout likes" ON public.workout_likes;
CREATE POLICY "Users can delete own workout likes" ON public.workout_likes
FOR DELETE USING (auth.uid() = user_id);
