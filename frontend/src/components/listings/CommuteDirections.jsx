import { useState, useEffect, useRef, useCallback } from 'react';
import { Car, Train, Bike, Footprints, Clock, Navigation, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const modes = [
  { key: 'DRIVING', label: 'Drive', icon: Car },
  { key: 'TRANSIT', label: 'Transit', icon: Train },
  { key: 'BICYCLING', label: 'Bike', icon: Bike },
  { key: 'WALKING', label: 'Walk', icon: Footprints },
];

const CommuteDirections = ({ lat, lng, address }) => {
  const [workAddress, setWorkAddress] = useState(() => localStorage.getItem('dommma_work_address') || '');
  const [mode, setMode] = useState('DRIVING');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [directions, setDirections] = useState(null);
  const mapRef = useRef(null);
  const rendererRef = useRef(null);

  // Initialize map and directions renderer
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    });
    rendererRef.current = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: { strokeColor: '#1A2F3A', strokeWeight: 4 },
    });
  }, [lat, lng]);

  const calculateCommute = useCallback(() => {
    if (!workAddress.trim() || !window.google) return;

    setLoading(true);
    setError('');
    localStorage.setItem('dommma_work_address', workAddress);

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [{ lat, lng }],
        destinations: [workAddress],
        travelMode: window.google.maps.TravelMode[mode],
      },
      (response, status) => {
        setLoading(false);
        if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];
          setResult({
            duration: element.duration.text,
            distance: element.distance.text,
            durationValue: element.duration.value,
          });

          // Also get directions for the route map
          const directionsService = new window.google.maps.DirectionsService();
          directionsService.route(
            {
              origin: { lat, lng },
              destination: workAddress,
              travelMode: window.google.maps.TravelMode[mode],
            },
            (dirResult, dirStatus) => {
              if (dirStatus === 'OK' && rendererRef.current) {
                rendererRef.current.setDirections(dirResult);
                setDirections(dirResult);
              }
            }
          );
        } else {
          setError('Could not calculate route. Try a different address.');
          setResult(null);
        }
      }
    );
  }, [lat, lng, workAddress, mode]);

  const getDurationColor = (seconds) => {
    if (seconds <= 1200) return 'text-green-600 dark:text-green-400'; // <= 20 min
    if (seconds <= 2700) return 'text-yellow-600 dark:text-yellow-400'; // <= 45 min
    return 'text-red-600 dark:text-red-400'; // > 45 min
  };

  return (
    <div className="space-y-4">
      {/* Work Address Input */}
      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
          Your work address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={workAddress}
            onChange={(e) => setWorkAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && calculateCommute()}
            placeholder="Enter your work address..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
          />
          <button
            onClick={calculateCommute}
            disabled={loading || !workAddress.trim()}
            className="px-5 py-3 rounded-xl bg-[#1A2F3A] text-white text-sm font-medium hover:bg-[#2C4A52] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          </button>
        </div>
      </div>

      {/* Transport Mode Selector */}
      <div className="flex gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                mode === m.key
                  ? 'bg-[#1A2F3A] text-white'
                  : 'bg-[#F5F5F0] dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-white/5 text-center">
            <Clock size={20} className={`mx-auto mb-2 ${getDurationColor(result.durationValue)}`} />
            <p className={`text-xl font-bold ${getDurationColor(result.durationValue)}`}>
              {result.duration}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Travel time</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-white/5 text-center">
            <Navigation size={20} className="mx-auto mb-2 text-[#1A2F3A] dark:text-[#C4A962]" />
            <p className="text-xl font-bold text-[#1A2F3A] dark:text-white">{result.distance}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Distance</p>
          </div>
        </motion.div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Mini Route Map */}
      <div
        ref={mapRef}
        className="w-full h-48 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/5"
        style={{ minHeight: '192px' }}
      />
    </div>
  );
};

export default CommuteDirections;
