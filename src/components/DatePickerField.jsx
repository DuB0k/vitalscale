import React, { useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { formatDate } from '../utils/healthCalculations';

export default function DatePickerField({ 
  value, 
  onChange, 
  label = 'Fecha del registro',
  max
}) {
  const inputRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to shift date by N days
  const shiftDays = (daysDelta) => {
    try {
      const parts = (value || todayStr).split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + daysDelta);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const newDateStr = `${year}-${month}-${day}`;
      
      if (max && newDateStr > max) return;
      onChange(newDateStr);
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for quick presets
  const setQuickDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
  };

  const handleOpenPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  const formattedDisplay = formatDate(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          {label}
        </label>
        
        {/* Day shift controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftDays(-1)}
            title="Día anterior (-1)"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => shiftDays(1)}
            disabled={max && value >= max}
            title="Día siguiente (+1)"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Date Input with Calendar Trigger */}
      <div 
        onClick={handleOpenPicker}
        className="group relative flex items-center bg-slate-900/90 border border-slate-700/80 hover:border-teal-500/60 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500"
      >
        <Calendar className="w-4 h-4 text-teal-400 mr-2.5 shrink-0 group-hover:scale-110 transition-transform" />
        
        {/* Native HTML5 date input - both manual typing and calendar picker */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={max || todayStr}
          required
          className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
        />

        {/* Human friendly readable badge */}
        <span className="hidden sm:inline-flex text-[11px] text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20 whitespace-nowrap ml-2 pointer-events-none">
          {formattedDisplay}
        </span>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] text-slate-500 font-medium mr-1">Rápido:</span>
        <button
          type="button"
          onClick={() => setQuickDate(0)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
            value === todayStr 
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' 
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => setQuickDate(1)}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
        >
          Ayer
        </button>
        <button
          type="button"
          onClick={() => setQuickDate(2)}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
        >
          Hace 2 días
        </button>
        <button
          type="button"
          onClick={() => setQuickDate(7)}
          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all"
        >
          Hace 1 sem.
        </button>
      </div>
    </div>
  );
}
