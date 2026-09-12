begin;
alter table public.leads add column attachment_path text;
alter table public.leads add column attachment_name text;
alter table public.leads add column attachment_size bigint check(attachment_size>0 and attachment_size<=10485760);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('lead-attachments','lead-attachments',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
-- No object policy grants anonymous access. The admin API issues short-lived links.
commit;
