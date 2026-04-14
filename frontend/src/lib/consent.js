// Cookie/analytics consent manager — single source of truth
// Handles: reading/writing consent, detecting native app, initializing gated trackers

const CONSENT_KEY = 'dommma_cookie_consent';
const CONSENT_EVENT = 'dommma:consent-changed';
const OPEN_SETTINGS_EVENT = 'dommma:open-cookie-settings';

// Programmatically re-open the cookie banner (for the "Cookie Preferences" footer link)
export const openCookieSettings = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
};

export const onOpenCookieSettings = (handler) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(OPEN_SETTINGS_EVENT, handler);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, handler);
};

// Detect if running inside the Capacitor native app (Android/iOS)
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  // Capacitor sets window.Capacitor when running in a native shell
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
};

// Read current consent: 'accepted' | 'declined' | null (undecided)
export const getConsent = () => {
  if (typeof window === 'undefined') return null;
  // In the native app we treat consent as implicitly granted — the app store
  // consent flow (Data Safety, ATT) handles user-facing permission
  if (isNativeApp()) return 'accepted';
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
};

export const hasConsent = () => getConsent() === 'accepted';

// Set consent and fire an event so listeners can start/stop tracking
export const setConsent = (value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { value } }));
  if (value === 'accepted') {
    initTracking();
  } else {
    disableTracking();
  }
};

// Initialize trackers ONLY after consent. Safe to call multiple times.
let trackingInitialized = false;
export const initTracking = () => {
  if (trackingInitialized) return;
  if (!hasConsent()) return;
  trackingInitialized = true;

  // PostHog — init only now (the stub exists from index.html but never called init)
  try {
    if (window.posthog && typeof window.posthog.init === 'function') {
      window.posthog.init('phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        session_recording: {
          recordCrossOriginIframes: true,
          capturePerformance: false,
        },
      });
    }
  } catch (e) {
    console.warn('PostHog init failed:', e);
  }

  // Firebase Analytics — lazy enable so app doesn't pull it in otherwise
  try {
    import('./firebase').then(({ enableFirebaseAnalytics }) => {
      if (enableFirebaseAnalytics) enableFirebaseAnalytics();
    });
  } catch (e) {
    console.warn('Firebase Analytics enable failed:', e);
  }
};

// Opt user out — best-effort cleanup
export const disableTracking = () => {
  try {
    if (window.posthog && typeof window.posthog.opt_out_capturing === 'function') {
      window.posthog.opt_out_capturing();
    }
  } catch {}
  // Firebase Analytics doesn't expose a clean teardown, but gating getAnalytics
  // means no new events fire from our code. Existing events can't be un-sent.
};

export const onConsentChange = (handler) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
};
