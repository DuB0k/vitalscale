import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Scale, 
  CircleDot, 
  FileText, 
  Save, 
  Calendar,
  Activity
} from 'lucide-react';
import DatePickerField from './DatePickerField';
import { calculateBMI, getBMICategory } from '../utils/healthCalculations';

export default function EditMeasurementModal({ 
  isOpen, 
  measurement, 
  heightCm, 
  onClose, 
  onSave 
}) {
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (measurement) {
      setDate(measurement.date || '');
      setWeight(String(measurement.weight || ''));
      setWaist(String(measurement.waist || ''));
      setNotes(measurement.notes || '');
    }
  }, [measurement]);

  if (!isOpen || !measurement) return null;

  const weightNum = parseFloat(weight);
  const waistNum = parseFloat(waist);
  const liveBMI = (!isNaN(weightNum) && weightNum > 0 && heightCm > 0)
    ? calculateBMI(weightNum, heightCm)
    : null;
  const liveCategory = getBMICategory(liveBMI);

  const nudge = (setter, currentVal, delta, min = 0) => {
    const val = parseFloat(currentVal) || 0;
    const next = Math.max(min, Math.round((val + delta) * 10) / 10);
    setter(next.toFixed(1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      alert('Por favor selecciona una fecha válida.');
      return;
    }

    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 300) {
      alert('Por favor introduce un peso válido en kg (entre 20 y 300 kg).');
      return;
    }

    if (isNaN(waistNum) || waistNum <= 30 || waistNum > 250) {
      alert('Por favor introduce una medida de cintura válida en cm (entre 30 y 250 cm).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...measurement,
        date,
        weight: Math.round(weightNum * 10) / 10,
        waist: Math.round(waistNum * 10) / 10,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-dropdown rounded-3xl border border-slate-700/80 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Editar Medida Corporal</h3>
            <p className="text-xs text-slate-400">Corrige la fecha, peso, cintura u observaciones del registro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Date Picker Component */}
          <DatePickerField
            value={date}
            onChange={setDate}
            max={todayStr}
            label="Fecha del registro a corregir"
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
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(setWeight, weight, +0.5)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
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
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all pr-12"
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
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(setWaist, waist, +0.5)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 active:scale-95"
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
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

          </div>

          {/* Live IMC Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">IMC Recalculado:</span>
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
                <span className="text-xs text-slate-500 italic">—</span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Estatura: {heightCm} cm
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notas u observaciones
            </label>
            <input
              type="text"
              placeholder="Ej. Corrección por error de tipeo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={140}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
