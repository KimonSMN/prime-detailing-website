alter table public.booking
  add column if not exists reminder_sent_at timestamptz;

create index if not exists booking_reminder_lookup_idx
  on public.booking (preferred_at, created_at)
  where reminder_sent_at is null;