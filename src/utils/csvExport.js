import { calculateBMI, getBMICategory } from './healthCalculations';

/**
 * Exports measurements to a standard CSV file with UTF-8 BOM for Excel compatibility
 * @param {Array} measurements 
 * @param {number} heightCm 
 */
export function exportToCSV(measurements = [], heightCm = 175) {
  if (!measurements || measurements.length === 0) {
    throw new Error('No hay registros para exportar');
  }

  // Sort chronological ascending
  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));

  const headers = [
    'Fecha',
    'Peso (kg)',
    'Cintura (cm)',
    'Altura (cm)',
    'IMC',
    'Categoria IMC',
    'Notas'
  ];

  const rows = sorted.map(m => {
    const bmi = calculateBMI(m.weight, heightCm);
    const cat = getBMICategory(bmi).category;
    const cleanNotes = (m.notes || '').replace(/"/g, '""');

    return [
      m.date,
      m.weight,
      m.waist,
      heightCm,
      bmi !== null ? bmi.toFixed(1) : '',
      `"${cat}"`,
      `"${cleanNotes}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `vitalscale_medidas_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses uploaded CSV content and extracts valid measurement items
 * @param {string} textContent
 * @returns {Array} parsed records
 */
export function parseCSV(textContent) {
  const lines = textContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Remove BOM if present
  const cleanHeader = lines[0].replace(/^\uFEFF/, '').toLowerCase();
  const headerCols = cleanHeader.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  
  const dateIdx = headerCols.findIndex(c => c.includes('fecha') || c.includes('date'));
  const weightIdx = headerCols.findIndex(c => c.includes('peso') || c.includes('weight'));
  const waistIdx = headerCols.findIndex(c => c.includes('cintura') || c.includes('waist'));
  const notesIdx = headerCols.findIndex(c => c.includes('nota') || c.includes('note'));

  if (dateIdx === -1 || weightIdx === -1 || waistIdx === -1) {
    throw new Error('El archivo CSV debe contener al menos las columnas: Fecha, Peso y Cintura.');
  }

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple CSV parser supporting quotes
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let charIndex = 0; charIndex < rawLine.length; charIndex++) {
      const char = rawLine[charIndex];
      if (char === '"' && (charIndex === 0 || rawLine[charIndex - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const dateVal = values[dateIdx]?.replace(/^"|"$/g, '').trim();
    const weightVal = parseFloat(values[weightIdx]?.replace(/^"|"$/g, '').replace(',', '.'));
    const waistVal = parseFloat(values[waistIdx]?.replace(/^"|"$/g, '').replace(',', '.'));
    const notesVal = notesIdx !== -1 && values[notesIdx] ? values[notesIdx].replace(/^"|"$/g, '').trim() : '';

    if (dateVal && !isNaN(weightVal) && !isNaN(waistVal)) {
      results.push({
        id: 'csv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        date: dateVal,
        weight: weightVal,
        waist: waistVal,
        notes: notesVal
      });
    }
  }

  return results;
}
