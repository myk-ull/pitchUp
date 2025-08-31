import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Users, Bell, LogOut, Play, Pause } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './HomePage.css';

interface HomePageProps {
  notificationActive: boolean;
  timeRemaining: number;
}

const HomePage: React.FC<HomePageProps> = ({ notificationActive, timeRemaining }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [recentPitches, setRecentPitches] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    if (user) {
      loadRecentPitches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRecentPitches = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('pitches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (data) {
      setRecentPitches(data);
    }
  };

  const togglePlay = (pitchId: string, audioUrl: string) => {
    const currentAudio = audioElements.get(pitchId);
    
    if (playingId === pitchId && currentAudio) {
      currentAudio.pause();
      setPlayingId(null);
    } else {
      // Stop any currently playing audio
      audioElements.forEach((audio, id) => {
        if (id !== pitchId) {
          audio.pause();
        }
      });
      
      if (!currentAudio) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingId(null);
        audioElements.set(pitchId, audio);
        audio.play();
      } else {
        currentAudio.play();
      }
      setPlayingId(pitchId);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="home-page">
      <div className="header">
        <h1 className="app-title">Pitch Up</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/friends')} title="Friends">
            <Users size={24} />
          </button>
          <button className="icon-btn">
            <Bell size={24} />
          </button>
          <button className="icon-btn" onClick={signOut} title="Sign Out">
            <LogOut size={24} />
          </button>
        </div>
      </div>

      <div className="container">
        {notificationActive ? (
          <div className="notification-banner fade-in">
            <div className="notification-icon pulse-animation">
              <Bell size={32} />
            </div>
            <h2>⚡ Time to Pitch Up!</h2>
            <p className="time-remaining">{formatTime(timeRemaining)} remaining</p>
            <button 
              className="record-btn-large"
              onClick={() => navigate('/record')}
            >
              <Mic size={32} />
              <span>Record Your Pitch</span>
            </button>
          </div>
        ) : (
          <div className="waiting-state">
            <div className="empty-state-icon">
              <Mic size={64} />
            </div>
            <h2>Waiting for next Pitch Up...</h2>
            <p>Your notification will arrive at a random time today</p>
            <p className="hint">Press Ctrl+Shift+D to open debug panel</p>
            {user?.email && (
              <p className="user-info">Signed in as: {user.email}</p>
            )}
          </div>
        )}

        <div className="recent-pitches">
          <h3>Your Recent Pitches</h3>
          <div className="pitch-list">
            {recentPitches.length === 0 ? (
              <div className="empty-pitches">
                <p>No pitches yet. Wait for your notification!</p>
              </div>
            ) : (
              recentPitches.map((pitch) => (
                <div key={pitch.id} className="pitch-item">
                  <button 
                    className="pitch-play-btn"
                    onClick={() => togglePlay(pitch.id, pitch.audio_url)}
                  >
                    {playingId === pitch.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <div className="pitch-info">
                    <div className="pitch-date">
                      {formatTimeAgo(pitch.created_at)}
                    </div>
                    {pitch.caption && (
                      <div className="pitch-caption">{pitch.caption}</div>
                    )}
                  </div>
                  <div className="pitch-duration">
                    {Math.floor(pitch.duration_seconds / 60)}:{(pitch.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button 
          className="feed-btn"
          onClick={() => navigate('/feed')}
        >
          <Users size={20} />
          <span>View Friends' Pitches</span>
        </button>
      </div>
    </div>
  );
};

export default HomePage;