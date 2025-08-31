import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import RecordingPage from './components/RecordingPage';
import FeedPage from './components/FeedPage';
import FriendsPage from './components/FriendsPage';
import DebugPanel from './components/DebugPanel';
import Auth from './components/Auth';
import NotificationService from './services/NotificationService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { session, loading } = useAuth();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugPanel(!showDebugPanel);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebugPanel]);

  const triggerNotification = () => {
    setNotificationActive(true);
    setTimeRemaining(120);
    NotificationService.showNotification();
  };

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

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage notificationActive={notificationActive} timeRemaining={timeRemaining} />} />
        <Route path="/record" element={<RecordingPage timeRemaining={timeRemaining} setTimeRemaining={setTimeRemaining} notificationActive={notificationActive} setNotificationActive={setNotificationActive} />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {showDebugPanel && (
        <DebugPanel 
          onTriggerNotification={triggerNotification}
          notificationActive={notificationActive}
          timeRemaining={timeRemaining}
        />
      )}
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
