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
import Toast from './components/Toast';

import { computeHealthStats } from './utils/healthCalculations';
import { exportToCSV } from './utils/csvExport';
import { DEFAULT_HEIGHT_CM, SAMPLE_MEASUREMENTS } from './data/initialData';
import { getSupabase, getActiveConfig } from './lib/supabase';
import { Sparkles, Trash2, ShieldCheck, Heart } from 'lucide-react';

const STORAGE_KEYS = {
  HEIGHT: 'vitalscale_height',
  TARGET_WEIGHT: 'vitalscale_target_weight',
  TARGET_WAIST: 'vitalscale_target_waist',
  MEASUREMENTS: 'vitalscale_measurements',
  HAS_SEEDED: 'vitalscale_seeded_v1'
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
    // Seed initial demo data so application is immediately visual and ready
    return SAMPLE_MEASUREMENTS;
  });

  // Modals & UI state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
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

  // Save measurements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
  }, [measurements]);

  // Check Supabase connection and user session
  const checkSupabaseStatus = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setIsSupabaseConnected(false);
      setSupabaseUser(null);
      return;
    }

    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data?.session?.user) {
        setSupabaseUser(data.session.user);
      } else {
        setSupabaseUser(null);
      }
      setIsSupabaseConnected(true);
    } catch {
      setIsSupabaseConnected(false);
    }
  }, []);

  useEffect(() => {
    checkSupabaseStatus();
  }, [checkSupabaseStatus]);

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
      // Check if entry for same date exists, update it or append
      const existingIdx = prev.findIndex((m) => m.date === newEntry.date);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...newEntry };
        return updated;
      }
      return [...prev, newEntry];
    });

    showToast('Registro de peso y cintura guardado correctamente');

    // Cloud sync if connected
    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from('body_measurements').upsert({
          id: newEntry.id,
          user_id: supabaseUser?.id || '00000000-0000-0000-0000-000000000000',
          date: newEntry.date,
          weight: newEntry.weight,
          waist: newEntry.waist,
          notes: newEntry.notes || ''
        });
        if (error) console.warn('Supabase sync warning:', error.message);
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

    // Cloud sync if connected
    const client = getSupabase();
    if (client) {
      try {
        await client.from('body_measurements').upsert({
          id: updatedEntry.id,
          user_id: supabaseUser?.id || '00000000-0000-0000-0000-000000000000',
          date: updatedEntry.date,
          weight: updatedEntry.weight,
          waist: updatedEntry.waist,
          notes: updatedEntry.notes || ''
        });
      } catch (err) {
        console.warn('Could not update in Supabase:', err);
      }
    }
  };

  // Delete measurement
  const handleDeleteMeasurement = async (id) => {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
    showToast('Registro eliminado', 'info');

    const client = getSupabase();
    if (client) {
      try {
        await client.from('body_measurements').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete from Supabase:', err);
      }
    }
  };

  // Save profile info
  const handleSaveProfile = async (profileData) => {
    setHeightCm(profileData.heightCm);
    localStorage.setItem(STORAGE_KEYS.HEIGHT, String(profileData.heightCm));

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

    showToast('Perfil y altura actualizados. IMC recalculado.');

    // Save to Supabase profile table if connected and logged in
    const client = getSupabase();
    if (client && supabaseUser) {
      try {
        await client.from('profiles').upsert({
          id: supabaseUser.id,
          height_cm: profileData.heightCm,
          target_weight: profileData.targetWeight,
          target_waist: profileData.targetWaist,
          updated_at: new Date().toISOString()
        });
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
  const handleImportMeasurements = (imported) => {
    setMeasurements((prev) => {
      // Merge unique by date
      const dateMap = new Map();
      prev.forEach((item) => dateMap.set(item.date, item));
      imported.forEach((item) => dateMap.set(item.date, item));
      return Array.from(dateMap.values());
    });
    showToast(`Se han importado ${imported.length} registros exitosamente`);
  };

  // Manual Supabase bidirectional sync
  const handleSyncData = async () => {
    const client = getSupabase();
    if (!client) {
      showToast('Configura Supabase primero', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Fetch remote measurements
      const { data: remoteRecords, error: fetchErr } = await client
        .from('body_measurements')
        .select('*');

      if (fetchErr) throw fetchErr;

      // 2. Merge local and remote
      const map = new Map();
      measurements.forEach((m) => map.set(m.id || m.date, m));

      if (remoteRecords && remoteRecords.length > 0) {
        remoteRecords.forEach((r) => {
          map.set(r.id || r.date, {
            id: r.id,
            date: r.date,
            weight: Number(r.weight),
            waist: Number(r.waist),
            notes: r.notes || ''
          });
        });
      }

      const merged = Array.from(map.values());
      setMeasurements(merged);

      // 3. Push any local records that weren't in remote
      if (supabaseUser) {
        const payload = merged.map((m) => ({
          id: m.id,
          user_id: supabaseUser.id,
          date: m.date,
          weight: m.weight,
          waist: m.waist,
          notes: m.notes || ''
        }));
        await client.from('body_measurements').upsert(payload);
      }

      showToast('Sincronización completada con Supabase');
    } catch (err) {
      showToast(err.message || 'Error durante la sincronización', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Supabase Auth actions
  const handleAuthSignIn = async (email, password) => {
    const client = getSupabase();
    if (!client) throw new Error('Cliente Supabase no configurado');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSupabaseUser(data.user);
    showToast(`Bienvenido, ${data.user.email}`);
  };

  const handleAuthSignUp = async (email, password) => {
    const client = getSupabase();
    if (!client) throw new Error('Cliente Supabase no configurado');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    showToast('Cuenta creada con éxito.');
    if (data.user) setSupabaseUser(data.user);
  };

  const handleAuthSignOut = async () => {
    const client = getSupabase();
    if (client) await client.auth.signOut();
    setSupabaseUser(null);
    showToast('Sesión cerrada');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Top Sticky Navigation */}
      <Navbar
        heightCm={heightCm}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        supabaseUser={supabaseUser}
        onExportCSV={handleExportCSV}
        measurementsCount={measurements.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Hero Section / Welcome Banner */}
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
            <span>Supabase Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
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
        onConfigUpdated={checkSupabaseStatus}
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
