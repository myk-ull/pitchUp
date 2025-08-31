-- STEP 3: Set up Storage for Audio Files
-- Run this in Supabase SQL Editor

-- Create storage bucket for audio pitches
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pitches', 'pitches', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Users can upload their own audio files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'pitches' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all audio files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'pitches');

CREATE POLICY "Users can delete their own audio files" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'pitches' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );