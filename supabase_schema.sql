-- Create the reports table
create table reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  water_level text check (water_level in ('Low', 'Medium', 'High', 'Extreme')),
  description text,
  reporter_name text default 'Anonymous',
  radius integer default 100,
  is_verified boolean default false,
  is_deleted boolean default false
);

-- Enable Realtime for the reports table
alter publication supabase_realtime add table reports;

-- Set up Row Level Security (RLS)
-- Allow anyone to read reports
create policy "Allow public read access" on public.reports
  for select using (true);

-- Allow anyone to insert reports
create policy "Allow public insert access" on public.reports
  for insert with check (true);

-- Allow anyone to update reports
create policy "Allow public update access" on public.reports
  for update using (true) with check (true);

alter table reports enable row level security;

-- Function to auto-delete reports older than 24 hours
create or replace function auto_delete_old_reports()
returns void as $$
begin
  update reports
  set is_deleted = true
  where is_deleted = false
  and created_at < now() - interval '24 hours';
end;
$$ language plpgsql;

-- To run this automatically, enable pg_cron extension in Supabase Dashboard
-- Then run: select cron.schedule('auto-delete-old-reports', '0 * * * *', 'select auto_delete_old_reports()');
-- This runs every hour to clean up old reports
