import React from 'react';
import { 
  Scale, 
  CircleDot, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  Heart,
  Target,
  Minus
} from 'lucide-react';
import { calculateWHtR } from '../utils/healthCalculations';

export default function KPICards({ stats, heightCm, targetWeight, targetWaist }) {
  const {
    currentWeight,
    currentWaist,
    currentBMI,
    currentBMICategory,
    weightChangeTotal,
    waistChangeTotal,
    bmiChangeTotal,
    minWeight,
    maxWeight,
    healthyRange
  } = stats;

  const whtr = calculateWHtR(currentWaist, heightCm);

  // Helper for trend badge
  const renderTrend = (value, unit = 'kg', inverseIsGood = true) => {
    if (value === 0 || value === null || isNaN(value)) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
          <Minus className="w-3 h-3" /> Sin cambios
        </span>
      );
    }
    const isDown = value < 0;
    // For weight/waist reduction is usually good
    const isPositiveOutcome = inverseIsGood ? isDown : !isDown;

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
          isPositiveOutcome
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}
      >
        {isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
        <span>{value > 0 ? `+${value}` : value} {unit}</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* 1. Current Weight Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-teal-500/40 hover:shadow-glow-teal group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-teal-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Scale className="w-4 h-4" />
            </div>
            <span>Peso Actual</span>
          </div>
          {renderTrend(weightChangeTotal, 'kg', true)}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {currentWeight !== null ? currentWeight.toFixed(1) : '—'}
          </span>
          <span className="text-slate-400 font-medium text-sm">kg</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Mín: {minWeight !== null ? `${minWeight} kg` : '—'}</span>
          <span>Máx: {maxWeight !== null ? `${maxWeight} kg` : '—'}</span>
          {targetWeight && (
            <span className="text-teal-400 font-medium">Meta: {targetWeight} kg</span>
          )}
        </div>
      </div>

      {/* 2. Current Waist Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-cyan-500/40 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CircleDot className="w-4 h-4" />
            </div>
            <span>Cintura Actual</span>
          </div>
          {renderTrend(waistChangeTotal, 'cm', true)}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {currentWaist !== null ? currentWaist.toFixed(1) : '—'}
          </span>
          <span className="text-slate-400 font-medium text-sm">cm</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Relación Cintura/Altura:</span>
          <span className={`font-semibold ${whtr && whtr <= 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {whtr ? `${whtr} (${whtr <= 0.5 ? 'Óptimo' : 'Alerta'})` : '—'}
          </span>
        </div>
      </div>

      {/* 3. BMI (IMC) Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <span>IMC Actual</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${currentBMICategory.badgeClass}`}>
            {currentBMICategory.category}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {currentBMI !== null ? currentBMI.toFixed(1) : '—'}
          </span>
          <span className="text-slate-400 font-medium text-xs">kg/m²</span>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 truncate" title={currentBMICategory.description}>
          {currentBMICategory.description}
        </div>
      </div>

      {/* 4. Healthy Range & Target Card */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Heart className="w-4 h-4" />
            </div>
            <span>Rango Saludable</span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {heightCm} cm
          </span>
        </div>

        <div className="mb-2">
          {healthyRange ? (
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight">
              {healthyRange.min} - {healthyRange.max} <span className="text-xs font-medium text-slate-400">kg</span>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Configura tu altura</div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Rango IMC 18.5 - 24.9</span>
          {currentWeight && healthyRange && (
            <span className={`font-semibold ${
              currentWeight > healthyRange.max 
                ? 'text-amber-400' 
                : currentWeight < healthyRange.min 
                ? 'text-sky-400' 
                : 'text-emerald-400'
            }`}>
              {currentWeight > healthyRange.max 
                ? `+${(currentWeight - healthyRange.max).toFixed(1)} kg s/máx` 
                : currentWeight < healthyRange.min 
                ? `${(healthyRange.min - currentWeight).toFixed(1)} kg b/mín` 
                : '✓ En rango ideal'}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
