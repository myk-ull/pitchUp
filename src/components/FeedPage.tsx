import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './FeedPage.css';

interface Pitch {
  id: string;
  user_id: string;
  username: string;
  audio_url: string;
  caption?: string;
  duration_seconds: number;
  is_late: boolean;
  retake_count: number;
  created_at: string;
  likes_count: number;
  has_liked: boolean;
}

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (user) {
      loadPitches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPitches = async () => {
    if (!user) return;

    try {
      // First get friends' IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const friendIds = friendships?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];

      // Include user's own pitches
      friendIds.push(user.id);

      // Get pitches from friends and self
      const { data: pitchesData, error } = await supabase
        .from('pitches')
        .select('*')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading pitches:', error);
        return;
      }

      if (pitchesData) {
        // Get profiles for all users
        const userIds = Array.from(new Set(pitchesData.map(p => p.user_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Get like counts and check if current user has liked
        const pitchIds = pitchesData.map(p => p.id);
        const { data: reactions } = await supabase
          .from('reactions')
          .select('pitch_id, user_id')
          .in('pitch_id', pitchIds)
          .eq('type', 'like');

        const likeCounts = new Map<string, number>();
        const userLikes = new Set<string>();

        reactions?.forEach(r => {
          likeCounts.set(r.pitch_id, (likeCounts.get(r.pitch_id) || 0) + 1);
          if (r.user_id === user.id) {
            userLikes.add(r.pitch_id);
          }
        });

        const formattedPitches: Pitch[] = pitchesData.map(pitch => ({
          ...pitch,
          username: profileMap.get(pitch.user_id)?.username || 'Unknown',
          likes_count: likeCounts.get(pitch.id) || 0,
          has_liked: userLikes.has(pitch.id)
        }));

        setPitches(formattedPitches);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (pitchId: string, audioUrl: string) => {
    // Stop current playing audio
    if (playingId && playingId !== pitchId) {
      const currentAudio = audioRefs.current.get(playingId);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Toggle play/pause for selected pitch
    if (playingId === pitchId) {
      const audio = audioRefs.current.get(pitchId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      let audio = audioRefs.current.get(pitchId);
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.onended = () => setPlayingId(null);
        audioRefs.current.set(pitchId, audio);
      }
      audio.play();
      setPlayingId(pitchId);
    }
  };

  const toggleLike = async (pitchId: string, hasLiked: boolean) => {
    if (!user) return;

    if (hasLiked) {
      // Remove like
      await supabase
        .from('reactions')
        .delete()
        .eq('pitch_id', pitchId)
        .eq('user_id', user.id)
        .eq('type', 'like');
    } else {
      // Add like
      await supabase
        .from('reactions')
        .insert({
          pitch_id: pitchId,
          user_id: user.id,
          type: 'like'
        });
    }

    // Update local state
    setPitches(prev => prev.map(p => {
      if (p.id === pitchId) {
        return {
          ...p,
          has_liked: !hasLiked,
          likes_count: hasLiked ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    // Ensure we're working with UTC time
    const date = new Date(dateString + (dateString.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 0) return 'just now'; // Handle future dates
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="feed-page">
        <div className="feed-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="feed-title">Friends' Pitches</h1>
          <button className="more-btn">
            <MoreHorizontal size={24} />
          </button>
        </div>
        <div className="feed-container">
          <div className="loading-state">Loading pitches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="feed-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="feed-title">Friends' Pitches</h1>
        <button className="more-btn">
          <MoreHorizontal size={24} />
        </button>
      </div>

      <div className="feed-container">
        {pitches.length === 0 ? (
          <div className="empty-feed">
            <p>No pitches yet</p>
            <p className="subtle">Add friends to see their pitches here</p>
            <button className="add-friends-btn" onClick={() => navigate('/friends')}>
              Find Friends
            </button>
          </div>
        ) : (
          <>
            {pitches.map((pitch) => (
              <div key={pitch.id} className="pitch-card fade-in">
                <div className="pitch-header">
                  <div className="user-info">
                    <div className="avatar">
                      {pitch.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <span className="username">{pitch.username}</span>
                      <div className="pitch-meta">
                        <span className="time-ago">{formatTimeAgo(pitch.created_at)}</span>
                        {pitch.is_late && <span className="late-badge">LATE</span>}
                        {pitch.retake_count > 0 && (
                          <span className="retake-badge">🔄 {pitch.retake_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pitch-content">
                  <div className="audio-player">
                    <button 
                      className="play-btn"
                      onClick={() => togglePlay(pitch.id, pitch.audio_url)}
                    >
                      {playingId === pitch.id ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <div className="audio-waveform">
                      <div className={`waveform-progress ${playingId === pitch.id ? 'playing' : ''}`}></div>
                    </div>
                    <span className="duration">{formatDuration(pitch.duration_seconds)}</span>
                  </div>

                  {pitch.caption && (
                    <p className="pitch-caption">{pitch.caption}</p>
                  )}

                  <div className="pitch-actions">
                    <button 
                      className={`action-btn ${pitch.has_liked ? 'liked' : ''}`}
                      onClick={() => toggleLike(pitch.id, pitch.has_liked)}
                    >
                      <Heart size={20} fill={pitch.has_liked ? 'currentColor' : 'none'} />
                      <span>{pitch.likes_count}</span>
                    </button>
                    <button className="action-btn">
                      <MessageCircle size={20} />
                      <span>0</span>
                    </button>
                    <button className="action-btn">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="end-of-feed">
              <p>You've heard all recent pitches</p>
              <p className="subtle">Come back later for more</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedPage;