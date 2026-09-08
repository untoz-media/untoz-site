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
