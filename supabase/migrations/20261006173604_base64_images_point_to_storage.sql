-- De seks fotos er kopieret til Storage og kontrolleret byte-for-byte; sikkerhedskopien ligger i base64_image_backup_20261006.
update public.feedback_tickets
set image_path = id::text || '.jpg', image_base64 = null
where image_base64 is not null
  and id in ('1933d9ca-110b-45ff-9248-3fad1fabc622','6fd3aa9c-1c7b-4fdf-a411-7431b916ed8a','d88f27a8-0c30-4eb5-815e-f62e41baf34f','12503211-8edd-4eb8-87e5-3e51f52dc46b','4cff768b-1168-4d29-b151-24e3baed866a');

update public.submissions
set raw_label_image = 'https://jegrpcflyguadyxialkm.supabase.co/storage/v1/object/public/product-images/labels/migrated_' || id::text || '_label.jpg'
where id = '3ea10c46-dc42-47a0-af87-aee05478a9fb' and raw_label_image not like 'http%';
