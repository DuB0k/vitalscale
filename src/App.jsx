import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import KPICards from './components/KPICards';
import BMIGauge from './components/BMIGauge';
import MeasurementForm from './components/MeasurementForm';
import ChartsSection from './components/ChartsSection';
import HistoryTable from './components/HistoryTable';
import ProfileModal from './components/ProfileModal';
import EditMeasurementModal from './components/EditMeasurementModal';
import SupabaseModal from './components/SupabaseModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';

import { computeHealthStats } from './utils/healthCalculations';
import { exportToCSV } from './utils/csvExport';
import { DEFAULT_HEIGHT_CM, SAMPLE_MEASUREMENTS } from './data/initialData';
import { 
  getSupabase, 
  getActiveConfig,
  signUpUser,
  signInUser,
  signOutUser,
  fetchUserProfile,
  upsertUserProfile,
  fetchUserMeasurements,
  upsertUserMeasurement,
  deleteUserMeasurement
} from './lib/supabase';
import { Sparkles, Trash2, ShieldCheck, Heart, User, LogIn, Lock, CheckCircle2 } from 'lucide-react';

const STORAGE_KEYS = {
  HEIGHT: 'vitalscale_height',
  TARGET_WEIGHT: 'vitalscale_target_weight',
  TARGET_WAIST: 'vitalscale_target_waist',
  MEASUREMENTS: 'vitalscale_measurements',
};

