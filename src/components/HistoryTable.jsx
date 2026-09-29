import React, { useState, useMemo, useRef } from 'react';
import { 
  Table, 
  Trash2, 
  Edit3,
  Download, 
  Upload, 
  Search, 
  ArrowUpDown, 
  AlertCircle,
  FileSpreadsheet,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { calculateBMI, getBMICategory, formatDate } from '../utils/healthCalculations';
import { parseCSV } from '../utils/csvExport';

export default function HistoryTable({ 
  measurements = [], 
  heightCm = 175, 
  onDeleteMeasurement,
  onEditMeasurement,
  onExportCSV,
  onImportMeasurements,
  onLoadSampleData
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'weight-desc', 'weight-asc'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const fileInputRef = useRef(null);

  // Compute records with BMI and variations
  const processedRecords = useMemo(() => {
    // Sort chronological ascending first to calculate consecutive diffs
    const chrono = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));

    const enriched = chrono.map((item, idx) => {
      const prev = idx > 0 ? chrono[idx - 1] : null;
      const weightDiff = prev ? Math.round((item.weight - prev.weight) * 10) / 10 : null;
      const waistDiff = prev ? Math.round((item.waist - prev.waist) * 10) / 10 : null;
      const bmi = calculateBMI(item.weight, heightCm);
      const category = getBMICategory(bmi);

      return {
        ...item,
        weightDiff,
        waistDiff,
        bmi,
        category,
        formattedDate: formatDate(item.date)
      };
    });

    // Apply search filter
    let filtered = enriched.filter(rec => {
      const q = searchTerm.toLowerCase();
      return (
        rec.date.toLowerCase().includes(q) ||
        rec.formattedDate.toLowerCase().includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q)) ||
        rec.category.category.toLowerCase().includes(q)
      );
    });

    // Apply sort
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'weight-desc') {
      filtered.sort((a, b) => b.weight - a.weight);
    } else if (sortBy === 'weight-asc') {
      filtered.sort((a, b) => a.weight - b.weight);
    }

    return filtered;
  }, [measurements, heightCm, searchTerm, sortBy]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const imported = parseCSV(text);
        if (imported.length === 0) {
          alert('No se encontraron registros válidos en el archivo CSV.');
          return;
        }
        onImportMeasurements(imported);
      } catch (err) {
        alert(err.message || 'Error al importar CSV');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const renderDiffPill = (diff, unit) => {
    if (diff === null || diff === undefined) return <span className="text-slate-500">—</span>;
    if (diff === 0) return <span className="text-slate-500 text-xs flex items-center justify-center"><Minus className="w-2.5 h-2.5" /></span>;
    const isDown = diff < 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isDown ? 'text-emerald-400' : 'text-amber-400'}`}>
        {isDown ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
        {diff > 0 ? `+${diff}` : diff}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      
      {/* Top Bar with Search & Actions */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Histórico de Medidas Corporales</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {measurements.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro cronológico detallado, cálculo de IMC y gestión de datos
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Search Box */}
          <div className="relative min-w-[160px] sm:min-w-[190px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar fecha o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="date-desc">Más reciente primero</option>
              <option value="date-asc">Más antiguo primero</option>
              <option value="weight-desc">Mayor peso</option>
              <option value="weight-asc">Menor peso</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            disabled={measurements.length === 0}
            title="Descargar archivo CSV compatible con Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {/* Import CSV Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar un archivo CSV previamente exportado"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Importar CSV</span>
          </button>

        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {processedRecords.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Peso</th>
                <th className="py-3 px-4 text-center">Var. Peso</th>
                <th className="py-3 px-4">Cintura</th>
                <th className="py-3 px-4 text-center">Var. Cintura</th>
                <th className="py-3 px-4">IMC Actual</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Notas</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {processedRecords.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Fecha */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-white block">{item.formattedDate}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                  </td>

                  {/* Peso */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-white">{item.weight.toFixed(1)}</span>
                    <span className="text-slate-400 text-[11px] ml-1">kg</span>
                  </td>

                  {/* Var Peso */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    {renderDiffPill(item.weightDiff, 'kg')}
                  </td>

                  {/* Cintura */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-white">{item.waist.toFixed(1)}</span>
                    <span className="text-slate-400 text-[11px] ml-1">cm</span>
                  </td>

                  {/* Var Cintura */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    {renderDiffPill(item.waistDiff, 'cm')}
                  </td>

                  {/* IMC */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-extrabold text-white text-sm">{item.bmi ?? '—'}</span>
                    <span className="text-[10px] text-slate-500 ml-1">kg/m²</span>
                  </td>

                  {/* Categoria */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.category.badgeClass}`}>
                      {item.category.category}
                    </span>
                  </td>

                  {/* Notas */}
                  <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate" title={item.notes || ''}>
                    {item.notes ? (
                      <span className="italic">"{item.notes}"</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Acciones: Editar y Eliminar */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    {deleteConfirmId === item.id ? (
                      <div className="inline-flex items-center gap-1.5 animate-fade-in">
                        <button
                          onClick={() => {
                            onDeleteMeasurement(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm"
                        >
                          Sí, borrar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEditMeasurement && onEditMeasurement(item)}
                          title="Editar este registro"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors opacity-80 group-hover:opacity-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          title="Eliminar este registro"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No hay registros disponibles</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchTerm 
                ? 'No se encontraron registros que coincidan con la búsqueda.' 
                : 'Empieza introduciendo tu primer registro de peso y cintura arriba.'}
            </p>
            {measurements.length === 0 && onLoadSampleData && (
              <button
                onClick={onLoadSampleData}
                className="mt-4 px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Cargar datos de demostración
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
