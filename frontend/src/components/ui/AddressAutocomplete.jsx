import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

/**
 * AddressAutocomplete - Google Places powered address input
 * 
 * @param {string} value - Current input value
 * @param {function} onChange - Called with the raw input string
 * @param {function} onSelect - Called with parsed address object when user selects from dropdown
 * @param {string} placeholder - Input placeholder text
 * @param {string} className - Additional CSS classes for the input
 * @param {string} testId - data-testid attribute
 * @param {boolean} showIcon - Show map pin icon (default: true)
 * @param {string} country - Restrict to country code (default: 'ca')
 */
const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "Start typing an address...",
  className = "",
  testId = "address-input",
  showIcon = true,
  country = 'ca',
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    // Wait for Google Maps to load
    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        return false;
      }

      // Don't reinitialize if already set up
      if (autocompleteRef.current) return true;

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country },
          fields: ['formatted_address', 'address_components', 'geometry']
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place.formatted_address) {
            // Parse address components
            const components = place.address_components || [];
            let streetNumber = '', streetName = '', city = '', province = '', postalCode = '', neighborhood = '';

            components.forEach(c => {
              if (c.types.includes('street_number')) streetNumber = c.long_name;
              if (c.types.includes('route')) streetName = c.long_name;
              if (c.types.includes('locality')) city = c.long_name;
              if (c.types.includes('sublocality_level_1') || c.types.includes('neighborhood')) neighborhood = c.long_name;
              if (c.types.includes('administrative_area_level_1')) province = c.short_name;
              if (c.types.includes('postal_code')) postalCode = c.long_name;
            });

            const addressData = {
              formatted_address: place.formatted_address,
              address: `${streetNumber} ${streetName}`.trim(),
              street_number: streetNumber,
              street_name: streetName,
              city: city || neighborhood || 'Vancouver',
              province: province || 'BC',
              postal_code: postalCode,
              neighborhood,
              lat: place.geometry?.location?.lat() || null,
              lng: place.geometry?.location?.lng() || null
            };

            // Update the input value
            if (onChange) {
              onChange(place.formatted_address);
            }

            // Call onSelect with parsed data
            if (onSelect) {
              onSelect(addressData);
            }
          }
        });

        setIsReady(true);
        return true;
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (initAutocomplete()) return;

    // If Google Maps isn't loaded yet, wait for it
    const checkInterval = setInterval(() => {
      if (initAutocomplete()) {
        clearInterval(checkInterval);
      }
    }, 100);

    // Cleanup after 10 seconds if still not loaded
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!isReady) {
        console.warn('Google Maps Places API failed to load after 10s');
      }
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [country, onChange, onSelect, isReady]);

  // Handle manual input changes
  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const baseClasses = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all";
  const iconPadding = showIcon ? "pl-10" : "";

  return (
    <div className="relative">
      {showIcon && (
        <MapPin 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" 
        />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseClasses} ${iconPadding} ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        data-testid={testId}
        autoComplete="off"
      />
      {isLoading && (
        <Loader2 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" 
        />
      )}
    </div>
  );
};

export default AddressAutocomplete;
