import { createClient } from '@supabase/supabase-js';

// Configuration keys for localStorage
const STORAGE_KEY_URL = 'vitalscale_supabase_url';
const STORAGE_KEY_ANON = 'vitalscale_supabase_anon_key';

let supabaseInstance = null;
let currentConfig = {
  url: '',
  anonKey: ''
};

/**
 * Retrieves current active Supabase configuration
 */
export function getActiveConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_ANON) || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
    isCustom: Boolean(localUrl && localKey),
    isFromEnv: Boolean(!localUrl && envUrl && envKey)
  };
}

/**
 * Checks if Supabase credentials are configured
 */
export function isSupabaseConfigured() {
  const config = getActiveConfig();
  return Boolean(config.url && config.anonKey);
}

/**
 * Returns an initialized Supabase client, or null if unconfigured
 */
export function getSupabase() {
  const config = getActiveConfig();
  
  if (!config.url || !config.anonKey) {
    supabaseInstance = null;
    return null;
  }

  if (
    !supabaseInstance ||
    currentConfig.url !== config.url ||
    currentConfig.anonKey !== config.anonKey
  ) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      currentConfig = { url: config.url, anonKey: config.anonKey };
    } catch (err) {
      console.error('Error al inicializar cliente de Supabase:', err);
      supabaseInstance = null;
    }
  }

  return supabaseInstance;
}

/**
 * Saves custom Supabase credentials to localStorage
 */
export function saveSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_ANON);
  }

  // Force re-instantiation
  supabaseInstance = null;
  return getSupabase();
}

/**
 * Clears custom credentials from localStorage
 */
export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  supabaseInstance = null;
}

/**
 * Tests connection to Supabase
 */
export async function testSupabaseConnection(testUrl, testKey) {
  try {
    const url = testUrl || getActiveConfig().url;
    const key = testKey || getActiveConfig().anonKey;

    if (!url || !key) {
      return { success: false, error: 'La URL y el API Key no pueden estar vacíos.' };
    }

    const testClient = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await testClient.from('body_measurements').select('id').limit(1);

    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.body_measurements" does not exist')) {
      if (error.code === '42P01') {
        return { 
          success: true, 
          needsTable: true, 
          message: 'Conexión válida. Recuerda ejecutar el script SQL para crear las tablas.' 
        };
      }
      return { success: false, error: error.message || 'Error de autenticación con Supabase.' };
    }

    return { success: true, message: '¡Conexión establecida con éxito!' };
  } catch (err) {
    return { success: false, error: err.message || 'No se pudo conectar a la URL indicada.' };
  }
}

/**
 * Supabase Auth API Helpers
 */
export async function signUpUser(email, password, userMetadata = {}) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase no está configurado. Conéctalo primero.');
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata
    }
  });

  if (error) throw error;
  return data;
}

export async function signInUser(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase no está configurado. Conéctalo primero.');

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const client = getSupabase();
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }
}

/**
 * Profile & Measurements DB queries strictly isolated by user_id
 */
export async function fetchUserProfile(userId) {
  const client = getSupabase();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching user profile:', error.message);
    return null;
  }

  return data;
}

export async function upsertUserProfile(userId, profileData) {
  const client = getSupabase();
  if (!client || !userId) return null;

  const payload = {
    id: userId,
    height_cm: profileData.heightCm,
    target_weight: profileData.targetWeight,
    target_waist: profileData.targetWaist,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchUserMeasurements(userId) {
  const client = getSupabase();
  if (!client || !userId) return [];

  const { data, error } = await client
    .from('body_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) {
    console.warn('Error fetching user measurements:', error.message);
    throw error;
  }

  return (data || []).map(r => ({
    id: r.id,
    date: r.date,
    weight: Number(r.weight),
    waist: Number(r.waist),
    notes: r.notes || ''
  }));
}

export async function upsertUserMeasurement(userId, measurement) {
  const client = getSupabase();
  if (!client || !userId) return null;

  const payload = {
    id: measurement.id,
    user_id: userId,
    date: measurement.date,
    weight: measurement.weight,
    waist: measurement.waist,
    notes: measurement.notes || ''
  };

  const { data, error } = await client
    .from('body_measurements')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserMeasurement(userId, measurementId) {
  const client = getSupabase();
  if (!client || !userId) return;

  const { error } = await client
    .from('body_measurements')
    .delete()
    .eq('id', measurementId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * SQL Schema script snippet for user reference with strict Row Level Security (RLS)
 */
export const SUPABASE_SQL_SETUP = `-- 1. Tabla de Perfiles de Usuario (vinculada al ID de autenticación)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  height_cm NUMERIC DEFAULT 175,
  target_weight NUMERIC,
  target_waist NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden gestionar su propio perfil" ON public.profiles;

CREATE POLICY "Los usuarios pueden gestionar su propio perfil" 
  ON public.profiles FOR ALL 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Tabla de Medidas Corporales (estrictamente aislada por user_id)
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  waist NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en body_measurements
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios pueden gestionar sus propias medidas" ON public.body_measurements;

CREATE POLICY "Los usuarios pueden gestionar sus propias medidas" 
  ON public.body_measurements FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices de alto rendimiento para consultas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.body_measurements (user_id, date DESC);
`;
