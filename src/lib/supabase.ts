import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  avatar_url?: string;
  notification_time?: string;
  created_at: string;
};

export type Pitch = {
  id: string;
  user_id: string;
  audio_url: string;
  caption?: string;
  duration_seconds?: number;
  is_late: boolean;
  retake_count: number;
  created_at: string;
  profiles?: Profile;
};

export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
};

export type Reaction = {
  id: string;
  pitch_id: string;
  user_id: string;
  type: 'like' | 'comment';
  content?: string;
  created_at: string;
};