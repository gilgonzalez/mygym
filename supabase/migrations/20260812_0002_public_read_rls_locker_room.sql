-- ============================================================
-- POLÍTICAS RLS DE LECTURA PÚBLICA PARA EL LOCKER ROOM
-- ------------------------------------------------------------
-- Problema anterior: las policies de SELECT eran "solo ver mis
-- propios rows" (auth.uid() = user_id). Esto impedía ver los
-- comentarios y AMRAP results de otros usuarios en el panel
-- comunitario "Locker Room".
--
-- Solución: Añadir policies de lectura pública (USING true) para
-- las tablas que alimentan el Locker Room, manteniendo INSERT,
-- UPDATE y DELETE restringidos al propietario.
--
-- NOTA: users ya tenía "Users view profiles" pública, así que solo
--       ajustamos workout_logs y workout_challenge_results.
-- ============================================================

----------------------------------------------------------
-- 1) workout_logs: LECTURA PÚBLICA (comentarios, notas, feeling)
----------------------------------------------------------
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar la policy antigua restrictiva de SELECT
DROP POLICY IF EXISTS "Users view own workout logs" ON public.workout_logs;

-- NUEVA: Cualquiera (anon o authenticated) puede leer TODOS los workout_logs
-- para ver los comentarios y sensaciones de la comunidad.
-- Esto es estándar en cualquier app social de fitness.
CREATE POLICY "Workout logs viewable by everyone for community Locker Room"
  ON public.workout_logs
  FOR SELECT
  USING (true);

-- Las de escritura se mantienen: solo el dueño toca sus logs.
-- "Users create own workout logs" ya existe → no tocar.
-- "Users update own workout logs" ya existe → no tocar.
-- "Users delete own workout logs"  ya existe → no tocar.


----------------------------------------------------------
-- 2) workout_challenge_results: LECTURA PÚBLICA (rankings AMRAP)
----------------------------------------------------------
ALTER TABLE public.workout_challenge_results ENABLE ROW LEVEL SECURITY;

-- Eliminar la policy antigua restrictiva de SELECT
DROP POLICY IF EXISTS "Users view own workout challenge results"
  ON public.workout_challenge_results;

-- NUEVA: Cualquiera puede ver TODOS los challenge results,
-- para mostrar el leaderboard / listado de rondas comunitario
-- en el Locker Room de cada workout AMRAP.
CREATE POLICY "Challenge results viewable by everyone for leaderboard"
  ON public.workout_challenge_results
  FOR SELECT
  USING (true);

-- Se mantienen policies de escritura propias (no tocar):
-- "Users create own workout challenge results" → sigue ok.
