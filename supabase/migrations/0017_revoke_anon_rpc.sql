-- Both functions guard themselves (super-admin / venue-owner checks inside),
-- but anonymous visitors never need to call them. Signed-in callers keep access:
-- AddCasaPropertyModal uses find_user_id_by_email, /api/caption uses increment_ai_credits.
revoke execute on function public.find_user_id_by_email(text) from public, anon;
revoke execute on function public.increment_ai_credits(uuid, int) from public, anon;
grant execute on function public.find_user_id_by_email(text) to authenticated, service_role;
grant execute on function public.increment_ai_credits(uuid, int) to authenticated, service_role;
