/**
 * Web Push Notification utility for DOMMMA
 * Handles permission, subscription, and push registration
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getVapidPublicKey() {
  try {
    const res = await fetch(`${API_URL}/api/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey;
  } catch {
    return null;
  }
}

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return { success: false, reason: 'not_supported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  try {
    const publicKey = await getVapidPublicKey();
    if (!publicKey) return { success: false, reason: 'no_vapid_key' };

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const res = await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, subscription: subscription.toJSON() }),
    });

    if (res.ok) {
      return { success: true };
    }
    return { success: false, reason: 'server_error' };
  } catch (err) {
    console.error('Push subscription error:', err);
    return { success: false, reason: 'error', error: err.message };
  }
}

export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    await fetch(`${API_URL}/api/push/unsubscribe/${userId}`, { method: 'DELETE' });
    return { success: true };
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return { success: false };
  }
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', 'default'
}
