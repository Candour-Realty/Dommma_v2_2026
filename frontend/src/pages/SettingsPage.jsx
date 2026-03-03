import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, User, Bell, Shield, Globe, Moon, Sun,
  Mail, Phone, Lock, Eye, EyeOff, Save, Check,
  CreditCard, Trash2, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'en'
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_new_listings: true,
    email_messages: true,
    email_applications: true,
    push_enabled: true,
    sms_enabled: false
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profile_visible: true,
    show_phone: false,
    allow_messages: true
  });
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new_password: '',
    confirm: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load user profile
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      language: user.language || 'en'
    });
    
    // Load saved preferences
    loadPreferences();
  }, [user, navigate]);

  const loadPreferences = async () => {
    try {
      const res = await axios.get(`${API}/api/users/${user.id}/preferences`);
      if (res.data) {
        if (res.data.notifications) setNotifications(res.data.notifications);
        if (res.data.privacy) setPrivacy(res.data.privacy);
      }
    } catch (error) {
      console.log('No saved preferences found');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/${user.id}`, {
        name: profile.name,
        phone: profile.phone,
        language: profile.language
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save profile');
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/preferences`, {
        notifications
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save notification preferences');
    }
    setSaving(false);
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/users/${user.id}/preferences`, {
        privacy
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert('Failed to save privacy settings');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, {
        user_id: user.id,
        current_password: passwordForm.current,
        new_password: passwordForm.new_password
      });
      alert('Password changed successfully');
      setPasswordForm({ current: '', new_password: '', confirm: '' });
    } catch (error) {
      alert('Failed to change password: ' + (error.response?.data?.detail || 'Invalid current password'));
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (!confirmed) return;
    
    const doubleConfirm = window.prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') return;
    
    try {
      await axios.delete(`${API}/api/users/${user.id}`);
      logout();
      navigate('/');
    } catch (error) {
      alert('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <Settings className="text-[#1A2F3A]" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1A2F3A] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid={`settings-tab-${tab.id}`}
                  >
                    <tab.icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-[#1A2F3A]">Profile Information</h2>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      data-testid="settings-name-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (604) 555-0123"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                      data-testid="settings-phone-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={profile.language}
                      onChange={e => setProfile({ ...profile, language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                  data-testid="save-profile-btn"
                >
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-[#1A2F3A]">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={16} /> Email Notifications
                  </h3>
                  
                  {[
                    { key: 'email_new_listings', label: 'New listings matching my search' },
                    { key: 'email_messages', label: 'New messages from landlords/renters' },
                    { key: 'email_applications', label: 'Application status updates' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                        className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                      />
                    </label>
                  ))}
                  
                  <h3 className="font-medium text-gray-700 flex items-center gap-2 mt-6">
                    <Bell size={16} /> Push Notifications
                  </h3>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span className="text-sm text-gray-700">Enable push notifications</span>
                    <input
                      type="checkbox"
                      checked={notifications.push_enabled}
                      onChange={e => setNotifications({ ...notifications, push_enabled: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span className="text-sm text-gray-700">SMS notifications (viewing reminders)</span>
                    <input
                      type="checkbox"
                      checked={notifications.sms_enabled}
                      onChange={e => setNotifications({ ...notifications, sms_enabled: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-semibold text-[#1A2F3A]">Privacy Settings</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Profile Visibility</p>
                      <p className="text-sm text-gray-500">Allow others to view your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.profile_visible}
                      onChange={e => setPrivacy({ ...privacy, profile_visible: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Show Phone Number</p>
                      <p className="text-sm text-gray-500">Display phone on your listings/profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.show_phone}
                      onChange={e => setPrivacy({ ...privacy, show_phone: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-700">Allow Messages</p>
                      <p className="text-sm text-gray-500">Let other users send you messages</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.allow_messages}
                      onChange={e => setPrivacy({ ...privacy, allow_messages: e.target.checked })}
                      className="w-5 h-5 text-[#1A2F3A] rounded border-gray-300 focus:ring-[#1A2F3A]"
                    />
                  </label>
                </div>
                
                <button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saved ? <Check size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                  <h2 className="text-xl font-semibold text-[#1A2F3A]">Change Password</h2>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.current}
                          onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-[#1A2F3A] outline-none"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleChangePassword}
                    disabled={saving || !passwordForm.current || !passwordForm.new_password}
                    className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg hover:bg-[#2C4A52] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={18} />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
                
                {/* Danger Zone */}
                <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                  <h2 className="text-xl font-semibold text-red-700 mb-2">Danger Zone</h2>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    data-testid="delete-account-btn"
                  >
                    <Trash2 size={18} />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
