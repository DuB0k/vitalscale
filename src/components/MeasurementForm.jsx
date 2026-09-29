import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  Scale, 
  CircleDot, 
  FileText, 
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateBMI, getBMICategory } from '../utils/healthCalculations';

import DatePickerField from './DatePickerField';

export default function MeasurementForm({ 
  heightCm, 
  onAddMeasurement, 
  lastMeasurement,
  onOpenProfileModal 
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState(lastMeasurement ? String(lastMeasurement.weight) : '75.0');
  const [waist, setWaist] = useState(lastMeasurement ? String(lastMeasurement.waist) : '85.0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Sync default values when lastMeasurement updates if fields are blank
  useEffect(() => {
    if (lastMeasurement && !weight && !waist) {
      setWeight(String(lastMeasurement.weight));
      setWaist(String(lastMeasurement.waist));
    }
  }, [lastMeasurement]);

  // Live BMI calculation
  const weightNum = parseFloat(weight);
  const waistNum = parseFloat(waist);
  const liveBMI = (!isNaN(weightNum) && weightNum > 0 && heightCm > 0)
    ? calculateBMI(weightNum, heightCm)
    : null;
  const liveCategory = getBMICategory(liveBMI);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      alert('Por favor selecciona una fecha');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 300) {
      alert('Por favor introduce un peso válido en kg (entre 20 y 300 kg)');
      return;
    }

    if (isNaN(waistNum) || waistNum <= 30 || waistNum > 250) {
      alert('Por favor introduce una medida de cintura válida en cm (entre 30 y 250 cm)');
      return;
    }

    setIsSubmitting(true);

    try {
      const newEntry = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        date,
        weight: Math.round(weightNum * 10) / 10,
        waist: Math.round(waistNum * 10) / 10,
        notes: notes.trim()
      };

      await onAddMeasurement(newEntry);

      // Trigger confetti if in normal BMI or progress
      if (liveBMI && liveBMI >= 18.5 && liveBMI <= 24.9) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#14b8a6', '#10b981', '#38bdf8']
        });
      }

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);
      setNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nudge = (setter, currentVal, delta, min = 0) => {
    const val = parseFloat(currentVal) || 0;
    const next = Math.max(min, Math.round((val + delta) * 10) / 10);
    setter(next.toFixed(1));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Registrar Nueva Medida</h2>
            <p className="text-xs text-slate-400">Introduce tus medidas corporales del día</p>
          </div>
        </div>

        {justAdded && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Date Selection Component */}
        <DatePickerField
          value={date}
          onChange={setDate}
          max={todayStr}
          label="Fecha del registro"
        />

        {/* Two Columns: Weight & Waist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Weight Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-teal-400" />
                Peso (kg)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudge(setWeight, weight, -0.5, 30)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
                  title="Restar 0.5 kg"
                >
                  -0.5
                </button>
                <button
                  type="button"
                  onClick={() => nudge(setWeight, weight, +0.5)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
                  title="Sumar 0.5 kg"
                >
                  +0.5
                </button>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="Ej. 76.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* Waist Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-cyan-400" />
                Cintura (cm)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudge(setWaist, waist, -0.5, 40)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
                  title="Restar 0.5 cm"
                >
                  -0.5
                </button>
                <button
                  type="button"
                  onClick={() => nudge(setWaist, waist, +0.5)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
                  title="Sumar 0.5 cm"
                >
                  +0.5
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                placeholder="Ej. 85.0"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all pr-12"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                cm
              </span>
            </div>
          </div>

        </div>

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">IMC Calculado:</span>
            {liveBMI ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  {liveBMI} <span className="text-[10px] text-slate-400 font-normal">kg/m²</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${liveCategory.badgeClass}`}>
                  {liveCategory.category}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">Introduce peso</span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="text-[11px] text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
          >
            Altura: {heightCm} cm
          </button>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notas u observaciones <span className="text-slate-500 font-normal lowercase">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="Ej. En ayunas después de correr, descanso adecuado..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={140}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-sm shadow-glow-teal flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Guardando registro...</span>
          ) : (
            <>
              <span>Guardar Registro</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>

      </form>
    </div>
  );
}
