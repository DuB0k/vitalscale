import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Code,
  ShieldCheck,
  Trash2,
  LogIn,
  UserCheck
} from 'lucide-react';
import { 
  getActiveConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SETUP 
} from '../lib/supabase';

export default function SupabaseModal({ 
  isOpen, 
  onClose, 
  isSupabaseConnected, 
  onConfigUpdated, 
  onSyncData,
  isSyncing,
  supabaseUser,
  onAuthSignIn,
  onAuthSignUp,
  onAuthSignOut
}) {
  const activeCfg = getActiveConfig();

  const [url, setUrl] = useState(activeCfg.url || '');
  const [anonKey, setAnonKey] = useState(activeCfg.anonKey || '');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState('config'); // 'config', 'auth', 'sql'

  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, anonKey);
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      saveSupabaseConfig(url, anonKey);
      onConfigUpdated();
    }
  };

  const handleClear = () => {
    if (confirm('¿Deseas desvincular Supabase de este navegador? Seguirás teniendo tus datos en modo local.')) {
      clearSupabaseConfig();
      setUrl('');
      setAnonKey('');
      setTestResult(null);
      onConfigUpdated();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleLoginSubmit = async (isSignUp) => {
    if (!authEmail || !authPassword) {
      setAuthError('Por favor completa correo y contraseña');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await onAuthSignUp(authEmail, authPassword);
      } else {
        await onAuthSignIn(authEmail, authPassword);
      }
    } catch (err) {
      setAuthError(err.message || 'Error de autenticación');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-dropdown rounded-3xl border border-slate-700/80 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Sincronización en la Nube con Supabase</span>
              {isSupabaseConnected && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Conectado
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Guarda tus registros corporales de forma persistente entre diferentes navegadores y dispositivos
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'config'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Conexión & Credenciales
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'auth'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Sesión & Cuenta {supabaseUser && '✓'}
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sql'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Script SQL para Tablas
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <div className="overflow-y-auto pr-1 space-y-4 flex-1">
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://xyzabcdefg.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Encuéntrala en Supabase &gt; Project Settings &gt; API
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Supabase Public Anon API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Clave pública anónima (anon public key)
                </span>
              </div>

              {/* Status Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{testResult.message || testResult.error}</div>
                    {testResult.needsTable && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('sql')}
                        className="text-teal-300 underline font-bold mt-1 block"
                      >
                        Ver Script SQL para crear las tablas necesarias →
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                {activeCfg.isCustom && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Desvincular credenciales
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isTesting || !url || !anonKey}
                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-glow-teal flex items-center gap-2 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Probando conexión...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Probar y Guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Sync Now button */}
            {isSupabaseConnected && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Sincronización Bidireccional</h4>
                  <p className="text-[11px] text-slate-400">Guarda datos locales en Supabase y descarga cambios</p>
                </div>
                <button
                  type="button"
                  onClick={onSyncData}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Auth */}
        {activeTab === 'auth' && (
          <div className="overflow-y-auto pr-1 space-y-4 flex-1">
            {!isSupabaseConnected ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300">
                  Primero configura tu URL y API Key de Supabase en la pestaña anterior para habilitar la autenticación.
                </p>
              </div>
            ) : supabaseUser ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Sesión Iniciada</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {supabaseUser.email || 'Usuario conectado'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  ID: {supabaseUser.id}
                </div>
                <button
                  onClick={onAuthSignOut}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300 border border-slate-700"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Inicia sesión para asociar tus medidas corporales a tu usuario privado de Supabase.
                </p>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {authError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleLoginSubmit(false)}
                    disabled={authLoading}
                    className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    {authLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginSubmit(true)}
                    disabled={authLoading}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                  >
                    Crear Cuenta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SQL Setup */}
        {activeTab === 'sql' && (
          <div className="overflow-y-auto pr-1 space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                Copia y pega este código en el <strong>SQL Editor</strong> de tu panel de Supabase:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold shadow-sm transition-all"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar SQL
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto leading-relaxed select-all">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
