import { createClient } from '@supabase/supabase-js';

// Helper to reliably get env vars across different build environments (Vite, Webpack, etc.)
const getEnvVar = (key: string) => {
  // 1. Check Vite's import.meta.env (Standard for this project structure)
  // Cast import.meta to any to avoid TS errors regarding 'env' property
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    // Check for VITE_ prefixed version first (Standard Vite behavior)
    if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
    if (meta.env[key]) return meta.env[key];
  }
  
  // 2. Check process.env (Legacy/Node/Webpack)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
    if (process.env[key]) return process.env[key];
  }
  
  return '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY');

// Determine if configured based on presence of keys
const isConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'undefined';

// Debug in dev: so you can see in browser console whether env was loaded (restart dev server after changing .env)
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  console.log('[Axiom] Supabase configured:', isConfigured, supabaseUrl ? '(URL set)' : '(URL missing)');
}

// If not configured, use dummy values to prevent createClient from throwing 'supabaseUrl is required' error
const clientUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isConfigured ? supabaseKey : 'placeholder';

export const supabase = createClient(clientUrl, clientKey);

export const isSupabaseConfigured = () => isConfigured;