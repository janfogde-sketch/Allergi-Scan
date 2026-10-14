-- Auto-import: husk hvilke stregkoder der er slået op på Open Food Facts uden held,
-- så de samme 50 koder ikke tages hver nat (to do bbec9738, del 1).
alter table public.missing_ean_log add column if not exists last_checked timestamptz;
