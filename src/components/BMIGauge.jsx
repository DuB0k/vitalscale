import React from 'react';
import { getBMICategory } from '../utils/healthCalculations';
import { Info } from 'lucide-react';

export default function BMIGauge({ currentBMI }) {
  const categoryInfo = getBMICategory(currentBMI);

  // Clamp BMI for visual positioning between 15 and 38
  const minScale = 15;
  const maxScale = 38;
  const effectiveBmi = currentBMI ? Math.min(Math.max(currentBMI, minScale), maxScale) : null;
  const percentage = effectiveBmi ? ((effectiveBmi - minScale) / (maxScale - minScale)) * 100 : 50;

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Escala Visual de Índice de Masa Corporal (IMC)</span>
            <span className="text-xs font-normal text-slate-400">OMS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estado actual: <strong className={categoryInfo.textClass}>{categoryInfo.category}</strong>
            {currentBMI && ` (${currentBMI} kg/m²)`}
          </p>
        </div>
        
        {currentBMI && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs">
            <span className="text-slate-400">Tu valor:</span>
            <span className={`font-bold ${categoryInfo.textClass}`}>{currentBMI}</span>
          </div>
        )}
      </div>

      {/* Visual Bar Gauge */}
      <div className="relative pt-6 pb-2">
        {/* Dynamic Needle / Marker Pin */}
        {currentBMI !== null && currentBMI !== undefined && (
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-700 ease-out z-10"
            style={{ left: `${percentage}%` }}
          >
            <div className="px-2 py-0.5 rounded bg-white text-slate-950 text-[11px] font-extrabold shadow-lg shadow-black/50 border border-slate-200">
              {currentBMI}
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white"></div>
          </div>
        )}

        {/* Multi-segment Colored Bar */}
        <div className="h-3 w-full rounded-full flex overflow-hidden p-0.5 bg-slate-900 border border-slate-700/60 shadow-inner">
          {/* Bajo peso (<18.5) -> (18.5-15)/(38-15) = 3.5/23 ≈ 15.2% */}
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-l-full relative group cursor-pointer"
            style={{ width: '15.2%' }}
            title="Bajo peso (< 18.5)"
          />
          {/* Normal (18.5 - 24.9) -> (25-18.5)/23 = 6.5/23 ≈ 28.3% */}
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 relative group cursor-pointer"
            style={{ width: '28.3%' }}
            title="Peso normal (18.5 - 24.9)"
          />
          {/* Sobrepeso (25 - 29.9) -> (30-25)/23 = 5/23 ≈ 21.7% */}
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 relative group cursor-pointer"
            style={{ width: '21.7%' }}
            title="Sobrepeso (25.0 - 29.9)"
          />
          {/* Obesidad (>=30) -> (38-30)/23 = 8/23 ≈ 34.8% */}
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-r-full relative group cursor-pointer"
            style={{ width: '34.8%' }}
            title="Obesidad (≥ 30.0)"
          />
        </div>

        {/* Scale labels under the bar */}
        <div className="grid grid-cols-4 text-center mt-2.5 text-[11px] font-medium text-slate-400">
          <div className="text-left text-sky-400 pl-1">
            <span>Bajo peso</span>
            <div className="text-[10px] text-slate-500">&lt; 18.5</div>
          </div>
          <div className="text-center text-emerald-400">
            <span>Saludable</span>
            <div className="text-[10px] text-slate-500">18.5 - 24.9</div>
          </div>
          <div className="text-center text-amber-400">
            <span>Sobrepeso</span>
            <div className="text-[10px] text-slate-500">25.0 - 29.9</div>
          </div>
          <div className="text-right text-rose-400 pr-1">
            <span>Obesidad</span>
            <div className="text-[10px] text-slate-500">&ge; 30.0</div>
          </div>
        </div>
      </div>

    </div>
  );
}
