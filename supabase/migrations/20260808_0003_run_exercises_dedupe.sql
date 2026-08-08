-- ============================================================
-- Ejecutar limpieza de duplicados historicos en exercises
-- Invoca el procedimiento public.dedupe_existing_exercises()
-- que:
--   1. Reasigna section_exercises al exercise canonico (mas antiguo)
--   2. Elimina tutoriales y exercises duplicados
--   3. Devuelve un JSON con el resumen de filas afectadas
-- ============================================================

DO $$
DECLARE
  v_summary jsonb;
BEGIN
  v_summary := public.dedupe_existing_exercises();
  RAISE NOTICE 'Dedupe summary: %', v_summary;
END $$;
