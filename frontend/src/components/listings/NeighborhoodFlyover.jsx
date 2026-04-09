import { useState, useEffect, useRef } from 'react';
import { Play, Pause, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const NeighborhoodFlyover = ({ lat, lng, title }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const intervalRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [heading, setHeading] = useState(0);

  // Initialize the satellite map with tilt
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 18,
      mapTypeId: 'hybrid',
      tilt: 45,
      heading: 0,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    });

    // Add marker for the listing
    new window.google.maps.Marker({
      position: { lat, lng },
      map,
      title: title || 'Property Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#C4A962',
        fillOpacity: 1,
        strokeColor: '#1A2F3A',
        strokeWeight: 3,
      },
    });

    mapInstanceRef.current = map;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lat, lng, title]);

  // Handle rotation
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setHeading((prev) => {
          const next = (prev + 0.5) % 360;
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setHeading(next);
          }
          return next;
        });
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  const handleSliderChange = (e) => {
    const newHeading = parseFloat(e.target.value);
    setHeading(newHeading);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setHeading(newHeading);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/5"
        style={{ minHeight: '256px' }}
      />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setPlaying(!playing)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            playing
              ? 'bg-red-500 text-white'
              : 'bg-[#1A2F3A] text-white'
          }`}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </motion.button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={heading}
            onChange={handleSliderChange}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #1A2F3A ${(heading / 360) * 100}%, #e5e7eb ${(heading / 360) * 100}%)`,
            }}
          />
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
          {Math.round(heading)}°
        </span>
      </div>

      <p className="text-xs text-gray-400 text-center">
        <MapPin size={10} className="inline mr-1" />
        Satellite view with 45° tilt — click and drag to explore
      </p>
    </div>
  );
};

export default NeighborhoodFlyover;
