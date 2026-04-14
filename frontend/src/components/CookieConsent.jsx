import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { getConsent, setConsent, isNativeApp } from '@/lib/consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't render the banner inside the Capacitor native app — consent there is
    // handled by App Store / Play Store native flows (ATT, Data Safety).
    if (isNativeApp()) return;

    const consent = getConsent();
    if (!consent) {
      // Delay showing by 2 seconds so it doesn't distract on page load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    setConsent('accepted'); // This enables PostHog + Firebase Analytics
    setShow(false);
  };

  const decline = () => {
    setConsent('declined'); // This opts the user out of PostHog; Firebase Analytics stays dormant
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[9999]"
        >
          <div className="bg-white dark:bg-[#1A2332] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A2F3A]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                <Cookie size={20} className="text-[#1A2F3A] dark:text-[#C4A962]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1A2F3A] dark:text-white text-sm mb-1">Cookie Preferences</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  We use essential cookies for authentication. Analytics cookies (PostHog, Firebase) load only if you accept.{' '}
                  <a href="/privacy" className="text-[#1A2F3A] dark:text-[#C4A962] underline">Privacy Policy</a>
                </p>
              </div>
              <button onClick={decline} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" aria-label="Decline analytics">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={accept}
                className="flex-1 py-2 bg-[#1A2F3A] text-white rounded-xl text-xs font-medium hover:bg-[#2C4A52] transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                Essential Only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
