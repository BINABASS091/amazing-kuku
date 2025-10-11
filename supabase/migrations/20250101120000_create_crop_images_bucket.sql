-- Create a storage bucket for crop images
insert into storage.buckets (id, name, public)
values ('crop-images', 'crop-images', true)
on conflict (id) do nothing;

-- Set up RLS policies for the crop-images bucket
create policy "Allow public read access to crop images"
on storage.objects for select
using (bucket_id = 'crop-images');

create policy "Allow authenticated users to upload crop images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'crop-images');

create policy "Allow users to delete their own uploads"
on storage.objects for delete
to authenticated
using (auth.uid() = owner);
