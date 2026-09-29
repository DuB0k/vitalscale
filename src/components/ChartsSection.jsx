import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Scale, 
  CircleDot, 
  CalendarRange, 
  Sparkles,
  Target
} from 'lucide-react';
import { calculateBMI, formatDate } from '../utils/healthCalculations';

export default function ChartsSection({ 
  measurements = [], 
  heightCm = 175,
  targetWeight = null,
  targetWaist = null 
}) {
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '30d', '90d', 'year'

  // Prepare and filter data sorted chronologically
  const chartData = useMemo(() => {
    if (!measurements || measurements.length === 0) return [];

    const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter by time range if requested
    const now = new Date();
    let filtered = sorted;

    if (timeFilter === '30d') {
      const cut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = sorted.filter(m => new Date(m.date) >= cut);
    } else if (timeFilter === '90d') {
      const cut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = sorted.filter(m => new Date(m.date) >= cut);
    } else if (timeFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = sorted.filter(m => new Date(m.date) >= startOfYear);
    }

    // Fallback to all if filter produces 0 items
    const source = filtered.length > 0 ? filtered : sorted;

    return source.map((item, index) => {
      const prev = index > 0 ? source[index - 1] : null;
      const weightDiff = prev ? Math.round((item.weight - prev.weight) * 10) / 10 : 0;
      const waistDiff = prev ? Math.round((item.waist - prev.waist) * 10) / 10 : 0;
      const bmi = calculateBMI(item.weight, heightCm);

      return {
        ...item,
        formattedDate: formatDate(item.date),
        shortDate: item.date.slice(5), // 'MM-DD'
        weightDiff,
        waistDiff,
        bmi
      };
    });
  }, [measurements, timeFilter, heightCm]);

  // Compute min/max for friendly Y-Axis domains
  const weightDomain = useMemo(() => {
    if (chartData.length === 0) return [60, 90];
    const vals = chartData.map(d => d.weight);
    if (targetWeight) vals.push(Number(targetWeight));
    const min = Math.floor(Math.min(...vals) - 1);
    const max = Math.ceil(Math.max(...vals) + 1);
    return [Math.max(0, min), max];
  }, [chartData, targetWeight]);

  const waistDomain = useMemo(() => {
    if (chartData.length === 0) return [60, 110];
    const vals = chartData.map(d => d.waist);
    if (targetWaist) vals.push(Number(targetWaist));
    const min = Math.floor(Math.min(...vals) - 2);
    const max = Math.ceil(Math.max(...vals) + 2);
    return [Math.max(0, min), max];
  }, [chartData, targetWaist]);

  // Custom Tooltip for Weight Chart
  const CustomWeightTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-dropdown p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
          <div className="font-semibold text-white border-b border-slate-700/50 pb-1 flex items-center justify-between">
            <span>{data.formattedDate}</span>
            <span className="text-[10px] text-slate-400">{data.date}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Peso:</span>
            <span className="font-bold text-teal-300 text-sm">{data.weight} kg</span>
          </div>
          {data.weightDiff !== 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Vs. anterior:</span>
              <span className={`font-semibold ${data.weightDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.weightDiff > 0 ? `+${data.weightDiff}` : data.weightDiff} kg
              </span>
            </div>
          )}
          {data.bmi && (
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400">IMC:</span>
              <span className="font-medium text-slate-200">{data.bmi} kg/m²</span>
            </div>
          )}
          {data.notes && (
            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 line-clamp-2">
              "{data.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Waist Chart
  const CustomWaistTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-dropdown p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1.5 min-w-[170px]">
          <div className="font-semibold text-white border-b border-slate-700/50 pb-1 flex items-center justify-between">
            <span>{data.formattedDate}</span>
            <span className="text-[10px] text-slate-400">{data.date}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Cintura:</span>
            <span className="font-bold text-cyan-300 text-sm">{data.waist} cm</span>
          </div>
          {data.waistDiff !== 0 && (
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Vs. anterior:</span>
              <span className={`font-semibold ${data.waistDiff < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.waistDiff > 0 ? `+${data.waistDiff}` : data.waistDiff} cm
              </span>
            </div>
          )}
          {data.notes && (
            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800 line-clamp-2">
              "{data.notes}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const isDataSufficient = chartData.length >= 2;

  return (
    <div className="space-y-6">
      
      {/* Section Header with Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Evolución Temporal y Analítica</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {chartData.length} registros
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Seguimiento gráfico independiente de peso y contorno de cintura
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {[
            { id: 'all', label: 'Todo' },
            { id: '30d', label: '30 Días' },
            { id: '90d', label: '90 Días' },
            { id: 'year', label: 'Este Año' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setTimeFilter(btn.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === btn.id
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two Independent Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Weight vs Time */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Peso vs. Tiempo</h3>
                <span className="text-[11px] text-slate-400">Evolución en kilogramos (kg)</span>
              </div>
            </div>

            {targetWeight && (
              <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                <Target className="w-3.5 h-3.5" />
                <span>Meta: {targetWeight} kg</span>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {isDataSufficient ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                  <XAxis 
                    dataKey="shortDate" 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155', opacity: 0.5 }}
                  />
                  <YAxis 
                    domain={weightDomain} 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="kg"
                  />
                  <Tooltip content={<CustomWeightTooltip />} />
                  {targetWeight && (
                    <ReferenceLine 
                      y={Number(targetWeight)} 
                      stroke="#2dd4bf" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Meta', fill: '#2dd4bf', fontSize: 10, position: 'right' }} 
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#weightGradient)"
                    dot={{ fill: '#14b8a6', r: 3.5, strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ fill: '#2dd4bf', r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <Scale className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Se requieren al menos 2 registros para la gráfica de peso</p>
                <p className="text-[11px] text-slate-500 mt-1">Añade medidas con diferentes fechas en el formulario superior.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Waist vs Time */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <CircleDot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cintura vs. Tiempo</h3>
                <span className="text-[11px] text-slate-400">Evolución en centímetros (cm)</span>
              </div>
            </div>

            {targetWaist && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                <Target className="w-3.5 h-3.5" />
                <span>Meta: {targetWaist} cm</span>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {isDataSufficient ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waistGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />
                  <XAxis 
                    dataKey="shortDate" 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155', opacity: 0.5 }}
                  />
                  <YAxis 
                    domain={waistDomain} 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="cm"
                  />
                  <Tooltip content={<CustomWaistTooltip />} />
                  {targetWaist && (
                    <ReferenceLine 
                      y={Number(targetWaist)} 
                      stroke="#38bdf8" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Meta', fill: '#38bdf8', fontSize: 10, position: 'right' }} 
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="waist"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#waistGradient)"
                    dot={{ fill: '#06b6d4', r: 3.5, strokeWidth: 1.5, stroke: '#0f172a' }}
                    activeDot={{ fill: '#38bdf8', r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <CircleDot className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Se requieren al menos 2 registros para la gráfica de cintura</p>
                <p className="text-[11px] text-slate-500 mt-1">Añade medidas con diferentes fechas en el formulario superior.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
