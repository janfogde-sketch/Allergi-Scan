-- Invitationssiden (public/invite.html) viser afsenderens fornavn ("Anna har inviteret dig ..."). Kun fornavn, kun for en afventende,
-- ikke-udløbet invitation, og kun til den, der har det hemmelige token. Ingen andre oplysninger om afsenderen returneres.
CREATE OR REPLACE FUNCTION public.get_invite_preview(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite public.family_invites%ROWTYPE;
  v_first  text;
BEGIN
  SELECT * INTO v_invite FROM public.family_invites WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  IF v_invite.status = 'pending' AND v_invite.expires_at > now() THEN
    SELECT nullif(left(split_part(btrim(u.name), ' ', 1), 30), '') INTO v_first
      FROM public.users u WHERE u.id = v_invite.invited_by;
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'status', v_invite.status,
    'expires_at', v_invite.expires_at,
    'invited_by', v_invite.invited_by,
    'inviter_first_name', v_first
  );
END;
$function$;
