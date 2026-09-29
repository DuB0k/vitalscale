import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'success', message } = toast;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-teal-400 shrink-0" />
  };

  const bgStyles = {
    success: 'bg-slate-900/95 border-emerald-500/40 text-emerald-200',
    error: 'bg-slate-900/95 border-rose-500/40 text-rose-200',
    info: 'bg-slate-900/95 border-teal-500/40 text-teal-200'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-in max-w-sm">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${bgStyles[type] || bgStyles.info}`}>
        {icons[type]}
        <span className="text-xs font-medium text-slate-100">{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors ml-auto"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
