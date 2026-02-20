import React, { useState, useEffect } from 'react';
import { Bell, X, BellRing } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationPrompt = ({ userId, onDismiss }) => {
  const { isSupported, permission, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [enabling, setEnabling] = useState(false);

  // Check if already dismissed in this session
  useEffect(() => {
    const dismissedKey = `notification_prompt_dismissed_${userId}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey);
    if (wasDismissed) {
      setDismissed(true);
    }
  }, [userId]);

  const handleDismiss = () => {
    const dismissedKey = `notification_prompt_dismissed_${userId}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleEnable = async () => {
    setEnabling(true);
    const token = await requestPermission();
    if (token && userId) {
      try {
        // Register token with backend
        await axios.post(`${API}/notifications/register-token`, {
          user_id: userId,
          token: token
        });
        
        // Send a welcome notification
        await axios.post(`${API}/notifications/send`, {
          user_id: userId,
          title: 'Welcome to DOMMMA Notifications!',
          body: "You'll now receive instant updates about messages, offers, and property alerts.",
          notification_type: 'system',
          data: { action: 'welcome' }
        });
      } catch (error) {
        console.error('Failed to register FCM token:', error);
      }
    }
    setEnabling(false);
    setDismissed(true);
  };

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] rounded-2xl p-5 mb-6 relative overflow-hidden"
      data-testid="notification-prompt"
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <BellRing className="w-full h-full" />
      </div>
      
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Bell className="text-white" size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">Stay in the Loop</h3>
          <p className="text-white/80 text-sm">
            Enable push notifications to get instant alerts for new messages, offers, and property updates.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            data-testid="dismiss-prompt-btn"
          >
            Later
          </button>
          <button
            onClick={handleEnable}
            disabled={enabling}
            className="px-5 py-2 bg-white text-[#1A2F3A] rounded-full text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            data-testid="enable-prompt-btn"
          >
            {enabling ? 'Enabling...' : 'Enable'}
          </button>
        </div>
        
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/50 hover:text-white"
          data-testid="close-prompt-btn"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationPrompt;
