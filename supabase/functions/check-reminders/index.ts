/**
 * Supabase Edge Function: check-reminders
 *
 * Called by an external cron service (e.g., cron-job.org) every hour.
 * Checks each user's pending quests and sends push notification reminders
 * based on their local timezone.
 *
 * Notification rules:
 *   - Daily quest reminder:   9 PM local time if any DAILY quests are PENDING
 *   - Weekly quest reminder:  Friday 9 PM local if any WEEKLY quests are PENDING
 *   - Monthly quest reminder: 5 days before month end, 9 PM local if any EPIC quests are PENDING
 *   - Weekly recap:           Sunday 8 PM local
 *
 * Required secrets (set via `supabase secrets set`):
 *   - VAPID_PRIVATE_KEY: VAPID private key for Web Push
 *   - VAPID_SUBJECT: mailto: email for VAPID
 *   - CRON_SECRET: shared secret for cron authentication
 *
 * Auto-available env vars in Supabase Edge Functions:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

// @ts-ignore — Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ── Web Push implementation (no npm dependency needed) ──

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  type?: string;
}

/**
 * Send a Web Push notification using the standard Web Push protocol.
 * Uses the VAPID keys for authentication with the push service.
 */
async function sendWebPush(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPrivateKey: string,
  vapidSubject: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    // Import the key
    const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
    const publicKeyBytes = base64UrlDecode(vapidPublicKey);

    // Create JWT for VAPID
    const audience = new URL(subscription.endpoint).origin;
    const jwt = await createVapidJwt(audience, vapidSubject, privateKeyBytes);

    // Encrypt the payload
    const encrypted = await encryptPayload(
      JSON.stringify(payload),
      base64UrlDecode(subscription.p256dh),
      base64UrlDecode(subscription.auth)
    );

    // Send the push message
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': String(encrypted.byteLength),
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${base64UrlEncode(publicKeyBytes)}`,
      },
      body: encrypted,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Push failed (${response.status}): ${text}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('sendWebPush error:', err);
    return false;
  }
}

// ── Crypto helpers for VAPID + Web Push encryption ──

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBytes: Uint8Array
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 86400, sub: subject };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import the ECDSA private key
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(unsignedToken)
    )
  );

  // Convert DER signature to raw (r||s) if needed
  const rawSig = derToRaw(signature);

  return `${unsignedToken}.${base64UrlEncode(rawSig)}`;
}

function derToRaw(sig: Uint8Array): Uint8Array {
  // If already 64 bytes, it's already raw
  if (sig.length === 64) return sig;

  // DER format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  if (sig[0] !== 0x30) return sig;

  let offset = 2;
  const rLength = sig[offset + 1];
  const r = sig.slice(offset + 2, offset + 2 + rLength);
  offset += 2 + rLength;
  const sLength = sig[offset + 1];
  const s = sig.slice(offset + 2, offset + 2 + sLength);

  const raw = new Uint8Array(64);
  raw.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  raw.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));
  return raw;
}

async function encryptPayload(
  plaintext: string,
  clientPublicKey: Uint8Array,
  authSecret: Uint8Array
): Promise<Uint8Array> {
  // Generate a local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import the client's public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret via ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Export our public key
  const localPubKey = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption key using HKDF
  // auth_info = "WebPush: info\0" || clientPublicKey || localPublicKey
  const authInfo = concatBytes(
    new TextEncoder().encode('WebPush: info\0'),
    clientPublicKey,
    localPubKey
  );

  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const prkKey = await crypto.subtle.importKey('raw', authSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, sharedSecret));

  // IKM = HKDF-Expand(PRK, auth_info, 32)
  const ikm = await hkdfExpand(prk, authInfo, 32);

  // Content encryption key: HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const cekPrk = await hkdfExtract(salt, ikm);
  const cek = await hkdfExpand(cekPrk, cekInfo, 16);

  // Nonce: HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonce = await hkdfExpand(cekPrk, nonceInfo, 12);

  // Pad and encrypt: plaintext || 0x02 (delimiter)
  const paddedPlaintext = concatBytes(new TextEncoder().encode(plaintext), new Uint8Array([2]));

  const encKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      encKey,
      paddedPlaintext
    )
  );

  // Build the aes128gcm header:
  // salt (16) || record_size (4, big-endian) || key_id_length (1) || key_id (65 = uncompressed P-256 point)
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, encrypted.length + 86, false);

  return concatBytes(
    salt,                           // 16 bytes
    recordSize,                     // 4 bytes
    new Uint8Array([localPubKey.length]),  // 1 byte
    localPubKey,                    // 65 bytes
    encrypted                       // ciphertext + tag
  );
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm));
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const input = concatBytes(info, new Uint8Array([1]));
  const output = new Uint8Array(await crypto.subtle.sign('HMAC', key, input));
  return output.slice(0, length);
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ── Main handler ──

serve(async (req: Request) => {
  // Verify cron secret
  const cronSecret = Deno.env.get('CRON_SECRET') || '';
  const authHeader = req.headers.get('x-cron-secret') || '';
  if (cronSecret && authHeader !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@axiom.app';

  if (!vapidPrivateKey || !vapidPublicKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (subError || !subscriptions) {
    console.error('Failed to fetch subscriptions:', subError);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    const prefs = sub.preferences || {};
    const tz = sub.timezone || 'UTC';

    // Get the user's local time
    let localHour: number;
    let localDay: number; // 0=Sun, 1=Mon, ... 6=Sat
    let localDate: number; // Day of month
    let daysInMonth: number;

    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });

      const parts = formatter.formatToParts(now);
      localHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      localDate = parseInt(parts.find(p => p.type === 'day')?.value || '1');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '1');
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '2025');

      const weekdayStr = parts.find(p => p.type === 'weekday')?.value || 'Mon';
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      localDay = dayMap[weekdayStr] ?? 1;

      daysInMonth = new Date(year, month, 0).getDate();
    } catch {
      // Fallback to UTC
      const now = new Date();
      localHour = now.getUTCHours();
      localDay = now.getUTCDay();
      localDate = now.getUTCDate();
      daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
    }

    const pushSub: PushSubscription = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    };

    // ── Daily Quest Reminder: 9 PM local ──
    if (localHour === 21 && prefs.quest_reminders !== false) {
      const { data: dailyQuests } = await supabase
        .from('quests')
        .select('id, title')
        .eq('user_id', sub.user_id)
        .eq('type', 'DAILY')
        .eq('status', 'PENDING');

      if (dailyQuests && dailyQuests.length > 0) {
        const count = dailyQuests.length;
        const ok = await sendWebPush(
          pushSub,
          {
            title: 'Daily Quests Remaining',
            body: count === 1
              ? `"${dailyQuests[0].title}" is still pending. 3 hours left!`
              : `${count} daily quests still pending. 3 hours left!`,
            tag: 'daily-reminder',
            url: '/',
            type: 'quest_reminder',
          },
          vapidPrivateKey,
          vapidSubject,
          vapidPublicKey
        );
        ok ? sent++ : errors++;
      }
    }

    // ── Weekly Quest Reminder: Friday 9 PM local ──
    if (localHour === 21 && localDay === 5 && prefs.quest_reminders !== false) {
      const { data: weeklyQuests } = await supabase
        .from('quests')
        .select('id, title')
        .eq('user_id', sub.user_id)
        .eq('type', 'WEEKLY')
        .eq('status', 'PENDING');

      if (weeklyQuests && weeklyQuests.length > 0) {
        const count = weeklyQuests.length;
        const ok = await sendWebPush(
          pushSub,
          {
            title: 'Weekly Quests Due Soon',
            body: count === 1
              ? `"${weeklyQuests[0].title}" — 2 days left this week.`
              : `${count} weekly quests still pending. 2 days left!`,
            tag: 'weekly-reminder',
            url: '/',
            type: 'quest_reminder',
          },
          vapidPrivateKey,
          vapidSubject,
          vapidPublicKey
        );
        ok ? sent++ : errors++;
      }
    }

    // ── Monthly Quest Reminder: 5 days before month end, 9 PM local ──
    if (localHour === 21 && (daysInMonth - localDate) === 5 && prefs.quest_reminders !== false) {
      const { data: epicQuests } = await supabase
        .from('quests')
        .select('id, title')
        .eq('user_id', sub.user_id)
        .eq('type', 'EPIC')
        .eq('status', 'PENDING');

      if (epicQuests && epicQuests.length > 0) {
        const count = epicQuests.length;
        const ok = await sendWebPush(
          pushSub,
          {
            title: 'Monthly Objectives Due Soon',
            body: count === 1
              ? `"${epicQuests[0].title}" — 5 days left this month.`
              : `${count} epic quests still pending. 5 days left!`,
            tag: 'monthly-reminder',
            url: '/',
            type: 'quest_reminder',
          },
          vapidPrivateKey,
          vapidSubject,
          vapidPublicKey
        );
        ok ? sent++ : errors++;
      }
    }

    // ── Weekly Recap: Sunday 8 PM local ──
    if (localHour === 20 && localDay === 0 && prefs.weekly_recap !== false) {
      const ok = await sendWebPush(
        pushSub,
        {
          title: 'Weekly Chronicle Ready',
          body: 'Your weekly recap is available. See how your world evolved this week.',
          tag: 'weekly-recap',
          url: '/',
          type: 'weekly_recap',
        },
        vapidPrivateKey,
        vapidSubject,
        vapidPublicKey
      );
      ok ? sent++ : errors++;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      subscriptions: subscriptions.length,
      sent,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
