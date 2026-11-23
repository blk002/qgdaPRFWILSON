import { createClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return 'https://placeholder.supabase.co';
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/+(rest|auth|storage|realtime)\/v1\/?.*$/i, '').replace(/\/+$/, '');
  }
}

export const SUPABASE_URL = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'qg-prf-auth-v1', // Chave única para evitar conflitos de Lock
    flowType: 'pkce'
  }
});
