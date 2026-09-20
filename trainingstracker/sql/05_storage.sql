-- ===========================================================================
-- Fortschrittsfotos.
--
-- Privater Eimer, Pfad beginnt mit der Nutzerkennung. Ohne gültige Sitzung ist
-- nichts abrufbar, auch nicht über eine geratene URL — die App holt sich für
-- jede Anzeige eine signierte Adresse mit zwei Minuten Laufzeit.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 20971520,
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fotos_lesen   on storage.objects;
drop policy if exists fotos_legen   on storage.objects;
drop policy if exists fotos_aendern on storage.objects;
drop policy if exists fotos_weg     on storage.objects;

create policy fotos_lesen on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy fotos_legen on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy fotos_aendern on storage.objects for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy fotos_weg on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
