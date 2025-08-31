-- STEP 4: Fix profile creation for existing users
-- This ensures all existing auth users have profile entries

-- First, create profiles for any existing users who don't have one
INSERT INTO profiles (id, username)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Update the trigger function to handle duplicate usernames better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Get the base username from metadata or email
  base_username := COALESCE(
    new.raw_user_meta_data->>'username', 
    split_part(new.email, '@', 1)
  );
  
  -- Start with the base username
  final_username := base_username;
  
  -- Check if username exists and append numbers if needed
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  
  -- Insert the profile with unique username
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, final_username)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();