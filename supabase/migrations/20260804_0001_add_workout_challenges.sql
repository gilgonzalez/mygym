CREATE TABLE public.workout_challenges (
  workout_id uuid PRIMARY KEY CONSTRAINT workout_challenges_workout_id_fkey REFERENCES public.workouts(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'amrap_section',
  challenge_section_id uuid NOT NULL CONSTRAINT workout_challenges_challenge_section_id_fkey REFERENCES public.sections(id) ON DELETE CASCADE,
  time_cap_seconds integer NOT NULL,
  score_type text NOT NULL DEFAULT 'rounds_plus_reps',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workout_challenges_mode_check CHECK (mode IN ('amrap_section')),
  CONSTRAINT workout_challenges_score_type_check CHECK (score_type IN ('rounds_plus_reps')),
  CONSTRAINT workout_challenges_time_cap_seconds_check CHECK (time_cap_seconds > 0)
);

CREATE TABLE public.workout_challenge_results (
  workout_log_id uuid PRIMARY KEY CONSTRAINT workout_challenge_results_workout_log_id_fkey REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL CONSTRAINT workout_challenge_results_workout_id_fkey REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL CONSTRAINT workout_challenge_results_user_id_fkey REFERENCES public.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'amrap_section',
  rounds_completed integer NOT NULL DEFAULT 0,
  extra_reps integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  time_cap_seconds integer NOT NULL,
  is_pr boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workout_challenge_results_mode_check CHECK (mode IN ('amrap_section')),
  CONSTRAINT workout_challenge_results_rounds_completed_check CHECK (rounds_completed >= 0),
  CONSTRAINT workout_challenge_results_extra_reps_check CHECK (extra_reps >= 0),
  CONSTRAINT workout_challenge_results_score_check CHECK (score >= 0),
  CONSTRAINT workout_challenge_results_time_cap_seconds_check CHECK (time_cap_seconds > 0)
);

CREATE INDEX idx_workout_challenges_challenge_section_id
  ON public.workout_challenges(challenge_section_id);

CREATE INDEX idx_workout_challenge_results_user_workout_created
  ON public.workout_challenge_results(user_id, workout_id, created_at DESC);

CREATE INDEX idx_workout_challenge_results_user_workout_score
  ON public.workout_challenge_results(user_id, workout_id, score DESC);

CREATE TRIGGER on_workout_challenges_updated_at
BEFORE UPDATE ON public.workout_challenges
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workout_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_challenge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workout challenges viewable by everyone" ON public.workout_challenges
FOR SELECT USING (true);

CREATE POLICY "Users manage own workout challenges" ON public.workout_challenges
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_id
      AND w.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_id
      AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users view own workout challenge results" ON public.workout_challenge_results
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own workout challenge results" ON public.workout_challenge_results
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workout challenge results" ON public.workout_challenge_results
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own workout challenge results" ON public.workout_challenge_results
FOR DELETE USING (auth.uid() = user_id);
