#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push notifications.
 *
 * Run: node scripts/generate-vapid-keys.mjs
 *
 * Output: Public and private keys in base64url format.
 * - Store the PUBLIC key as VITE_VAPID_PUBLIC_KEY in your .env
 * - Store the PRIVATE key as VAPID_PRIVATE_KEY in Supabase Edge Function secrets
 * - Also store the PUBLIC key as VAPID_PUBLIC_KEY in Supabase Edge Function secrets
 */

import crypto from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'P-256',
});

// Export public key as uncompressed point (65 bytes)
const pubDer = publicKey.export({ type: 'spki', format: 'der' });
// The last 65 bytes of the SPKI DER encoding contain the raw uncompressed point
const rawPublic = pubDer.slice(-65);

// Export private key as PKCS8 DER for the Edge Function
const privPkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' });

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const pubB64 = toBase64Url(rawPublic);
const privB64 = toBase64Url(privPkcs8);

console.log('=== VAPID Keys Generated ===\n');
console.log('PUBLIC KEY (add to .env as VITE_VAPID_PUBLIC_KEY):');
console.log(pubB64);
console.log('\nPRIVATE KEY (add to Supabase secrets as VAPID_PRIVATE_KEY):');
console.log(privB64);
console.log('\nPUBLIC KEY (also add to Supabase secrets as VAPID_PUBLIC_KEY):');
console.log(pubB64);
console.log('\nDon\'t forget to also set VAPID_SUBJECT=mailto:your@email.com');
