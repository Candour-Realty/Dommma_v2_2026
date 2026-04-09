import { useEffect, useRef, useState } from 'react';
import { EyeOff, Loader2 } from 'lucide-react';

const StreetViewPreview = ({ lat, lng }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unavailable

  useEffect(() => {
    if (!containerRef.current || !window.google) return;

    // Check availability then initialize interactive Street View
    const sv = new window.google.maps.StreetViewService();
    sv.getPanorama(
      { location: { lat, lng }, radius: 100 },
      (data, svStatus) => {
        if (svStatus === window.google.maps.StreetViewStatus.OK) {
          new window.google.maps.StreetViewPanorama(containerRef.current, {
            position: { lat, lng },
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            motionTracking: false,
            motionTrackingControl: false,
          });
          setStatus('ready');
        } else {
          setStatus('unavailable');
        }
      }
    );
  }, [lat, lng]);

  if (status === 'unavailable') {
    return (
      <div className="rounded-xl bg-[#F5F5F0] dark:bg-white/5 p-8 text-center">
        <EyeOff className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Street View is not available for this location
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-white/5 z-10">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full rounded-xl"
        style={{ height: '300px' }}
      />
    </div>
  );
};

export default StreetViewPreview;
