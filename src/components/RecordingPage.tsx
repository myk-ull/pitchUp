import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, RotateCcw, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './RecordingPage.css';

interface RecordingPageProps {
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  notificationActive: boolean;
  setNotificationActive: (active: boolean) => void;
}

const RecordingPage: React.FC<RecordingPageProps> = ({ 
  timeRemaining, 
  setTimeRemaining, 
  notificationActive,
  setNotificationActive 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [retakeCount, setRetakeCount] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [caption, setCaption] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (notificationActive && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setNotificationActive(false);
      navigate('/');
    }
  }, [timeRemaining, notificationActive, setTimeRemaining, setNotificationActive, navigate]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        // Create a stable URL for the audio
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access to record your pitch');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retake = () => {
    // Clean up old audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRetakeCount(retakeCount + 1);
    setRecordingTime(0);
  };

  const postPitch = async () => {
    if (!audioBlob || !user) return;
    
    setIsPosting(true);
    
    try {
      // Upload audio to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('pitches')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pitches')
        .getPublicUrl(fileName);
      
      // Save pitch to database
      const { error: dbError } = await supabase
        .from('pitches')
        .insert({
          user_id: user.id,
          audio_url: urlData.publicUrl,
          caption: caption || null,
          duration_seconds: recordingTime,
          is_late: timeRemaining < 60,
          retake_count: retakeCount
        });
      
      if (dbError) throw dbError;
      
      setNotificationActive(false);
      navigate('/feed');
    } catch (error) {
      console.error('Error posting pitch:', error);
      alert('Failed to post pitch. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recording-page">
      <div className="recording-header">
        <button className="close-btn" onClick={() => navigate('/')}>
          <X size={24} />
        </button>
        <div className="timer-display">
          <span className="timer-label">Time Remaining</span>
          <span className={`timer-value ${timeRemaining < 30 ? 'urgent' : ''}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="recording-content">
        <h1 className="recording-title">⚡ Time to Pitch Up!</h1>
        <p className="recording-subtitle">2 minutes to capture your voice</p>

        <div className="recording-visualization">
          {isRecording && (
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span>Recording...</span>
            </div>
          )}
          <div className="waveform-container">
            <div className={`waveform ${isRecording ? 'active' : ''}`}>
              {[...Array(20)].map((_, i) => (
                <div key={i} className="wave-bar"></div>
              ))}
            </div>
          </div>
          <div className="recording-time">{formatTime(recordingTime)}</div>
        </div>

        {!audioBlob ? (
          <div className="recording-controls">
            {!isRecording ? (
              <button className="record-btn" onClick={startRecording}>
                <Mic size={48} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button className="stop-btn" onClick={stopRecording}>
                <MicOff size={48} />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
        ) : (
          <div className="preview-controls">
            <audio controls src={audioUrl || ''} className="audio-preview" />
            
            <input
              type="text"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="caption-input"
              maxLength={100}
            />
            
            <div className="action-buttons">
              <button className="retake-btn" onClick={retake} disabled={isPosting}>
                <RotateCcw size={20} />
                <span>Retake {retakeCount > 0 && `(${retakeCount})`}</span>
              </button>
              <button className="post-btn" onClick={postPitch} disabled={isPosting}>
                <Send size={20} />
                <span>{isPosting ? 'Posting...' : 'Post Pitch'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="recording-info">
          <p>Max duration: 60 seconds</p>
          {retakeCount > 0 && (
            <p className="retake-info">Retakes: {retakeCount}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingPage;