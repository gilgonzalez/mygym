ALTER TABLE public.exercise_tutorials
ALTER COLUMN media_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_exercise_tutorial(
  p_exercise_id uuid,
  p_user_id uuid,
  p_tutorial_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_tutorial_id uuid;
  v_step jsonb;
  v_step_order int := 0;
  v_tutorial_media_id uuid;
  v_has_steps boolean := false;
BEGIN
  DELETE FROM public.exercise_tutorials
  WHERE exercise_id = p_exercise_id;

  IF p_tutorial_data IS NULL THEN
    RETURN;
  END IF;

  v_tutorial_media_id := NULLIF(p_tutorial_data->>'media_id', '')::uuid;

  IF v_tutorial_media_id IS NULL AND NULLIF(p_tutorial_data->>'media_url', '') IS NOT NULL THEN
    INSERT INTO public.media (user_id, url, type, mime_type, filename, bucket_path)
    VALUES (
      p_user_id,
      p_tutorial_data->>'media_url',
      CASE
        WHEN COALESCE(p_tutorial_data->>'media_type', '') = 'audio' THEN 'audio'
        WHEN COALESCE(p_tutorial_data->>'media_type', '') = 'video' THEN 'video'
        ELSE 'image'
      END,
      'application/octet-stream',
      p_tutorial_data->>'filename',
      p_tutorial_data->>'bucket_path'
    )
    RETURNING id INTO v_tutorial_media_id;
  END IF;

  IF jsonb_typeof(COALESCE(p_tutorial_data->'steps', '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_tutorial_data->'steps', '[]'::jsonb)) > 0 THEN
    v_has_steps := true;
  END IF;

  IF v_tutorial_media_id IS NULL AND NOT v_has_steps THEN
    RETURN;
  END IF;

  INSERT INTO public.exercise_tutorials (exercise_id, media_id)
  VALUES (p_exercise_id, v_tutorial_media_id)
  RETURNING id INTO v_tutorial_id;

  FOR v_step IN SELECT * FROM jsonb_array_elements(COALESCE(p_tutorial_data->'steps', '[]'::jsonb))
  LOOP
    IF COALESCE(trim(v_step->>'title'), '') = '' OR COALESCE(trim(v_step->>'description'), '') = '' THEN
      RAISE EXCEPTION 'Tutorial steps require title and description';
    END IF;

    INSERT INTO public.exercise_tutorial_steps (tutorial_id, order_index, title, description)
    VALUES (
      v_tutorial_id,
      v_step_order,
      v_step->>'title',
      v_step->>'description'
    );

    v_step_order := v_step_order + 1;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.exercise_tutorial_matches(
  p_exercise_id uuid,
  p_tutorial_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  v_existing_media_id text;
  v_existing_media_url text;
  v_incoming_media_id text;
  v_incoming_media_url text;
  v_existing_steps jsonb;
  v_incoming_steps jsonb;
  v_incoming_has_content boolean;
BEGIN
  IF p_tutorial_data IS NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.exercise_tutorials
      WHERE exercise_id = p_exercise_id
    );
  END IF;

  v_incoming_media_id := NULLIF(p_tutorial_data->>'media_id', '');
  v_incoming_media_url := NULLIF(p_tutorial_data->>'media_url', '');

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'title', COALESCE(step->>'title', ''),
        'description', COALESCE(step->>'description', '')
      )
      ORDER BY ordinality
    ),
    '[]'::jsonb
  )
  INTO v_incoming_steps
  FROM jsonb_array_elements(COALESCE(p_tutorial_data->'steps', '[]'::jsonb)) WITH ORDINALITY AS arr(step, ordinality);

  v_incoming_has_content := (
    v_incoming_media_id IS NOT NULL
    OR v_incoming_media_url IS NOT NULL
    OR COALESCE(jsonb_array_length(v_incoming_steps), 0) > 0
  );

  IF NOT v_incoming_has_content THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.exercise_tutorials
      WHERE exercise_id = p_exercise_id
    );
  END IF;

  SELECT
    et.media_id::text,
    m.url,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'title', ets.title,
          'description', ets.description
        )
        ORDER BY ets.order_index
      ) FILTER (WHERE ets.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_existing_media_id, v_existing_media_url, v_existing_steps
  FROM public.exercise_tutorials et
  LEFT JOIN public.media m ON m.id = et.media_id
  LEFT JOIN public.exercise_tutorial_steps ets ON ets.tutorial_id = et.id
  WHERE et.exercise_id = p_exercise_id
  GROUP BY et.id, et.media_id, m.url;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF COALESCE(v_existing_steps, '[]'::jsonb) <> COALESCE(v_incoming_steps, '[]'::jsonb) THEN
    RETURN false;
  END IF;

  IF COALESCE(v_incoming_media_id, '') = COALESCE(v_existing_media_id, '')
     AND COALESCE(v_incoming_media_url, '') = COALESCE(v_existing_media_url, '') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
