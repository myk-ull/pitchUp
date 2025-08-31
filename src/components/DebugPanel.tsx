import React from 'react';
import { Bell, Zap } from 'lucide-react';
import './DebugPanel.css';

interface DebugPanelProps {
  onTriggerNotification: () => void;
  notificationActive: boolean;
  timeRemaining: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  onTriggerNotification, 
  notificationActive, 
  timeRemaining 
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>🛠️ Debug Panel</h3>
        <span className="debug-hint">Press Ctrl+Shift+D to toggle</span>
      </div>
      
      <div className="debug-content">
        <div className="debug-status">
          <div className="status-item">
            <span className="status-label">Notification Active:</span>
            <span className={`status-value ${notificationActive ? 'active' : 'inactive'}`}>
              {notificationActive ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Time Remaining:</span>
            <span className="status-value">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="debug-actions">
          <button 
            className="debug-btn trigger-btn"
            onClick={onTriggerNotification}
            disabled={notificationActive}
          >
            <Bell size={20} />
            <span>Trigger Notification</span>
          </button>

          <button 
            className="debug-btn"
            onClick={() => window.location.href = '/record'}
            disabled={!notificationActive}
          >
            <Zap size={20} />
            <span>Go to Recording</span>
          </button>
        </div>

        <div className="debug-info">
          <h4>Test Instructions:</h4>
          <ul>
            <li>Click "Trigger Notification" to simulate a Pitch Up notification</li>
            <li>You'll have 2 minutes to record your audio</li>
            <li>Navigate to recording page to test the recording interface</li>
            <li>Test retakes and posting functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;