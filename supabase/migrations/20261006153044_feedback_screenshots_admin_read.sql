-- Admin må læse skærmbilleder i den lukkede bucket (signeret link i adminpanelet).
create policy "feedback_screenshots_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'feedback-screenshots' and public.is_admin((select auth.uid())));
