-- Sletter de gamle backup-tabeller fra datarettelser (Jans ja 14. okt. 2026, to do "Opryd backup-tabeller fra datarettelser").
-- Beholdes: removed_image_backup_20261005, products_allergen_backup_20261006/20261007/20261007b, products_unknown_flags_backup_20261007,
-- base64_image_backup_20261006, diæt-backups (til 12. nov.), nyere backups og billed-erstatningens hjælpetabeller.
drop table if exists public.products_backup;
drop table if exists public.knowledge_base_backup_20260930;
drop table if exists public.products_kj_backup_20260930;
drop table if exists public.products_allergen_backup_20260930;
drop table if exists public.recipes_title_backup_20260930;
drop table if exists public.allergen_flags_fix_20261002;
drop table if exists qa_backup.products_allergen_fix_20260929;
drop table if exists qa_backup.products_corrupt_nemlig_20260929;
drop schema if exists qa_backup;

insert into public.admin_todo_comments (todo_id, body)
select t.id, 'Slettet 14. okt. 2026 (Jans ja): products_backup, knowledge_base_backup_20260930, products_kj_backup_20260930, products_allergen_backup_20260930, recipes_title_backup_20260930, allergen_flags_fix_20261002 og skemaet qa_backup. Beholdt: removed_image_backup_20261005, de aftalte allergen-/flag-/billed-backups, diæt-backups til 12. nov. og nyere backups.'
  from public.admin_todos t
 where t.id::text like 'c188223c%'
   and not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Slettet 14. okt. 2026 (Jans ja)%');

update public.admin_todos set status = 'done' where id::text like 'c188223c%' and status <> 'done';
