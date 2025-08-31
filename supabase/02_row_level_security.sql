-- STEP 2: Set up Row Level Security (RLS)
-- Run this AFTER creating tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PITCHES POLICIES
-- Users can create their own pitches
CREATE POLICY "Users can create own pitches" 
  ON pitches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own pitches and friends' pitches
CREATE POLICY "View own and friends pitches" 
  ON pitches FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE status = 'accepted' 
      AND (
        (user_id = auth.uid() AND friend_id = pitches.user_id) OR 
        (friend_id = auth.uid() AND user_id = pitches.user_id)
      )
    )
  );

-- Users can delete their own pitches
CREATE POLICY "Users can delete own pitches" 
  ON pitches FOR DELETE 
  USING (auth.uid() = user_id);

-- FRIENDSHIPS POLICIES
-- Users can view their own friendships
CREATE POLICY "Users can view their friendships" 
  ON friendships FOR SELECT 
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can create friendship requests
CREATE POLICY "Users can create friendships" 
  ON friendships FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update friendships they're part of
CREATE POLICY "Users can update friendships" 
  ON friendships FOR UPDATE 
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can delete friendships they initiated
CREATE POLICY "Users can delete friendships" 
  ON friendships FOR DELETE 
  USING (user_id = auth.uid());

-- REACTIONS POLICIES
-- Users can create reactions
CREATE POLICY "Users can create reactions" 
  ON reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can view all reactions on visible pitches
CREATE POLICY "View reactions on visible pitches" 
  ON reactions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM pitches 
      WHERE pitches.id = reactions.pitch_id 
      AND (
        pitches.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM friendships 
          WHERE status = 'accepted' 
          AND (
            (user_id = auth.uid() AND friend_id = pitches.user_id) OR 
            (friend_id = auth.uid() AND user_id = pitches.user_id)
          )
        )
      )
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" 
  ON reactions FOR DELETE 
  USING (auth.uid() = user_id);