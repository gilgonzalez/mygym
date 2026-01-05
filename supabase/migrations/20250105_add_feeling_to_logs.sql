-- Add feeling column to workout_logs
ALTER TABLE public.workout_logs 
ADD COLUMN IF NOT EXISTS feeling TEXT CHECK (feeling IN ('sad', 'normal', 'happy', 'pumped', 'tired'));