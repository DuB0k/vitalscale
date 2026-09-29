import React from 'react';
import { 
  Scale, 
  Ruler, 
  Cloud, 
  Download, 
  Database,
  User,
  LogOut,
  LogIn
} from 'lucide-react';

export default function Navbar({ 
  heightCm, 
  onOpenProfile, 
  onOpenSupabase, 
  isSupabaseConnected, 
  supabaseUser,
  onOpenAuth,
  onSignOut,
  onExportCSV,
  measurementsCount
}) {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-glow-teal font-bold">
            <Scale className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-300"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Vital<span className="text-teal-400">Scale</span>
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Salud & Medidas
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Control de peso, cintura y evolución de IMC</p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Height Pill / Quick Profile Edit */}
          <button
            onClick={onOpenProfile}
            title="Haz clic para modificar tu altura o peso objetivo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-teal-500/50 transition-all text-xs font-medium shadow-sm group"
          >
            <Ruler className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
            <span>{heightCm ? `${heightCm} cm` : 'Definir altura'}</span>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">✎</span>
          </button>

          {/* Supabase Status & Settings Button */}
          <button
            onClick={onOpenSupabase}
            title="Configuración de conexión y tablas en Supabase"
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isSupabaseConnected 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40' 
                : 'bg-slate-900/90 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="text-[11px]">{isSupabaseConnected ? 'Supabase' : 'Nube'}</span>
          </button>

          {/* Quick Export to CSV */}
          <button
            onClick={onExportCSV}
            disabled={measurementsCount === 0}
            title="Descargar historial completo en archivo CSV"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden lg:inline text-[11px]">CSV</span>
          </button>

          {/* Authentication State: User Info & Logout or Login Button */}
          {supabaseUser ? (
            <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-800">
              {/* User email badge */}
              <div 
                title={`Sesión iniciada como: ${supabaseUser.email}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 max-w-[150px] sm:max-w-[190px]"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></div>
                <span className="truncate text-[11px] font-medium">{supabaseUser.email}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onSignOut}
                title="Cerrar Sesión"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:border-rose-500/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              title="Iniciar sesión o registrarte con Supabase Auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-xs font-bold shadow-glow-teal transition-all"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Acceder</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
