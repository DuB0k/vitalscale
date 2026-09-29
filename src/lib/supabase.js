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
          detectSessionInUrl: true
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
      // If error is just that table doesn't exist yet, connection is still valid
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
 * SQL Schema script snippet for user reference
 */
export const SUPABASE_SQL_SETUP = `-- 1. Tabla de Perfil de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  height_cm NUMERIC DEFAULT 175,
  target_weight NUMERIC,
  target_waist NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar/actualizar su propio perfil" 
  ON public.profiles FOR ALL 
  USING (auth.uid() = id);

-- 2. Tabla de Medidas Corporales
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  waist NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en body_measurements
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden gestionar sus propias medidas" 
  ON public.body_measurements FOR ALL 
  USING (auth.uid() = user_id);

-- Crear índice para ordenación eficiente por fecha
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.body_measurements (user_id, date DESC);
`;
