/**
 * NotificationPrompt
 *
 * Two modes:
 * 1. Banner — shown once after login to prompt the user to enable notifications
 * 2. Settings — full notification settings panel with per-type toggles
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import {
  isPushSupported,
  getPermissionState,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
  DEFAULT_PREFERENCES,
} from '../lib/pushNotifications';

// ────────────────────────────────────────
// Banner — one-time prompt
// ────────────────────────────────────────

const PROMPT_DISMISSED_KEY = 'axiom_notif_prompt_dismissed';

interface BannerProps {
  userId: string;
}

export const NotificationBanner: React.FC<BannerProps> = ({ userId }) => {
  const [visible, setVisible] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if: not supported, already granted, or user dismissed
    if (!isPushSupported()) return;
    if (getPermissionState() === 'granted') return;
    if (getPermissionState() === 'denied') return;
    if (localStorage.getItem(PROMPT_DISMISSED_KEY)) return;

    // Small delay so the app loads first
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const handleEnable = async () => {
    setEnabling(true);
    setError(null);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        const result = await subscribeToPush(userId);
        if (!result.ok) {
          setError(result.error ?? 'Could not subscribe. Try again after refreshing.');
          return;
        }
      } else if (permission === 'denied') {
        setError('Notifications blocked.');
        return;
      }
      localStorage.setItem(PROMPT_DISMISSED_KEY, '1');
      setVisible(false);
    } catch (e) {
      console.error('[Notifications] Enable failed:', e);
      setError('Something went wrong. Try refreshing.');
    } finally {
      setEnabling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-[100] animate-in slide-in-from-bottom">
      <div className="bg-axiom-900 border border-axiom-700 rounded-lg p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-axiom-accent/10 border border-axiom-accent/20 flex items-center justify-center">
            <Bell size={18} className="text-axiom-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white tracking-wide">Enable Notifications</h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Get quest reminders, world event alerts, and milestone notifications — even when the app is closed.
            </p>
            {error && (
              <p className="text-axiom-danger text-xs mt-2">{error}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={enabling}
                className="bg-axiom-accent hover:bg-axiom-accent/80 disabled:opacity-60 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
              >
                {enabling ? 'Enabling…' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={enabling}
                className="text-gray-500 hover:text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-60"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-600 hover:text-gray-400 shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────
// Settings Panel — notification preferences
// ────────────────────────────────────────

interface SettingsProps {
  userId: string;
}

export const NotificationSettings: React.FC<SettingsProps> = ({ userId }) => {
  const [permission, setPermission] = useState<NotificationPermission>(getPermissionState());
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sub = await isSubscribedToPush();
      setSubscribed(sub);
      if (sub) {
        const prefs = await getNotificationPreferences(userId);
        setPreferences(prefs);
      }
      setLoading(false);
    })();
  }, [userId]);

  const handleToggleSubscription = async () => {
    setToggling(true);
    setToggleError(null);
    try {
      if (subscribed) {
        await unsubscribeFromPush(userId);
        setSubscribed(false);
      } else {
        const perm = await requestNotificationPermission();
        setPermission(perm);
        if (perm === 'granted') {
          const result = await subscribeToPush(userId);
          setSubscribed(result.ok);
          if (!result.ok) {
            setToggleError(result.error ?? 'Subscribe failed.');
          }
        }
      }
    } catch (e) {
      console.error('[Notifications] Toggle failed:', e);
      setToggleError('Something went wrong.');
    } finally {
      setToggling(false);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    await updateNotificationPreferences(userId, updated);
  };

  if (!isPushSupported()) {
    return (
      <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-5">
        <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2 mb-3">
          <BellOff size={16} /> Notifications
        </h3>
        <p className="text-xs text-gray-500">Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  const prefItems: { key: keyof NotificationPreferences; label: string; desc: string }[] = [
    { key: 'quest_reminders', label: 'Quest Reminders', desc: 'Reminders before quest deadlines' },
    { key: 'world_events', label: 'World Events', desc: 'District changes, decay, and recovery' },
    { key: 'milestones', label: 'Milestones', desc: 'When you earn a new milestone' },
    { key: 'weekly_recap', label: 'Weekly Recap', desc: 'Sunday evening chronicle summary' },
  ];

  return (
    <div className="bg-axiom-900 border border-axiom-800 rounded-lg p-5">
      <h3 className="text-sm font-mono uppercase text-gray-400 tracking-wider flex items-center gap-2 mb-4">
        <Bell size={16} className="text-axiom-accent" /> Notifications
      </h3>

      {toggleError && (
        <p className="text-axiom-danger text-xs mb-3">{toggleError}</p>
      )}
      {/* Master toggle */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-axiom-800">
        <div>
          <span className="text-sm text-white font-medium">
            {subscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
          </span>
          {toggling && <span className="text-[10px] text-gray-500 ml-2">Updating…</span>}
          {permission === 'denied' && (
            <p className="text-[10px] text-axiom-danger mt-0.5">
              Blocked by browser — enable in site settings
            </p>
          )}
        </div>
        <button
          onClick={handleToggleSubscription}
          disabled={loading || toggling || permission === 'denied'}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            subscribed ? 'bg-axiom-accent' : 'bg-axiom-700'
          } ${permission === 'denied' || toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              subscribed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Per-type toggles */}
      {subscribed && (
        <div className="space-y-3">
          {prefItems.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <span className="text-xs text-white font-medium">{label}</span>
                <p className="text-[10px] text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => handleTogglePref(key)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  preferences[key] ? 'bg-axiom-accent/80' : 'bg-axiom-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    preferences[key] ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
