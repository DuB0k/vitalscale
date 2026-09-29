/**
 * Health and Body Measurement Calculations
 */

/**
 * Calculates Body Mass Index (BMI / IMC)
 * Formula: weight (kg) / (height (m) ^ 2)
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number|null}
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Returns detailed BMI category classification and color coding
 * @param {number} bmi
 * @returns {object}
 */
export function getBMICategory(bmi) {
  if (bmi === null || bmi === undefined || isNaN(bmi)) {
    return {
      category: 'No disponible',
      shortName: 'N/A',
      color: 'slate',
      badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
      textClass: 'text-slate-400',
      bgGlow: 'rgba(148, 163, 184, 0.2)',
      description: 'Configura tu altura para calcular tu IMC.',
      range: '—'
    };
  }

  if (bmi < 18.5) {
    return {
      category: 'Bajo peso',
      shortName: 'Bajo peso',
      color: 'sky',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      textClass: 'text-sky-400',
      bgGlow: 'rgba(56, 189, 248, 0.25)',
      description: 'Tu peso está por debajo del rango recomendado.',
      range: '< 18.5'
    };
  }

  if (bmi <= 24.9) {
    return {
      category: 'Peso normal',
      shortName: 'Saludable',
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      textClass: 'text-emerald-400',
      bgGlow: 'rgba(16, 185, 129, 0.25)',
      description: '¡Excelente! Estás en el rango óptimo de peso para tu estatura.',
      range: '18.5 - 24.9'
    };
  }

  if (bmi <= 29.9) {
    return {
      category: 'Sobrepeso',
      shortName: 'Sobrepeso',
      color: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      textClass: 'text-amber-400',
      bgGlow: 'rgba(245, 158, 11, 0.25)',
      description: 'Tu peso está ligeramente por encima del rango saludable recomendado.',
      range: '25.0 - 29.9'
    };
  }

  if (bmi <= 34.9) {
    return {
      category: 'Obesidad (Clase I)',
      shortName: 'Obesidad I',
      color: 'rose',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      textClass: 'text-rose-400',
      bgGlow: 'rgba(244, 63, 94, 0.25)',
      description: 'Moderado aumento en el riesgo de factores de salud.',
      range: '30.0 - 34.9'
    };
  }

  return {
    category: 'Obesidad (Clase II+)',
    shortName: 'Obesidad severa',
    color: 'red',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/40',
    textClass: 'text-red-400',
    bgGlow: 'rgba(239, 68, 68, 0.3)',
    description: 'Riesgo elevado. Es conveniente consultar a un especialista de la salud.',
    range: '≥ 35.0'
  };
}

/**
 * Calculates healthy weight range (BMI 18.5 - 24.9) for a given height
 * @param {number} heightCm
 * @returns {{min: number, max: number}|null}
 */
export function getHealthyWeightRange(heightCm) {
  if (!heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const h2 = heightM * heightM;
  return {
    min: Math.round(18.5 * h2 * 10) / 10,
    max: Math.round(24.9 * h2 * 10) / 10
  };
}

/**
 * Calculates Waist-to-Height Ratio (WHtR / ICT)
 * Rule of thumb: keep waist less than half your height (< 0.5)
 * @param {number} waistCm
 * @param {number} heightCm
 * @returns {number|null}
 */
export function calculateWHtR(waistCm, heightCm) {
  if (!waistCm || !heightCm || heightCm <= 0 || waistCm <= 0) return null;
  return Math.round((waistCm / heightCm) * 100) / 100;
}

/**
 * Computes comparative statistics across historical records
 * @param {Array} measurements - Array of measurement objects sorted by date
 * @param {number} heightCm
 */
export function computeHealthStats(measurements = [], heightCm = 175) {
  if (!measurements || measurements.length === 0) {
    return {
      totalRecords: 0,
      currentWeight: null,
      currentWaist: null,
      currentBMI: null,
      currentBMICategory: getBMICategory(null),
      initialWeight: null,
      initialWaist: null,
      weightChangeTotal: 0,
      waistChangeTotal: 0,
      bmiChangeTotal: 0,
      minWeight: null,
      maxWeight: null,
      minWaist: null,
      maxWaist: null,
      healthyRange: getHealthyWeightRange(heightCm)
    };
  }

  // Sort chronologically ascending
  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const currentBMI = calculateBMI(latest.weight, heightCm);
  const initialBMI = calculateBMI(first.weight, heightCm);

  const weights = sorted.map(m => Number(m.weight)).filter(w => !isNaN(w) && w > 0);
  const waists = sorted.map(m => Number(m.waist)).filter(w => !isNaN(w) && w > 0);

  const minWeight = weights.length ? Math.min(...weights) : null;
  const maxWeight = weights.length ? Math.max(...weights) : null;
  const minWaist = waists.length ? Math.min(...waists) : null;
  const maxWaist = waists.length ? Math.max(...waists) : null;

  const weightChangeTotal = Math.round((latest.weight - first.weight) * 10) / 10;
  const waistChangeTotal = Math.round((latest.waist - first.waist) * 10) / 10;
  const bmiChangeTotal = currentBMI && initialBMI ? Math.round((currentBMI - initialBMI) * 10) / 10 : 0;

  return {
    totalRecords: measurements.length,
    currentWeight: latest.weight,
    currentWaist: latest.waist,
    currentBMI,
    currentBMICategory: getBMICategory(currentBMI),
    initialWeight: first.weight,
    initialWaist: first.waist,
    weightChangeTotal,
    waistChangeTotal,
    bmiChangeTotal,
    minWeight,
    maxWeight,
    minWaist,
    maxWaist,
    healthyRange: getHealthyWeightRange(heightCm),
    latestDate: latest.date
  };
}

/**
 * Format date for friendly display in Spanish
 * @param {string} dateString 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}
