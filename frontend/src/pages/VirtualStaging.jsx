import React, { useState, useEffect } from 'react';
import {
  Wand2, Upload, Image, Loader2, Download, RotateCcw,
  Home, Sofa, ChefHat, Bed, Monitor, Bath
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROOM_ICONS = {
  living_room: Sofa,
  bedroom: Bed,
  kitchen: ChefHat,
  dining_room: Home,
  office: Monitor,
  bathroom: Bath
};

export default function VirtualStaging() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [roomType, setRoomType] = useState('living_room');
  const [style, setStyle] = useState('modern');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [styles, setStyles] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchStyles();
    if (user) fetchHistory();
  }, [user]);

  const fetchStyles = async () => {
    try {
      const res = await axios.get(`${API}/virtual-staging/styles`);
      setStyles(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/virtual-staging/history/${user.id}`);
      setHistory(res.data);
    } catch (e) { console.error(e); }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const stageRoom = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('room_type', roomType);
      formData.append('style', style);
      formData.append('user_id', user?.id || 'guest');
      const res = await axios.post(`${API}/virtual-staging/stage`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setResult(res.data);
      if (user) fetchHistory();
    } catch (e) {
      alert(e.response?.data?.detail || 'Virtual staging failed. Please try again.');
    } finally { setLoading(false); }
  };

  const downloadResult = () => {
    if (!result?.image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.image_base64}`;
    link.download = `staged_${roomType}_${style}.png`;
    link.click();
  };

  if (!user) return null;

  const roomTypes = styles?.room_types || [
    { id: 'living_room', label: 'Living Room' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'dining_room', label: 'Dining Room' },
    { id: 'office', label: 'Home Office' },
    { id: 'bathroom', label: 'Bathroom' }
  ];

  const styleOptions = styles?.styles || [
    { id: 'modern', label: 'Modern' },
    { id: 'traditional', label: 'Traditional' },
    { id: 'contemporary', label: 'Contemporary' },
    { id: 'industrial', label: 'Industrial' },
    { id: 'coastal', label: 'Coastal' },
    { id: 'luxury', label: 'Luxury' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="virtual-staging-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            AI Virtual Staging
          </h1>
          <p className="text-gray-500 mt-1">Transform empty rooms with AI-powered furniture and decor</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload & Config */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
              <Upload size={18} /> Upload Room Photo
            </h2>

            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#1A2F3A] transition-colors mb-4"
              onClick={() => document.getElementById('staging-upload').click()}
              data-testid="upload-area"
            >
              {preview ? (
                <img src={preview} alt="Room" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <div>
                  <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Click to upload an empty room photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                </div>
              )}
              <input
                id="staging-upload"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
                data-testid="file-input"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Room Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {roomTypes.map(r => {
                    const Icon = ROOM_ICONS[r.id] || Home;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRoomType(r.id)}
                        className={`p-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                          roomType === r.id
                            ? 'bg-[#1A2F3A] text-white shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        data-testid={`room-${r.id}`}
                      >
                        <Icon size={16} />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Design Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {styleOptions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                        style === s.id
                          ? 'bg-[#1A2F3A] text-white shadow-md'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                      data-testid={`style-${s.id}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={stageRoom}
                disabled={!file || loading}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-colors"
                data-testid="stage-btn"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Staging room... (up to 60s)
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Stage This Room
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
              <Wand2 size={18} /> Staged Result
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 border-4 border-[#1A2F3A] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">AI is staging your room...</p>
                <p className="text-gray-400 text-xs mt-1">This may take up to 60 seconds</p>
              </div>
            ) : result ? (
              <div>
                <img
                  src={`data:image/png;base64,${result.image_base64}`}
                  alt="Staged room"
                  className="w-full rounded-xl mb-4 shadow-sm"
                  data-testid="staged-image"
                />
                <p className="text-sm text-gray-600 mb-3">{result.message}</p>
                <div className="flex gap-2">
                  <button
                    onClick={downloadResult}
                    className="flex-1 py-2.5 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] flex items-center justify-center gap-2 text-sm font-medium"
                    data-testid="download-btn"
                  >
                    <Download size={16} /> Download
                  </button>
                  <button
                    onClick={() => { setResult(null); setFile(null); setPreview(null); }}
                    className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2 text-sm"
                    data-testid="reset-btn"
                  >
                    <RotateCcw size={16} /> New
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Wand2 size={40} className="mb-3 text-gray-300" />
                <p className="text-sm">Upload a photo and click "Stage This Room"</p>
                <p className="text-xs mt-1">AI will add realistic furniture and decor</p>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-semibold text-[#1A2F3A] mb-4">Recent Stagings</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {history.slice(0, 8).map(h => (
                <div key={h.id} className="p-3 bg-gray-50 rounded-xl text-xs">
                  <p className="font-medium capitalize">{h.room_type?.replace('_', ' ')}</p>
                  <p className="text-gray-500 capitalize">{h.style}</p>
                  <p className="text-gray-400">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
