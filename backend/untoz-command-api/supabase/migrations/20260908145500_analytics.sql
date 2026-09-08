CREATE TABLE IF NOT EXISTS public.analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL,
  title text,
  content_type text NOT NULL DEFAULT 'page',
  content_slug text,
  category text,
  brand text,
  referrer_host text,
  device text,
  session_hash text
);

CREATE INDEX IF NOT EXISTS analytics_events_occurred_at_idx ON public.analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_path_idx ON public.analytics_events (path);
CREATE INDEX IF NOT EXISTS analytics_events_category_idx ON public.analytics_events (category);
CREATE INDEX IF NOT EXISTS analytics_events_brand_idx ON public.analytics_events (brand);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.analytics_events TO service_role;
REVOKE ALL ON public.analytics_events FROM anon, authenticated;

COMMENT ON TABLE public.analytics_events IS 'Privacy-friendly Untoz pageview events. No raw IP address or persistent user identifier is stored.';

CREATE OR REPLACE FUNCTION public.analytics_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH settings AS (
    SELECT greatest(1, least(coalesce(_days, 30), 90))::integer AS days
  ),
  base AS (
    SELECT e.*
    FROM public.analytics_events e, settings s
    WHERE e.occurred_at >= now() - make_interval(days => s.days)
  ),
  daily AS (
    SELECT occurred_at::date AS day, count(*)::bigint AS views
    FROM base
    GROUP BY occurred_at::date
  ),
  pages AS (
    SELECT path, max(nullif(title, '')) AS title, count(*)::bigint AS views
    FROM base
    GROUP BY path
    ORDER BY views DESC, path
    LIMIT 10
  ),
  categories AS (
    SELECT category, count(*)::bigint AS views
    FROM base
    WHERE nullif(category, '') IS NOT NULL
    GROUP BY category
    ORDER BY views DESC, category
    LIMIT 10
  ),
  brands AS (
    SELECT brand, count(*)::bigint AS views
    FROM base
    WHERE nullif(brand, '') IS NOT NULL
    GROUP BY brand
    ORDER BY views DESC, brand
    LIMIT 10
  ),
  referrers AS (
    SELECT referrer_host, count(*)::bigint AS views
    FROM base
    WHERE nullif(referrer_host, '') IS NOT NULL
    GROUP BY referrer_host
    ORDER BY views DESC, referrer_host
    LIMIT 10
  ),
  devices AS (
    SELECT coalesce(nullif(device, ''), 'other') AS device, count(*)::bigint AS views
    FROM base
    GROUP BY coalesce(nullif(device, ''), 'other')
    ORDER BY views DESC, device
  )
  SELECT jsonb_build_object(
    'period_days', (SELECT days FROM settings),
    'pageviews', (SELECT count(*) FROM base),
    'sessions', (SELECT count(DISTINCT session_hash) FROM base WHERE session_hash IS NOT NULL),
    'today', (SELECT count(*) FROM base WHERE occurred_at >= date_trunc('day', now())),
    'daily', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.day) FROM daily d), '[]'::jsonb),
    'top_pages', coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM pages p), '[]'::jsonb),
    'categories', coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM categories c), '[]'::jsonb),
    'brands', coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM brands b), '[]'::jsonb),
    'referrers', coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM referrers r), '[]'::jsonb),
    'devices', coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM devices d), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.analytics_summary(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO service_role;
