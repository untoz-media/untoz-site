DROP POLICY IF EXISTS "Admins can read audit log" ON public.publish_audit_log;
DROP POLICY IF EXISTS "Staff leads can read audit log" ON public.publish_audit_log;

CREATE POLICY "Staff leads can read audit log"
ON public.publish_audit_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'editor'::app_role)
);

CREATE OR REPLACE FUNCTION public.effective_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'owner' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'editor' THEN 3
    WHEN 'writer' THEN 4
    WHEN 'viewer' THEN 5
    ELSE 6
  END
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.effective_role(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.effective_role(uuid) TO service_role;
