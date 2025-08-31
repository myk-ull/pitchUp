import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import RecordingPage from './components/RecordingPage';
import FeedPage from './components/FeedPage';
import FriendsPage from './components/FriendsPage';
import Auth from './components/Auth';
import NotificationService from './services/NotificationService';
import PWAService from './services/PWAService';
import EmailNotificationService from './services/EmailNotificationService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { session, loading, user } = useAuth();
  const [notificationActive, setNotificationActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    // Check notification permission status
    const checkNotificationPermission = async () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // Check if email notifications are set up
      const emailNotificationsSetup = localStorage.getItem('emailNotificationsSetup');
      
      if (!('Notification' in window)) {
        // iOS Safari - show email notification option
        if (isIOS && !emailNotificationsSetup) {
          setShowEmailPrompt(true);
        } else {
          // Start scheduling for in-app notifications
          startNotificationScheduling();
        }
      } else if (Notification.permission === 'default') {
        // Show prompt for first-time users
        setShowNotificationPrompt(true);
      } else if (Notification.permission === 'granted') {
        // Permission already granted, start scheduling
        startNotificationScheduling();
      } else if (Notification.permission === 'denied') {
        // Permission denied, offer email as alternative
        if (!emailNotificationsSetup) {
          setShowEmailPrompt(true);
        }
      }
    };

    const startNotificationScheduling = () => {
      // Set up notification callback
      NotificationService.setNotificationCallback(() => {
        setNotificationActive(true);
        setTimeRemaining(120);
        
        // Start countdown timer
        const interval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setNotificationActive(false);
              return 120;
            }
            return prev - 1;
          });
        }, 1000);
      });
      
      // Schedule random notifications
      NotificationService.scheduleRandomNotification();
    };

    if (session) {
      checkNotificationPermission();
      
      // Prompt iOS users to install PWA after 30 seconds
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setTimeout(() => {
          PWAService.promptInstallPWA();
        }, 30000);
      }
      
      // Listen for local notifications from PWA service
      window.addEventListener('localNotification', () => {
        NotificationService.showNotification();
      });
    }
  }, [session]);


  if (loading) {
    return (
      <div className="loading-screen">
        <h1>⚡ Pitch Up</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const handleEnableNotifications = async () => {
    const granted = await NotificationService.requestPermission();
    setShowNotificationPrompt(false);
    localStorage.setItem('notificationPromptShown', 'true');
    
    if (granted) {
      // Start scheduling after permission granted
      NotificationService.setNotificationCallback(() => {
        setNotificationActive(true);
        setTimeRemaining(120);
        
        const interval = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setNotificationActive(false);
              return 120;
            }
            return prev - 1;
          });
        }, 1000);
      });
      
      NotificationService.scheduleRandomNotification();
    } else {
      // If permission denied, show email option
      setShowEmailPrompt(true);
    }
  };
  
  const handleEnableEmailNotifications = async () => {
    if (user?.email) {
      const success = await EmailNotificationService.setupEmailNotifications(
        user.id,
        user.email
      );
      
      if (success) {
        localStorage.setItem('emailNotificationsSetup', 'true');
        setShowEmailPrompt(false);
        
        // Still set up in-app notifications for when user is active
        NotificationService.setNotificationCallback(() => {
          setNotificationActive(true);
          setTimeRemaining(120);
          
          const interval = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                setNotificationActive(false);
                return 120;
              }
              return prev - 1;
            });
          }, 1000);
        });
        
        NotificationService.scheduleRandomNotification();
      }
    }
  };

  return (
    <div className="App">
      {showNotificationPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '20px' }}>⚡ Enable Notifications</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              {!('Notification' in window) ? 
                'Pitch Up will show in-app alerts when it\'s time to record. Keep the app open or add it to your home screen for the best experience!' :
                'Pitch Up sends random notifications throughout the day. Enable notifications to get started with your daily voice pitches!'
              }
            </p>
            <button 
              onClick={handleEnableNotifications}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {!('Notification' in window) ? 'Get Started' : 'Enable Notifications'}
            </button>
            <button 
              onClick={() => setShowNotificationPrompt(false)}
              style={{
                display: 'block',
                margin: '15px auto 0',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
      
      {showEmailPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '20px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '20px' }}>📧 Email Notifications</h2>
            <p style={{ marginBottom: '30px', color: '#666' }}>
              {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 
                'Since you\'re on iOS, we can send you email notifications when it\'s time to Pitch Up!' :
                'We can send you email reminders when it\'s time to record your pitch!'
              }
            </p>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#999' }}>
              We'll use: <strong>{user?.email}</strong>
            </p>
            <button 
              onClick={handleEnableEmailNotifications}
              style={{
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Enable Email Notifications
            </button>
            <button 
              onClick={() => {
                setShowEmailPrompt(false);
                localStorage.setItem('emailNotificationsSetup', 'skipped');
              }}
              style={{
                display: 'block',
                margin: '15px auto 0',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              No thanks, I'll check the app
            </button>
          </div>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<HomePage notificationActive={notificationActive} timeRemaining={timeRemaining} />} />
        <Route path="/record" element={<RecordingPage timeRemaining={timeRemaining} setTimeRemaining={setTimeRemaining} notificationActive={notificationActive} setNotificationActive={setNotificationActive} />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
