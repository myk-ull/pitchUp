-- STEP 1: Create Tables for Pitch Up
-- Run this in Supabase SQL Editor

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  notification_time TIME DEFAULT '10:00:00',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pitches table (audio recordings)
CREATE TABLE IF NOT EXISTS pitches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  audio_url TEXT NOT NULL,
  caption TEXT,
  duration_seconds INTEGER,
  is_late BOOLEAN DEFAULT false,
  retake_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  friend_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create reactions table (likes and comments)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('like', 'comment')),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pitches_user_id ON pitches(user_id);
CREATE INDEX IF NOT EXISTS idx_pitches_created_at ON pitches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_reactions_pitch_id ON reactions(pitch_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);