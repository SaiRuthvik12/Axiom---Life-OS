import { createClient } from '@supabase/supabase-js';

// Inlined at build time by Vite define (for Vercel etc.); undefined in dev if not set
declare const __AXIOM_SUPABASE_URL__: string | undefined;
declare const __AXIOM_SUPABASE_ANON_KEY__: string | undefined;

function getSupabaseEnv(): { url: string; key: string } {
  const fromDefine = typeof __AXIOM_SUPABASE_URL__ !== 'undefined' && typeof __AXIOM_SUPABASE_ANON_KEY__ !== 'undefined'
    ? { url: __AXIOM_SUPABASE_URL__, key: __AXIOM_SUPABASE_ANON_KEY__ }
    : { url: '', key: '' };
  if (fromDefine.url && fromDefine.key) return fromDefine;
  const meta = import.meta as any;
  if (meta?.env?.VITE_SUPABASE_URL && meta?.env?.VITE_SUPABASE_ANON_KEY) {
    return { url: meta.env.VITE_SUPABASE_URL, key: meta.env.VITE_SUPABASE_ANON_KEY };
  }
  if (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL && process.env?.VITE_SUPABASE_ANON_KEY) {
    return { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY };
  }
  return { url: '', key: '' };
}

const { url: supabaseUrl, key: supabaseKey } = getSupabaseEnv();

// Determine if configured based on presence of keys
const isConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'undefined';

// Debug: use warn so it’s visible even if console filter hides "Info"
if (typeof import.meta !== 'undefined') {
  const msg = isConfigured ? '[Axiom] Supabase connected (URL set)' : '[Axiom] Supabase not configured — running in demo mode (URL missing)';
  console.warn(msg);
}

// If not configured, use dummy values to prevent createClient from throwing 'supabaseUrl is required' error
const clientUrl = isConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isConfigured ? supabaseKey : 'placeholder';

export const supabase = createClient(clientUrl, clientKey);

export const isSupabaseConfigured = () => isConfigured;