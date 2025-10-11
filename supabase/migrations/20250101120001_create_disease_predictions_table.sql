-- Create disease_predictions table
create table if not exists public.disease_predictions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  crop_name text not null,
  image_url text not null,
  prediction text not null,
  confidence numeric(5,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.disease_predictions enable row level security;

-- Create indexes
create index idx_disease_predictions_user_id on public.disease_predictions(user_id);
create index idx_disease_predictions_created_at on public.disease_predictions(created_at);

-- Create RLS policies
create policy "Allow users to view their own predictions"
on public.disease_predictions
for select
using (auth.uid() = user_id);

create policy "Allow users to insert their own predictions"
on public.disease_predictions
for insert
with check (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_disease_predictions_updated_at
before update on public.disease_predictions
for each row
execute function update_updated_at_column();
