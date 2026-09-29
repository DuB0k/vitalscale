import React, { useState } from 'react';
import { 
  X, 
  Ruler, 
  Target, 
  Save, 
  Info,
  Check
} from 'lucide-react';
import { getHealthyWeightRange } from '../utils/healthCalculations';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  heightCm, 
  targetWeight, 
  targetWaist, 
  onSaveProfile 
}) {
  const [height, setHeight] = useState(String(heightCm || 175));
  const [tWeight, setTWeight] = useState(targetWeight ? String(targetWeight) : '');
  const [tWaist, setTWaist] = useState(targetWaist ? String(targetWaist) : '');

  if (!isOpen) return null;

  const heightNum = parseFloat(height) || 0;
  const healthyRange = getHealthyWeightRange(heightNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (heightNum < 100 || heightNum > 250) {
      alert('Por favor introduce una altura válida en centímetros (100 - 250 cm).');
      return;
    }

    onSaveProfile({
      heightCm: Math.round(heightNum),
      targetWeight: tWeight ? parseFloat(tWeight) : null,
      targetWaist: tWaist ? parseFloat(tWaist) : null
    });
    onClose();
  };

  const presets = [160, 165, 170, 175, 180, 185];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-dropdown rounded-3xl border border-slate-700/80 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Perfil y Configuración Corporal</h3>
            <p className="text-xs text-slate-400">Ajusta tu altura para el cálculo exacto del IMC</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Height Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-teal-400" />
                Altura (en centímetros)
              </span>
              <span className="text-[11px] text-teal-400 font-normal">Obligatorio para IMC</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="250"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                cm
              </span>
            </div>

            {/* Quick Height Presets */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-slate-500 mr-1">Rápido:</span>
              {presets.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setHeight(String(p))}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${
                    height === String(p)
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Healthy Range Hint */}
            {healthyRange && (
              <div className="mt-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
                <div>
                  Para <strong className="text-white">{heightNum} cm</strong>, tu rango de peso saludable estimado (IMC 18.5 - 24.9) es de <strong className="text-white">{healthyRange.min} kg a {healthyRange.max} kg</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Optional Goals Section */}
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Objetivos Opcionales (para mostrar en las gráficas)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Peso Objetivo (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 72.0"
                  value={tWeight}
                  onChange={(e) => setTWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Cintura Objetivo (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 80.0"
                  value={tWaist}
                  onChange={(e) => setTWaist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-glow-teal flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              Guardar Perfil
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
