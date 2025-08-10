-- Drop existing policies and recreate with debugging
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatar_view" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;

-- Enable RLS on storage.objects (in case it wasn't enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for debugging
CREATE POLICY "avatar_upload_debug" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatar_view_debug" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatar_update_debug" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatar_delete_debug" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars');

-- Also add public read access
CREATE POLICY "avatar_public_read" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'avatars');
