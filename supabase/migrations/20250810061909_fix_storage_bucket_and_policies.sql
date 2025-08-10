-- First ensure the avatars bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create storage policies for authenticated users
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for all avatars
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'avatars');
