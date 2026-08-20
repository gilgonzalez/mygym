-- Perfil enriquecido (tab "Cuenta" del perfil mobile, ver
-- apps/mobile/src/components/profile/AccountTab.tsx): bio ya existía;
-- sumamos fecha de nacimiento (la edad se deriva en el cliente, no hace
-- falta guardarla), altura, metas/objetivos (unificados en un solo array de
-- tags: son el mismo concepto en la práctica) y logros en texto libre.
--
-- El peso necesita historial ("llevar registro" pidió el producto), así que
-- va en su propia tabla de series de tiempo en vez de una columna en users
-- que se pisaría en cada actualización.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS achievements text;

CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL CONSTRAINT weight_logs_user_id_fkey REFERENCES public.users(id) ON DELETE CASCADE,
  weight_kg numeric(5,2) NOT NULL,
  logged_at date NOT NULL DEFAULT current_date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- DESC porque siempre se lee "los últimos N registros" (última pesada +
-- historial reciente para el sparkline), igual que idx_workout_logs_user_id.
CREATE INDEX idx_weight_logs_user_id ON public.weight_logs(user_id, logged_at DESC);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own weight logs" ON public.weight_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own weight logs" ON public.weight_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sin UPDATE a propósito: un registro de peso es un dato puntual del día,
-- igual que un workout_log. Si el usuario se equivocó, borra y crea uno
-- nuevo en vez de editar el histórico.
CREATE POLICY "Users delete own weight logs" ON public.weight_logs
FOR DELETE USING (auth.uid() = user_id);

-- Nota sobre rachas (streak_current/streak_longest/last_activity_date en
-- user_stats): la lógica de escritura ya es correcta y atómica —
-- complete_workout_session() (20260702_0002_workout_functions.sql) la
-- actualiza server-side en cada workout completado. Lo que faltaba era la
-- lectura: streak_current queda "congelado" si el usuario deja de entrenar
-- (nunca se resetea a 0 solo, recién se corrige la próxima vez que loguea
-- un workout). En vez de un cron/trigger para "romper" la racha a medianoche
-- server-side, se resuelve como valor derivado en el cliente — ver
-- computeEffectiveStreak en packages/shared/src/streak.ts, usado por
-- fetchUserProfile (apps/mobile/src/lib/profile.ts). No necesita cambios de
-- esquema: last_activity_date ya alcanza para decidir si la racha sigue viva.
