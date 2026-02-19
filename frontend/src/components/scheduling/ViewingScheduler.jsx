import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Check, X, Loader2, 
  ExternalLink, AlertCircle, CalendarCheck
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ViewingScheduler = ({ listing, onClose, onScheduled }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('date'); // date, time, confirm, success
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [error, setError] = useState('');

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Generate next 14 days for selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays (day 0)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  useEffect(() => {
    checkGoogleConnection();
  }, [user]);

  const checkGoogleConnection = async () => {
    if (!user?.id) return;
    setCheckingGoogle(true);
    try {
      const response = await axios.get(`${API}/calendar/google/status/${user.id}`);
      setGoogleConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Google status:', error);
    }
    setCheckingGoogle(false);
  };

  const connectGoogle = async () => {
    const redirectUri = `${window.location.origin}/calendar`;
    try {
      const response = await axios.get(`${API}/calendar/google/auth-url`, {
        params: { redirect_uri: redirectUri, state: user.id }
      });
      window.location.href = response.data.auth_url;
    } catch (error) {
      setError('Failed to connect Google Calendar');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const scheduleViewing = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Create datetime strings
      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      const [hours, minutes] = selectedTime.split(':');
      const endHour = parseInt(hours) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes}`;
      const endDateTime = `${selectedDate}T${endTime}:00`;

      // Create local calendar event
      const eventData = {
        title: `Property Viewing: ${listing.title}`,
        description: `Viewing for ${listing.title}\n\nAddress: ${listing.address}, ${listing.city}\nPrice: $${listing.price?.toLocaleString()}${listing.listing_type === 'sale' ? '' : '/mo'}\n\nNotes: ${notes || 'None'}`,
        location: `${listing.address}, ${listing.city}, ${listing.province}`,
        start_time: startDateTime,
        end_time: endDateTime,
        event_type: 'viewing',
        listing_id: listing.id,
        reminder_minutes: 60
      };

      // Create event in local calendar
      const response = await axios.post(`${API}/calendar/events?user_id=${user.id}`, eventData);

      // If Google Calendar is connected, sync to Google
      if (googleConnected) {
        try {
          await axios.post(`${API}/calendar/google/sync/${response.data.id}?user_id=${user.id}`);
        } catch (syncError) {
          console.error('Google sync error:', syncError);
          // Continue anyway - local event was created
        }
      }

      setStep('success');
      if (onScheduled) onScheduled(response.data);
    } catch (error) {
      console.error('Error scheduling viewing:', error);
      setError(error.response?.data?.detail || 'Failed to schedule viewing. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4" data-testid="viewing-scheduler-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CalendarCheck size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Schedule Viewing
                </h3>
                <p className="text-sm text-white/70">Book a time to see this property</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              data-testid="close-scheduler-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Property Info */}
        <div className="px-6 py-4 bg-[#F5F5F0] border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
              alt={listing.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-[#1A2F3A] text-sm">{listing.title}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={10} /> {listing.address}, {listing.city}
              </p>
              <p className="text-sm font-semibold text-[#1A2F3A] mt-1">
                ${listing.price?.toLocaleString()}{listing.listing_type === 'sale' ? '' : '/mo'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Google Calendar Status */}
          {checkingGoogle ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-[#1A2F3A]" size={24} />
            </div>
          ) : !googleConnected && step !== 'success' ? (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-blue-800">Connect Google Calendar</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Sync your viewings to Google Calendar for reminders
                  </p>
                  <button
                    onClick={connectGoogle}
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    data-testid="connect-google-btn"
                  >
                    <ExternalLink size={14} />
                    Connect Now
                  </button>
                </div>
              </div>
            </div>
          ) : googleConnected && step !== 'success' ? (
            <div className="mb-4 p-3 bg-green-50 rounded-xl flex items-center gap-2">
              <Check className="text-green-500" size={16} />
              <span className="text-sm text-green-700">Google Calendar connected</span>
            </div>
          ) : null}

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Step 1: Select Date */}
          {step === 'date' && (
            <div>
              <h4 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Select Date
              </h4>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {availableDates.map((date, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(date.toISOString().split('T')[0]);
                      setStep('time');
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all hover:border-[#1A2F3A] ${
                      selectedDate === date.toISOString().split('T')[0]
                        ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                        : 'border-gray-200'
                    }`}
                    data-testid={`date-option-${idx}`}
                  >
                    <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="font-semibold text-[#1A2F3A]">{date.getDate()}</p>
                    <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { month: 'short' })}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 'time' && (
            <div>
              <button 
                onClick={() => setStep('date')}
                className="text-sm text-gray-500 hover:text-[#1A2F3A] mb-3"
              >
                ← Back to date selection
              </button>
              <h4 className="font-semibold text-[#1A2F3A] mb-2 flex items-center gap-2">
                <Clock size={16} />
                Select Time for {formatDate(new Date(selectedDate + 'T00:00:00'))}
              </h4>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {timeSlots.map((time, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedTime(time);
                      setStep('confirm');
                    }}
                    className={`p-3 rounded-xl border-2 text-center transition-all hover:border-[#1A2F3A] ${
                      selectedTime === time
                        ? 'border-[#1A2F3A] bg-[#1A2F3A]/5'
                        : 'border-gray-200'
                    }`}
                    data-testid={`time-option-${idx}`}
                  >
                    <p className="font-medium text-[#1A2F3A]">{formatTime(time)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div>
              <button 
                onClick={() => setStep('time')}
                className="text-sm text-gray-500 hover:text-[#1A2F3A] mb-3"
              >
                ← Back to time selection
              </button>
              <h4 className="font-semibold text-[#1A2F3A] mb-4">Confirm Your Viewing</h4>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-xl">
                  <Calendar className="text-[#1A2F3A]" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-[#1A2F3A]">
                      {formatDate(new Date(selectedDate + 'T00:00:00'))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-xl">
                  <Clock className="text-[#1A2F3A]" size={18} />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium text-[#1A2F3A]">{formatTime(selectedTime)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific questions or requests?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none resize-none"
                  rows={3}
                  data-testid="viewing-notes-input"
                />
              </div>

              <button
                onClick={scheduleViewing}
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-medium text-white bg-[#1A2F3A] hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="confirm-viewing-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarCheck size={18} />
                    Confirm Viewing
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-500" size={32} />
              </div>
              <h4 className="font-semibold text-xl text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Viewing Scheduled!
              </h4>
              <p className="text-gray-600 mb-4">
                Your viewing for <span className="font-medium">{listing.title}</span> has been scheduled.
              </p>
              <div className="bg-[#F5F5F0] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-[#1A2F3A]">
                    <Calendar size={14} />
                    {formatDate(new Date(selectedDate + 'T00:00:00'))}
                  </span>
                  <span className="flex items-center gap-2 text-[#1A2F3A]">
                    <Clock size={14} />
                    {formatTime(selectedTime)}
                  </span>
                </div>
                {googleConnected && (
                  <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                    <Check size={12} />
                    Added to your Google Calendar
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-medium text-[#1A2F3A] border-2 border-[#1A2F3A] hover:bg-[#1A2F3A] hover:text-white transition-colors"
                  data-testid="done-btn"
                >
                  Done
                </button>
                <a
                  href="/calendar"
                  className="flex-1 py-3 rounded-xl font-medium text-white bg-[#1A2F3A] hover:bg-[#2C4A52] transition-colors flex items-center justify-center gap-2"
                  data-testid="view-calendar-btn"
                >
                  <Calendar size={16} />
                  View Calendar
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewingScheduler;
