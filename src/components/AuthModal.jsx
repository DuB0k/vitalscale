import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Ruler, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  isSupabaseConfigured,
  onOpenSupabaseConfig,
  onSignIn,
  onSignUp
}) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialHeight, setInitialHeight] = useState('175');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const heightNum = parseInt(initialHeight, 10) || 175;
        await onSignUp(email.trim(), password, heightNum);
        setSuccessMsg('¡Cuenta creada con éxito! Iniciando tu sesión personal...');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        await onSignIn(email.trim(), password);
        setSuccessMsg('¡Sesión iniciada correctamente!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error en la autenticación';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Correo electrónico o contraseña incorrectos.';
      } else if (msg.includes('User already registered')) {
        msg = 'Ya existe un usuario con este correo electrónico. Prueba a iniciar sesión.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Correo no confirmado. Revisa tu bandeja de entrada o desactiva la confirmación en Supabase.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-dropdown rounded-3xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-12 -mb-12"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-glow-teal font-bold mb-3">
            {mode === 'login' ? <LogIn className="w-6 h-6 stroke-[2.5]" /> : <UserPlus className="w-6 h-6 stroke-[2.5]" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {mode === 'login' ? 'Bienvenido a VitalScale' : 'Crea tu Cuenta Privada'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Accede a tu espacio aislado de medidas corporales y salud'
              : 'Tus registros de peso y cintura estarán 100% aislados y seguros'}
          </p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isSupabaseConfigured && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Conexión de Supabase requerida</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Para registrarte o iniciar sesión con Supabase Auth necesitas configurar tu Project URL y Anon Key.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupabaseConfig();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all text-center"
            >
              Configurar Credenciales de Supabase →
            </button>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                Contraseña
              </span>
              <span className="text-[10px] text-slate-500">Mín. 6 caracteres</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Initial Height (Only in Register Mode) */}
          {mode === 'register' && (
            <div className="animate-fade-in p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-teal-400" />
                  Tu Estatura Inicial (cm)
                </span>
                <span className="text-[10px] text-teal-400 font-semibold">Para cálculo de IMC</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="250"
                  placeholder="175"
                  value={initialHeight}
                  onChange={(e) => setInitialHeight(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Se guardará en tu perfil personal y podrás modificarla en cualquier momento.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-sm shadow-glow-teal flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : mode === 'login' ? (
              <>
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            ) : (
              <>
                <span>Crear Cuenta & Empezar</span>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

        </form>

        {/* Local mode option hint */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Continuar en modo local / sin cuenta
          </button>
        </div>

      </div>
    </div>
  );
}
