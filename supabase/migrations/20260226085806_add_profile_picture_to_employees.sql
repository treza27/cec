/*
  # Add profile picture support for employees

  ## Summary
  Adds profile picture functionality to the employee system.

  ## Changes

  ### Modified Tables
  - `employees`
    - Added `profile_picture_url` (text, nullable): Stores the public URL of the employee's profile picture

  ### New Storage
  - Bucket `avatars`: Public bucket for storing employee profile pictures
    - Max file size: 5MB
    - Allowed types: image/jpeg, image/png, image/webp, image/gif

  ### Security
  - Storage policies for `avatars` bucket:
    - Authenticated users can upload/update their own avatar (path must start with their user_id)
    - Public read access for all avatars (profile pictures are public)
    - Authenticated users can delete their own avatar
*/

-- Add profile_picture_url column to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE employees ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: authenticated users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: authenticated users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: public read access for avatars
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Policy: authenticated users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
