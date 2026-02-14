/**
 * Push Notification Manager
 *
 * Handles Web Push subscription lifecycle and local notification display.
 * - subscribeToPush / unsubscribeFromPush: manage PushManager subscriptions
 * - showLocalNotification: display a notification via the service worker (for world events, milestones)
 * - updateNotificationPreferences: persist per-type toggles in Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ── VAPID Public Key (injected at build time) ──

declare const __AXIOM_VAPID_PUBLIC_KEY__: string | undefined;

function getVapidPublicKey(): string {
  if (typeof __AXIOM_VAPID_PUBLIC_KEY__ !== 'undefined' && __AXIOM_VAPID_PUBLIC_KEY__) {
    return __AXIOM_VAPID_PUBLIC_KEY__;
  }
  const meta = import.meta as any;
  if (meta?.env?.VITE_VAPID_PUBLIC_KEY) return meta.env.VITE_VAPID_PUBLIC_KEY;
  return '';
}

// ── Types ──

export interface NotificationPreferences {
  quest_reminders: boolean;
  world_events: boolean;
  milestones: boolean;
  weekly_recap: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  quest_reminders: true,
  world_events: true,
  milestones: true,
  weekly_recap: true,
};

// ── Helpers ──

/** Convert a URL-safe base64 VAPID key to a Uint8Array for PushManager.subscribe() */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if push notifications are supported in this browser */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Get current notification permission state */
export function getPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ── Permission ──

/** Request notification permission from the user. Returns the resulting permission. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// ── Subscription Management ──

export type SubscribeResult = { ok: true } | { ok: false; error: string };

/**
 * Subscribe the current browser to Web Push and store the subscription in Supabase.
 * Requires notification permission to already be granted.
 */
export async function subscribeToPush(userId: string): Promise<SubscribeResult> {
  try {
    if (!isPushSupported()) {
      return { ok: false, error: 'Push not supported in this browser.' };
    }

    if (Notification.permission !== 'granted') {
      return { ok: false, error: 'Notification permission not granted.' };
    }

    const vapidKey = getVapidPublicKey();
    if (!vapidKey) {
      return {
        ok: false,
        error: 'VAPID key missing. Add VITE_VAPID_PUBLIC_KEY to your deployment environment variables and redeploy.',
      };
    }

    // Service worker may not be ready in dev (e.g. npm run dev). In preview it can take a few seconds after first load.
    const SW_READY_TIMEOUT_MS = 15000;
    let registration: ServiceWorkerRegistration | null;
    try {
      registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), SW_READY_TIMEOUT_MS)
        ),
      ]);
    } catch {
      return {
        ok: false,
        error: 'Service worker not ready. Use a production build (npm run build && npm run preview) to test locally.',
      };
    }
    if (!registration) {
      return { ok: false, error: 'Service worker not available.' };
    }

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { ok: false, error: 'Invalid subscription from browser.' };
    }

    // Get the user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    if (!isSupabaseConfigured()) {
      console.warn('[Push] Supabase not configured — subscription saved locally only');
      return { ok: true };
    }

    // Upsert into push_subscriptions (unique on user_id + endpoint)
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        timezone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('[Push] Failed to save subscription:', error);
      return {
        ok: false,
        error: 'Could not save subscription. Ensure the push_subscriptions table exists and RLS allows access.',
      };
    }

    console.log('[Push] Successfully subscribed');
    return { ok: true };
  } catch (err) {
    console.error('[Push] Subscription error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Subscription failed.',
    };
  }
}

/**
 * Unsubscribe from Web Push and remove the subscription from Supabase.
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      if (isSupabaseConfigured()) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', userId)
          .eq('endpoint', endpoint);
      }
    }

    console.log('[Push] Successfully unsubscribed');
    return true;
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err);
    return false;
  }
}

/**
 * Check if the user currently has an active push subscription.
 */
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// ── Notification Preferences ──

/**
 * Fetch the user's notification preferences from Supabase.
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  if (!isSupabaseConfigured()) return DEFAULT_PREFERENCES;

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('preferences')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error || !data?.preferences) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...data.preferences } as NotificationPreferences;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update the user's notification preferences in Supabase.
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ preferences, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

// ── Local Notification Display ──

/**
 * Show a local notification via the service worker's postMessage API.
 * Used for world events and milestones that happen while the user is in-app.
 * Only shows if the document is hidden (user isn't actively looking at the app).
 */
export async function showLocalNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    url?: string;
    type?: string;
    forceShow?: boolean; // override visibility check
  }
): Promise<void> {
  // Only show when app is in the background (unless forced)
  if (!options?.forceShow && document.visibilityState === 'visible') return;

  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Use postMessage to the service worker to show notification
    // This works even if the page is about to be hidden/closed
    if (registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        tag: options?.tag,
        url: options?.url ?? '/',
        notifType: options?.type ?? 'local',
      });
    }
  } catch (err) {
    console.error('[Push] Failed to show local notification:', err);
  }
}
