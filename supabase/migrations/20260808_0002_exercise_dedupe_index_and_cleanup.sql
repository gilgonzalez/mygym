-- ============================================================
-- Optimizacion de rendimiento para busqueda por nombre normalizado
-- y script opcional para limpiar ejercicios duplicados ya existentes.
--
-- Normalizacion robusta (sin depender de extension unaccent en search_path)
-- ============================================================

CREATE OR REPLACE FUNCTION public._unaccent_letters(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT TRANSLATE(
    COALESCE(p_text, ''),
    'áàâäãåÁÀÂÄÃÅéèêëÉÈÊËíìîïÍÌÎÏóòôöõøÓÒÔÖÕØúùûüÚÙÛÜñÑçÇ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIooooooOOOOOOuuuuUUUUnNcC'
  );
$function$;

CREATE OR REPLACE FUNCTION public.normalize_exercise_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT REGEXP_REPLACE(
           LOWER(TRIM(public._unaccent_letters(p_name))),
           '\s+', ' ', 'g'
         );
$function$;

-- Indice sobre nombre normalizado (funcional) para acelerar busquedas
CREATE INDEX IF NOT EXISTS idx_exercises_normalized_name
  ON public.exercises (public.normalize_exercise_name(name));

CREATE INDEX IF NOT EXISTS idx_exercises_is_public
  ON public.exercises (is_public) WHERE is_public = true;

-- ============================================================
-- Procedimiento almacenado opcional: limpiar duplicados historicos
-- USO (una sola vez, opcional):
--   SELECT public.dedupe_existing_exercises();
--
-- Regla:
--  - Agrupa exercises por (normalize_exercise_name(name), user_id)
--    cuando user_id NO es nulo (ejercicios privados del usuario)
--  - Agrupa exercises por (normalize_exercise_name(name))
--    cuando is_public = true (ejercicios catalogo/publicos)
--  - Se queda con el exercise mas antiguo (menor created_at, menor id)
--  - Actualiza todas las referencias en section_exercises y exercise_tutorials
--    para apuntar al canonico, y elimina los duplicados.
-- ============================================================
CREATE OR REPLACE FUNCTION public.dedupe_existing_exercises()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_canon_id uuid;
  v_dup_id uuid;
  v_total_reassigned int := 0;
  v_total_deleted int := 0;
  v_affected int;
  v_group record;
  v_dups_cursor refcursor;
BEGIN

  -- ---------------------------------------------------------------
  -- Grupo 1: ejercicios privados del mismo usuario con nombres iguales
  -- ---------------------------------------------------------------
  FOR v_group IN
    SELECT user_id, public.normalize_exercise_name(name) AS nname
    FROM public.exercises
    WHERE user_id IS NOT NULL
    GROUP BY user_id, public.normalize_exercise_name(name)
    HAVING count(*) > 1
  LOOP
    SELECT id INTO v_canon_id
    FROM public.exercises
    WHERE user_id = v_group.user_id
      AND public.normalize_exercise_name(name) = v_group.nname
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    OPEN v_dups_cursor FOR
      SELECT id
      FROM public.exercises
      WHERE user_id = v_group.user_id
        AND public.normalize_exercise_name(name) = v_group.nname
        AND id <> v_canon_id
      ORDER BY created_at DESC;

    LOOP
      FETCH v_dups_cursor INTO v_dup_id;
      EXIT WHEN NOT FOUND;

      UPDATE public.section_exercises
      SET exercise_id = v_canon_id
      WHERE exercise_id = v_dup_id;
      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_reassigned := v_total_reassigned + v_affected;

      DELETE FROM public.exercise_tutorials
      WHERE exercise_id = v_dup_id;

      DELETE FROM public.exercises WHERE id = v_dup_id;
      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_deleted := v_total_deleted + v_affected;
    END LOOP;

    CLOSE v_dups_cursor;
  END LOOP;

  -- ---------------------------------------------------------------
  -- Grupo 2: ejercicios publicos (is_public=true) con nombres iguales
  -- (independientemente de user_id -> catalogo)
  -- ---------------------------------------------------------------
  FOR v_group IN
    SELECT public.normalize_exercise_name(name) AS nname
    FROM public.exercises
    WHERE is_public = true
    GROUP BY public.normalize_exercise_name(name)
    HAVING count(*) > 1
  LOOP
    SELECT id INTO v_canon_id
    FROM public.exercises
    WHERE is_public = true
      AND public.normalize_exercise_name(name) = v_group.nname
    ORDER BY created_at ASC, id ASC
    LIMIT 1;

    OPEN v_dups_cursor FOR
      SELECT id
      FROM public.exercises
      WHERE is_public = true
        AND public.normalize_exercise_name(name) = v_group.nname
        AND id <> v_canon_id
      ORDER BY created_at DESC;

    LOOP
      FETCH v_dups_cursor INTO v_dup_id;
      EXIT WHEN NOT FOUND;

      UPDATE public.section_exercises
      SET exercise_id = v_canon_id
      WHERE exercise_id = v_dup_id;
      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_reassigned := v_total_reassigned + v_affected;

      DELETE FROM public.exercise_tutorials
      WHERE exercise_id = v_dup_id;

      DELETE FROM public.exercises WHERE id = v_dup_id;
      GET DIAGNOSTICS v_affected = ROW_COUNT;
      v_total_deleted := v_total_deleted + v_affected;
    END LOOP;

    CLOSE v_dups_cursor;
  END LOOP;

  RETURN jsonb_build_object(
    'section_exercises_reassigned', v_total_reassigned,
    'duplicate_exercises_deleted', v_total_deleted
  );
END;
$function$;
