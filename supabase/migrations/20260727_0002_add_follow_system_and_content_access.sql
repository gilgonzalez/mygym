DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_request_status') THEN
    CREATE TYPE public.follow_request_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status public.follow_request_status NOT NULL DEFAULT 'pending',
  requested_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  responded_at timestamp with time zone,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id <> followed_id),
  CONSTRAINT user_follows_status_timestamps_check CHECK (
    (status = 'pending' AND responded_at IS NULL AND accepted_at IS NULL)
    OR (status = 'accepted' AND responded_at IS NOT NULL AND accepted_at IS NOT NULL)
    OR (status = 'rejected' AND responded_at IS NOT NULL AND accepted_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followed_status
  ON public.user_follows(followed_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_status
  ON public.user_follows(follower_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_pending_inbox
  ON public.user_follows(followed_id, requested_at DESC)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS on_user_follows_updated_at ON public.user_follows;
CREATE TRIGGER on_user_follows_updated_at
BEFORE UPDATE ON public.user_follows
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_follow_accepted(
  p_follower_id uuid,
  p_followed_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_follows uf
    WHERE uf.follower_id = p_follower_id
      AND uf.followed_id = p_followed_id
      AND uf.status = 'accepted'
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_user_content(
  p_owner_id uuid,
  p_visibility text,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT CASE
    WHEN p_owner_id IS NULL THEN false
    WHEN p_viewer_id = p_owner_id THEN true
    WHEN COALESCE(p_visibility, 'private') = 'public' THEN true
    WHEN COALESCE(p_visibility, 'private') = 'followers' THEN public.is_follow_accepted(p_viewer_id, p_owner_id)
    ELSE false
  END;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_workout(
  p_workout_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = p_workout_id
      AND public.can_access_user_content(w.user_id, w.visibility, p_viewer_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_section(
  p_section_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_sections ws
    JOIN public.workouts w ON w.id = ws.workout_id
    WHERE ws.section_id = p_section_id
      AND public.can_access_user_content(w.user_id, w.visibility, p_viewer_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_exercise(
  p_exercise_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.exercises e
    WHERE e.id = p_exercise_id
      AND (
        COALESCE(e.is_public, false) = true
        OR e.user_id = p_viewer_id
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.section_exercises se
    JOIN public.workout_sections ws ON ws.section_id = se.section_id
    JOIN public.workouts w ON w.id = ws.workout_id
    WHERE se.exercise_id = p_exercise_id
      AND public.can_access_user_content(w.user_id, w.visibility, p_viewer_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_tutorial(
  p_tutorial_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.exercise_tutorials et
    WHERE et.id = p_tutorial_id
      AND public.can_access_exercise(et.exercise_id, p_viewer_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_access_media(
  p_media_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.media m
    WHERE m.id = p_media_id
      AND m.user_id = p_viewer_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.exercises e
    WHERE e.thumbnail_media_id = p_media_id
      AND public.can_access_exercise(e.id, p_viewer_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.exercise_tutorials et
    WHERE et.media_id = p_media_id
      AND public.can_access_exercise(et.exercise_id, p_viewer_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.request_follow(
  p_followed_id uuid
)
RETURNS public.user_follows
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_follower_id uuid := auth.uid();
  v_existing public.user_follows;
BEGIN
  IF v_follower_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_followed_id IS NULL THEN
    RAISE EXCEPTION 'Target user is required';
  END IF;

  IF v_follower_id = p_followed_id THEN
    RAISE EXCEPTION 'You cannot follow yourself';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.user_follows
  WHERE follower_id = v_follower_id
    AND followed_id = p_followed_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_follows (
      follower_id,
      followed_id,
      status,
      requested_at,
      responded_at,
      accepted_at
    )
    VALUES (
      v_follower_id,
      p_followed_id,
      'pending',
      timezone('utc'::text, now()),
      NULL,
      NULL
    )
    RETURNING * INTO v_existing;

    RETURN v_existing;
  END IF;

  IF v_existing.status = 'accepted' THEN
    RETURN v_existing;
  END IF;

  UPDATE public.user_follows
  SET
    status = 'pending',
    requested_at = timezone('utc'::text, now()),
    responded_at = NULL,
    accepted_at = NULL
  WHERE follower_id = v_follower_id
    AND followed_id = p_followed_id
  RETURNING * INTO v_existing;

  RETURN v_existing;
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_follow_request(
  p_follower_id uuid
)
RETURNS public.user_follows
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_followed_id uuid := auth.uid();
  v_relationship public.user_follows;
  v_now timestamp with time zone := timezone('utc'::text, now());
BEGIN
  IF v_followed_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_follows
  SET
    status = 'accepted',
    responded_at = v_now,
    accepted_at = v_now
  WHERE follower_id = p_follower_id
    AND followed_id = v_followed_id
    AND status = 'pending'
  RETURNING * INTO v_relationship;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending follow request not found';
  END IF;

  RETURN v_relationship;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_follow_request(
  p_follower_id uuid
)
RETURNS public.user_follows
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_followed_id uuid := auth.uid();
  v_relationship public.user_follows;
BEGIN
  IF v_followed_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.user_follows
  SET
    status = 'rejected',
    responded_at = timezone('utc'::text, now()),
    accepted_at = NULL
  WHERE follower_id = p_follower_id
    AND followed_id = v_followed_id
    AND status = 'pending'
  RETURNING * INTO v_relationship;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending follow request not found';
  END IF;

  RETURN v_relationship;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_follow_request(
  p_followed_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_follower_id uuid := auth.uid();
BEGIN
  IF v_follower_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.user_follows
  WHERE follower_id = v_follower_id
    AND followed_id = p_followed_id
    AND status = 'pending';

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unfollow_user(
  p_followed_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_follower_id uuid := auth.uid();
BEGIN
  IF v_follower_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.user_follows
  WHERE follower_id = v_follower_id
    AND followed_id = p_followed_id
    AND status = 'accepted';

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_follower(
  p_follower_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_followed_id uuid := auth.uid();
BEGIN
  IF v_followed_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.user_follows
  WHERE follower_id = p_follower_id
    AND followed_id = v_followed_id
    AND status = 'accepted';

  RETURN FOUND;
END;
$function$;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own follow relationships" ON public.user_follows;
CREATE POLICY "Users view own follow relationships" ON public.user_follows
FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = followed_id);

DROP POLICY IF EXISTS "Media viewable by everyone" ON public.media;
DROP POLICY IF EXISTS "Exercises viewable if public or owner" ON public.exercises;
DROP POLICY IF EXISTS "Exercise tutorials viewable by everyone" ON public.exercise_tutorials;
DROP POLICY IF EXISTS "Exercise tutorial steps viewable by everyone" ON public.exercise_tutorial_steps;
DROP POLICY IF EXISTS "Sections viewable by everyone" ON public.sections;
DROP POLICY IF EXISTS "Workouts viewable if public or owner" ON public.workouts;
DROP POLICY IF EXISTS "Workout sections viewable by everyone" ON public.workout_sections;
DROP POLICY IF EXISTS "Section exercises viewable by everyone" ON public.section_exercises;
DROP POLICY IF EXISTS "Media viewable if owner or attached to accessible exercise" ON public.media;
DROP POLICY IF EXISTS "Exercises viewable if public, owner or accessible through workout" ON public.exercises;
DROP POLICY IF EXISTS "Exercise tutorials viewable if exercise is accessible" ON public.exercise_tutorials;
DROP POLICY IF EXISTS "Exercise tutorial steps viewable if tutorial is accessible" ON public.exercise_tutorial_steps;
DROP POLICY IF EXISTS "Sections viewable if workout is accessible" ON public.sections;
DROP POLICY IF EXISTS "Workouts viewable if visibility permits" ON public.workouts;
DROP POLICY IF EXISTS "Workout sections viewable if workout is accessible" ON public.workout_sections;
DROP POLICY IF EXISTS "Section exercises viewable if section is accessible" ON public.section_exercises;

CREATE POLICY "Media viewable if owner or attached to accessible exercise" ON public.media
FOR SELECT USING (
  auth.uid() = user_id
  OR public.can_access_media(id)
);

CREATE POLICY "Exercises viewable if public, owner or accessible through workout" ON public.exercises
FOR SELECT USING (
  COALESCE(is_public, false) = true
  OR user_id = auth.uid()
  OR public.can_access_exercise(id)
);

CREATE POLICY "Exercise tutorials viewable if exercise is accessible" ON public.exercise_tutorials
FOR SELECT USING (public.can_access_exercise(exercise_id));

CREATE POLICY "Exercise tutorial steps viewable if tutorial is accessible" ON public.exercise_tutorial_steps
FOR SELECT USING (public.can_access_tutorial(tutorial_id));

CREATE POLICY "Sections viewable if workout is accessible" ON public.sections
FOR SELECT USING (public.can_access_section(id));

CREATE POLICY "Workouts viewable if visibility permits" ON public.workouts
FOR SELECT USING (public.can_access_user_content(user_id, visibility));

CREATE POLICY "Workout sections viewable if workout is accessible" ON public.workout_sections
FOR SELECT USING (public.can_access_workout(workout_id));

CREATE POLICY "Section exercises viewable if section is accessible" ON public.section_exercises
FOR SELECT USING (public.can_access_section(section_id));
