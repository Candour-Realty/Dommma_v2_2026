import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';

const categories = [
  { label: 'Grocery', emoji: '\ud83d\uded2', type: 'grocery_or_supermarket' },
  { label: 'Transit', emoji: '\ud83d\ude87', type: 'transit_station' },
  { label: 'Restaurant', emoji: '\ud83c\udf7d\ufe0f', type: 'restaurant' },
  { label: 'Park', emoji: '\ud83c\udf33', type: 'park' },
  { label: 'School', emoji: '\ud83c\udfeb', type: 'school' },
  { label: 'Gym', emoji: '\ud83d\udcaa', type: 'gym' },
];

// Module-level cache
const placesCache = new Map();

const NearbyPlaces = ({ lat, lng }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const placesRef = useRef(null);

  useEffect(() => {
    const cacheKey = `${lat},${lng}`;
    if (placesCache.has(cacheKey)) {
      setPlaces(placesCache.get(cacheKey));
      setLoading(false);
      return;
    }

    if (!window.google) {
      setLoading(false);
      return;
    }

    // Create hidden div for PlacesService
    if (!placesRef.current) {
      placesRef.current = document.createElement('div');
    }

    const service = new window.google.maps.places.PlacesService(placesRef.current);
    const results = [];
    let completed = 0;

    categories.forEach((cat) => {
      service.nearbySearch(
        {
          location: { lat, lng },
          radius: 1500,
          type: cat.type,
        },
        (searchResults, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && searchResults?.length > 0) {
            const nearest = searchResults[0];
            results.push({
              category: cat.label,
              emoji: cat.emoji,
              name: nearest.name,
              rating: nearest.rating || null,
              lat: nearest.geometry.location.lat(),
              lng: nearest.geometry.location.lng(),
              walkTime: null, // Will be calculated
            });
          } else {
            results.push({
              category: cat.label,
              emoji: cat.emoji,
              name: null,
              rating: null,
              walkTime: null,
            });
          }

          completed++;
          if (completed === categories.length) {
            // Calculate walking times for found places
            calculateWalkTimes(results, lat, lng, cacheKey);
          }
        }
      );
    });
  }, [lat, lng]);

  const calculateWalkTimes = (results, originLat, originLng, cacheKey) => {
    const foundPlaces = results.filter((r) => r.name && r.lat);

    if (foundPlaces.length === 0 || !window.google) {
      placesCache.set(cacheKey, results);
      setPlaces(results);
      setLoading(false);
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    const destinations = foundPlaces.map((p) => ({ lat: p.lat, lng: p.lng }));

    service.getDistanceMatrix(
      {
        origins: [{ lat: originLat, lng: originLng }],
        destinations,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (response, status) => {
        if (status === 'OK') {
          const elements = response.rows[0]?.elements || [];
          foundPlaces.forEach((place, i) => {
            if (elements[i]?.status === 'OK') {
              place.walkTime = elements[i].duration.text;
            }
          });
        }

        placesCache.set(cacheKey, results);
        setPlaces(results);
        setLoading(false);
      }
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <div key={cat.label} className="p-4 rounded-xl skeleton-shimmer h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {places.map((place, i) => (
        <motion.div
          key={place.category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-4 rounded-xl bg-[#F5F5F0] dark:bg-white/5 border border-transparent hover:border-[#1A2F3A]/20 dark:hover:border-white/10 transition-colors"
        >
          <p className="text-2xl mb-2">{place.emoji}</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {place.category}
          </p>
          {place.name ? (
            <>
              <p className="text-sm font-semibold text-[#1A2F3A] dark:text-white truncate" title={place.name}>
                {place.name}
              </p>
              {place.walkTime && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {place.walkTime} walk
                </p>
              )}
              {place.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-500">{place.rating}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">Not found nearby</p>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default NearbyPlaces;
