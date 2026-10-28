import React, { useState } from 'react';
import { CallHistoryItem } from '../types';
import { Calendar, Download, Eye, FileSpreadsheet, X } from 'lucide-react';

interface HistorySectionProps {
  history: CallHistoryItem[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history }) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter history by selected month
  const filteredHistory = history
    .filter((h) => !selectedMonth || (h.date || '').startsWith(selectedMonth))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.hora || '').localeCompare(a.hora || ''));

  const distinctDays = new Set(filteredHistory.map((h) => h.date)).size;

  const formatDate = (isoStr: string) => {
    if (!isoStr || !isoStr.includes('-')) return isoStr;
    const parts = isoStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleExportCSV = () => {
    const quote = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headers = ['Fecha', 'Horario', 'Local', 'Teléfono', 'Operador', 'Observaciones', 'Tiene Foto'];
    const rows = filteredHistory.map((h) => [
      formatDate(h.date),
      h.hora || '',
      quote(h.storeName),
      quote(h.phone || ''),
      quote(h.op),
      quote(h.obs),
      h.foto ? 'SI' : 'NO'
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historial_llamadas_${selectedMonth || 'todos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 pt-6 border-t border-[#e2e6ec] dark:border-[#2c3440]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#1c2430] dark:text-[#e7ebf0] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Historial de Videollamadas y Registros
          </h2>
          <p className="text-xs text-[#6b7686] dark:text-[#98a3b3]">
            {filteredHistory.length} llamadas registradas en {distinctDays} día(s) del mes seleccionado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-2.5 py-1.5 text-xs text-[#1c2430] dark:text-[#e7ebf0]"
          />
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] text-xs font-medium text-[#1c2430] dark:text-[#e7ebf0] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse min-w-[700px] text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#161c24] border-b border-[#e2e6ec] dark:border-[#2c3440] text-[11px] uppercase tracking-wider text-[#6b7686] dark:text-[#98a3b3]">
              <th className="py-2.5 px-3 font-semibold">Fecha</th>
              <th className="py-2.5 px-3 font-semibold">Horario</th>
              <th className="py-2.5 px-3 font-semibold">Local</th>
              <th className="py-2.5 px-3 font-semibold">Teléfono</th>
              <th className="py-2.5 px-3 font-semibold">Operador</th>
              <th className="py-2.5 px-3 font-semibold">Observaciones</th>
              <th className="py-2.5 px-3 text-center font-semibold w-20">Evidencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e6ec] dark:divide-[#2c3440]">
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#6b7686] dark:text-[#98a3b3]">
                  Sin registros archivados en este período.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202732]">
                  <td className="py-2.5 px-3 font-medium text-[#1c2430] dark:text-[#e7ebf0]">
                    {formatDate(item.date)}
                  </td>
                  <td className="py-2.5 px-3 text-[#6b7686] dark:text-[#98a3b3] font-mono">
                    {item.hora || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#1c2430] dark:text-[#e7ebf0]">
                    {item.storeName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#6b7686] dark:text-[#98a3b3]">
                    {item.phone || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#1c2430] dark:text-[#e7ebf0]">
                    {item.op || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#6b7686] dark:text-[#98a3b3] max-w-xs truncate">
                    {item.obs || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.foto ? (
                      <button
                        onClick={() => setSelectedPhoto(item.foto!)}
                        className="inline-block rounded overflow-hidden border border-slate-300 dark:border-slate-700 hover:ring-2 hover:ring-blue-400"
                      >
                        <img
                          src={item.foto}
                          alt="Evidencia"
                          className="w-8 h-8 object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Foto ampliada del historial"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
