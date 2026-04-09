import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Eye, EyeOff } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBs_zxHIzIvin-zrYtr1Py1AuxxcFICggM';

const headingOptions = [
  { label: 'North', value: 0 },
  { label: 'East', value: 90 },
  { label: 'South', value: 180 },
  { label: 'West', value: 270 },
];

const StreetViewPreview = ({ lat, lng }) => {
  const [heading, setHeading] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(true);
  const [checking, setChecking] = useState(true);

  // Check Street View availability
  useEffect(() => {
    setChecking(true);
    setLoaded(false);
    fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAvailable(data.status === 'OK');
        setChecking(false);
      })
      .catch(() => {
        setAvailable(false);
        setChecking(false);
      });
  }, [lat, lng]);

  if (checking) {
    return (
      <div className="rounded-xl overflow-hidden">
        <div className="h-64 skeleton-shimmer" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="rounded-xl bg-[#F5F5F0] dark:bg-white/5 p-8 text-center">
        <EyeOff className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Street View is not available for this location
        </p>
      </div>
    );
  }

  const src = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&heading=${heading}&pitch=0&fov=90&key=${GOOGLE_MAPS_API_KEY}`;

  return (
    <div className="space-y-3">
      {/* Street View Image */}
      <div className="relative rounded-xl overflow-hidden bg-gray-200 dark:bg-white/5">
        {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
        <motion.img
          key={heading}
          src={src}
          alt={`Street view facing ${headingOptions.find((h) => h.value === heading)?.label}`}
          className="w-full h-64 object-cover"
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Direction Controls */}
      <div className="flex items-center justify-center gap-2">
        <RotateCw size={14} className="text-gray-400 mr-1" />
        {headingOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setLoaded(false);
              setHeading(opt.value);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              heading === opt.value
                ? 'bg-[#1A2F3A] text-white'
                : 'bg-[#F5F5F0] dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StreetViewPreview;
