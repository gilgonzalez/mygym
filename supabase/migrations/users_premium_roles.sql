DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('ADMIN', 'USER', 'CREATOR', 'COACH');
  END IF;
END
$$;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS "isPremium" boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'USER';