export default function App() {
  // Height and targets state
  const [heightCm, setHeightCm] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HEIGHT);
    return saved ? parseInt(saved, 10) : DEFAULT_HEIGHT_CM;
  });

  const [targetWeight, setTargetWeight] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_WEIGHT);
    return saved ? parseFloat(saved) : 74.0;
  });

  const [targetWaist, setTargetWaist] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_WAIST);
    return saved ? parseFloat(saved) : 84.0;
  });

  // Measurements list state
  const [measurements, setMeasurements] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SAMPLE_MEASUREMENTS;
      }
    }
    return SAMPLE_MEASUREMENTS;
  });

  // Modals & UI state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Supabase state
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Save measurements to localStorage (user-isolated when logged in)
  useEffect(() => {
    if (supabaseUser) {
      localStorage.setItem(`vitalscale_measurements_${supabaseUser.id}`, JSON.stringify(measurements));
    } else {
      localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
    }
  }, [measurements, supabaseUser]);

  // Load user data from Supabase (strictly isolated by user_id)
  const loadUserData = useCallback(async (user) => {
    if (!user) return;
    try {
      // 1. Fetch user's private profile
      const profile = await fetchUserProfile(user.id);
      if (profile) {
        if (profile.height_cm) {
          setHeightCm(Number(profile.height_cm));
          localStorage.setItem(`vitalscale_height_${user.id}`, String(profile.height_cm));
        }
        if (profile.target_weight !== null && profile.target_weight !== undefined) {
          setTargetWeight(Number(profile.target_weight));
        } else {
          setTargetWeight(null);
        }
        if (profile.target_waist !== null && profile.target_waist !== undefined) {
          setTargetWaist(Number(profile.target_waist));
        } else {
          setTargetWaist(null);
        }
      } else {
        // If profile doesn't exist, create it from metadata
        const initialH = user.user_metadata?.height_cm || heightCm || DEFAULT_HEIGHT_CM;
        await upsertUserProfile(user.id, { heightCm: initialH, targetWeight: null, targetWaist: null });
        setHeightCm(initialH);
      }

      // 2. Fetch user's private measurements
      const userRecords = await fetchUserMeasurements(user.id);
      setMeasurements(userRecords);
      localStorage.setItem(`vitalscale_measurements_${user.id}`, JSON.stringify(userRecords));
    } catch (err) {
      console.error('Error loading private user data:', err);
    }
  }, [heightCm]);

  // Subscribe to Supabase Auth state changes
  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setIsSupabaseConnected(false);
      setSupabaseUser(null);
      return;
    }

    setIsSupabaseConnected(true);

    // Initial session check
    client.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setSupabaseUser(data.session.user);
        loadUserData(data.session.user);
      }
    });

    // Reactive Auth listener
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        await loadUserData(session.user);
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        const localSaved = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
        setMeasurements(localSaved ? JSON.parse(localSaved) : SAMPLE_MEASUREMENTS);
        const localH = localStorage.getItem(STORAGE_KEYS.HEIGHT);
        setHeightCm(localH ? parseInt(localH, 10) : DEFAULT_HEIGHT_CM);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // Sorted measurements for stats and last entry
  const sortedChronological = useMemo(() => {
    return [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [measurements]);

  const lastMeasurement = sortedChronological[sortedChronological.length - 1] || null;

  // Compute all health stats
  const stats = useMemo(() => {
    return computeHealthStats(measurements, heightCm);
  }, [measurements, heightCm]);

  // Add new measurement
  const handleAddMeasurement = async (newEntry) => {
    setMeasurements((prev) => {
      const existingIdx = prev.findIndex((m) => m.date === newEntry.date);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...newEntry };
        return updated;
      }
      return [...prev, newEntry];
    });

    showToast('Registro de peso y cintura guardado');

    // Cloud sync strictly isolated by user_id
    if (supabaseUser) {
      try {
        await upsertUserMeasurement(supabaseUser.id, newEntry);
      } catch (err) {
        console.warn('Could not sync entry to Supabase:', err);
      }
    }
  };

  // Update existing measurement (edit)
  const handleUpdateMeasurement = async (updatedEntry) => {
    setMeasurements((prev) => {
      return prev.map((item) => (item.id === updatedEntry.id ? updatedEntry : item));
    });

    showToast('Registro de medida actualizado correctamente');

    if (supabaseUser) {
      try {
        await upsertUserMeasurement(supabaseUser.id, updatedEntry);
      } catch (err) {
        console.warn('Could not update in Supabase:', err);
      }
    }
  };

  // Delete measurement
  const handleDeleteMeasurement = async (id) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    showToast('Registro eliminado', 'info');

    if (supabaseUser) {
      try {
        await deleteUserMeasurement(supabaseUser.id, id);
      } catch (err) {
        console.warn('Could not delete from Supabase:', err);
      }
    }
  };

  // Save profile info (height, target weight, target waist)
  const handleSaveProfile = async (profileData) => {
    setHeightCm(profileData.heightCm);
    
    if (supabaseUser) {
      localStorage.setItem(`vitalscale_height_${supabaseUser.id}`, String(profileData.heightCm));
    } else {
      localStorage.setItem(STORAGE_KEYS.HEIGHT, String(profileData.heightCm));
    }

    if (profileData.targetWeight !== undefined) {
      setTargetWeight(profileData.targetWeight);
      if (profileData.targetWeight !== null) {
        localStorage.setItem(STORAGE_KEYS.TARGET_WEIGHT, String(profileData.targetWeight));
      } else {
        localStorage.removeItem(STORAGE_KEYS.TARGET_WEIGHT);
      }
    }

    if (profileData.targetWaist !== undefined) {
      setTargetWaist(profileData.targetWaist);
      if (profileData.targetWaist !== null) {
        localStorage.setItem(STORAGE_KEYS.TARGET_WAIST, String(profileData.targetWaist));
      } else {
        localStorage.removeItem(STORAGE_KEYS.TARGET_WAIST);
      }
    }

    showToast('Perfil y estatura actualizados. IMC recalculado.');

    if (supabaseUser) {
      try {
        await upsertUserProfile(supabaseUser.id, profileData);
      } catch (err) {
        console.warn('Could not sync profile to Supabase:', err);
      }
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      exportToCSV(measurements, heightCm);
      showToast('Descarga de historial CSV iniciada');
    } catch (err) {
      showToast(err.message || 'Error al exportar CSV', 'error');
    }
  };

  // Import from CSV
  const handleImportMeasurements = async (imported) => {
    setMeasurements((prev) => {
      const dateMap = new Map();
      prev.forEach((item) => dateMap.set(item.date, item));
      imported.forEach((item) => dateMap.set(item.date, item));
      return Array.from(dateMap.values());
    });

    if (supabaseUser) {
      try {
        for (const item of imported) {
          await upsertUserMeasurement(supabaseUser.id, item);
        }
      } catch (err) {
        console.warn('Could not sync imported records to Supabase:', err);
      }
    }

    showToast(`Se han importado ${imported.length} registros exitosamente`);
  };

  // Manual Supabase sync
  const handleSyncData = async () => {
    if (!supabaseUser) {
      showToast('Inicia sesión para sincronizar tus medidas en la nube', 'info');
      setIsAuthModalOpen(true);
      return;
    }

    setIsSyncing(true);
    try {
      await loadUserData(supabaseUser);
      showToast('Sincronización completada con tu cuenta privada');
    } catch (err) {
      showToast(err.message || 'Error durante la sincronización', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Supabase Auth Actions
  const handleAuthSignIn = async (email, password) => {
    const data = await signInUser(email, password);
    if (data?.user) {
      setSupabaseUser(data.user);
      await loadUserData(data.user);
      showToast(`¡Bienvenido de nuevo, ${data.user.email}!`);
    }
  };

  const handleAuthSignUp = async (email, password, initialHeight) => {
    const data = await signUpUser(email, password, { height_cm: initialHeight });
    if (data?.user) {
      setSupabaseUser(data.user);
      try {
        await upsertUserProfile(data.user.id, {
          heightCm: initialHeight,
          targetWeight: null,
          targetWaist: null
        });
      } catch (err) {
        console.warn('Could not initialize profile:', err);
      }
      setHeightCm(initialHeight);
      setMeasurements([]);
      localStorage.setItem(`vitalscale_measurements_${data.user.id}`, JSON.stringify([]));
      showToast('¡Cuenta creada! Tu espacio personal está listo.');
    }
  };

  const handleAuthSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.warn(err);
    }
    setSupabaseUser(null);
    const localSaved = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
    setMeasurements(localSaved ? JSON.parse(localSaved) : SAMPLE_MEASUREMENTS);
    setHeightCm(DEFAULT_HEIGHT_CM);
    showToast('Has cerrado la sesión correctamente');
  };

  // Reset demo data helper
  const handleLoadSampleData = () => {
    setMeasurements(SAMPLE_MEASUREMENTS);
    setHeightCm(175);
    setTargetWeight(74.0);
    setTargetWaist(84.0);
    showToast('Datos de demostración cargados');
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas vaciar todos los registros para empezar desde cero?')) {
      setMeasurements([]);
      showToast('Historial vaciado. Añade tu primera medida.', 'info');
    }
  };

  const activeConfig = getActiveConfig();
  const isSupabaseConfigured = Boolean(activeConfig.url && activeConfig.anonKey);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Top Sticky Navigation */}
      <Navbar
        heightCm={heightCm}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        supabaseUser={supabaseUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleAuthSignOut}
        onExportCSV={handleExportCSV}
        measurementsCount={measurements.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* User Space Banner / Status Callout */}
        {supabaseUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Espacio privado y autenticado: <strong className="text-white">{supabaseUser.email}</strong>. Todos los datos están aislados bajo tu identificador personal.
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleSyncData}
                disabled={isSyncing}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 transition-all"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={handleAuthSignOut}
                className="text-[11px] font-medium text-rose-300 hover:text-rose-200 hover:underline px-2 py-1"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Lock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                Estás en <strong>Modo Local</strong>. Para guardar y proteger tus medidas en tu espacio privado en la nube, inicia sesión o crea tu cuenta.
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-glow-teal transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Iniciar Sesión / Registro</span>
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panel de Control de Salud Personal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Seguimiento de Medidas Corporales & IMC
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Monitorea de forma continua tu evolución de peso, contorno de cintura e Índice de Masa Corporal con cálculo automático y respaldo seguro en la nube.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto z-10">
            {measurements.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Borrar todos los registros para empezar de cero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar datos</span>
              </button>
            )}

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Ajustar Altura ({heightCm} cm)</span>
            </button>
          </div>
        </section>

        {/* 1. KPI Summary Cards */}
        <section aria-label="Tarjetas métricas principales">
          <KPICards
            stats={stats}
            heightCm={heightCm}
            targetWeight={targetWeight}
            targetWaist={targetWaist}
          />
        </section>

        {/* 2. Form & BMI Visual Gauge Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Visual BMI Gauge & Health Insights (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <BMIGauge currentBMI={stats.currentBMI} />

            {/* Quick Health Guidelines Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Criterios de Salud & Referencias</span>
              </h3>
              
              <ul className="text-xs space-y-2 text-slate-400 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0"></span>
                  <span>
                    <strong className="text-slate-200">Fórmula del IMC:</strong> Peso (kg) dividido por la estatura al cuadrado (m²).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                  <span>
                    <strong className="text-slate-200">Cintura saludable:</strong> Se aconseja mantener el perímetro de cintura por debajo de la mitad de tu altura (ICT &lt; 0.50).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                  <span>
                    <strong className="text-slate-200">Consistencia:</strong> Pésate preferiblemente por la mañana, en ayunas y en condiciones similares.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: New Measurement Entry Form (7 cols) */}
          <div className="lg:col-span-7">
            <MeasurementForm
              heightCm={heightCm}
              onAddMeasurement={handleAddMeasurement}
              lastMeasurement={lastMeasurement}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
            />
          </div>

        </section>

        {/* 3. Recharts Section: 2 Independent Time Charts */}
        <section aria-label="Gráficas de evolución temporal">
          <ChartsSection
            measurements={measurements}
            heightCm={heightCm}
            targetWeight={targetWeight}
            targetWaist={targetWaist}
          />
        </section>

        {/* 4. Historical Records Table */}
        <section aria-label="Histórico de registros corporales">
          <HistoryTable
            measurements={measurements}
            heightCm={heightCm}
            onDeleteMeasurement={handleDeleteMeasurement}
            onEditMeasurement={(item) => setEditingMeasurement(item)}
            onExportCSV={handleExportCSV}
            onImportMeasurements={handleImportMeasurements}
            onLoadSampleData={handleLoadSampleData}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} VitalScale • Seguimiento Corporal y Composición de Salud</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Recharts</span>
            <span>•</span>
            <span>Supabase Auth & DB</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isSupabaseConfigured={isSupabaseConfigured}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        onSignIn={handleAuthSignIn}
        onSignUp={handleAuthSignUp}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        heightCm={heightCm}
        targetWeight={targetWeight}
        targetWaist={targetWaist}
        onSaveProfile={handleSaveProfile}
      />

      <EditMeasurementModal
        isOpen={Boolean(editingMeasurement)}
        measurement={editingMeasurement}
        heightCm={heightCm}
        onClose={() => setEditingMeasurement(null)}
        onSave={handleUpdateMeasurement}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isSupabaseConnected={isSupabaseConnected}
        onConfigUpdated={() => {
          const client = getSupabase();
          if (client) {
            setIsSupabaseConnected(true);
            client.auth.getSession().then(({ data }) => {
              if (data?.session?.user) {
                setSupabaseUser(data.session.user);
                loadUserData(data.session.user);
              }
            });
          }
        }}
        onSyncData={handleSyncData}
        isSyncing={isSyncing}
        supabaseUser={supabaseUser}
        onAuthSignIn={handleAuthSignIn}
        onAuthSignUp={handleAuthSignUp}
        onAuthSignOut={handleAuthSignOut}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
