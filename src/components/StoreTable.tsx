import React, { useState } from 'react';
import { StoreItem, PresenceInfo } from '../types';
import {
  PhoneCall,
  QrCode,
  Trash2,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Radio,
  FlaskConical
} from 'lucide-react';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.79 14.07c-.24.68-1.22 1.26-1.74 1.34-.48.08-1.08.11-3.48-.86-2.5-1.02-4.11-3.56-4.23-3.73-.13-.17-1.01-1.35-1.01-2.58 0-1.22.64-1.83.87-2.07.24-.25.52-.31.69-.31.18 0 .36 0 .52.01.17.01.4.06.61.57.24.57.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.31.4-.44.54-.15.15-.31.31-.13.62.18.31.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.19-.21.79-.92 1-1.24.21-.31.43-.26.71-.16.29.1 1.83.86 2.14 1.02.32.15.53.23.61.36.08.14.08.79-.16 1.47z" />
  </svg>
);

interface StoreTableProps {
  stores: StoreItem[];
  presence: PresenceInfo;
  onUpdateStore: (store: StoreItem) => void;
  onDeleteStore: (id: string) => void;
  onStartVideoCall: (store: StoreItem) => void;
  onOpenShareModal: (store: StoreItem) => void;
  currentOperator: string;
}

export const StoreTable: React.FC<StoreTableProps> = ({
  stores,
  presence,
  onUpdateStore,
  onDeleteStore,
  onStartVideoCall,
  onOpenShareModal,
  currentOperator
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const todayStr = () => new Date().toISOString().split('T')[0];
  const nowTimeStr = () => new Date().toTimeString().slice(0, 5);

  const handlePhoneChange = (store: StoreItem, phone: string) => {
    onUpdateStore({
      ...store,
      phone
    });
  };

  const handleToggleDone = (store: StoreItem) => {
    const nextDone = !store.done;
    onUpdateStore({
      ...store,
      done: nextDone,
      date: nextDone ? store.date || todayStr() : '',
      hora: nextDone ? store.hora || nowTimeStr() : '',
      op: nextDone ? store.op || currentOperator : ''
    });
  };

  const handleDateChange = (store: StoreItem, date: string) => {
    onUpdateStore({
      ...store,
      date,
      done: !!date,
      hora: date && !store.hora ? nowTimeStr() : store.hora,
      op: date && !store.op ? currentOperator : store.op
    });
  };

  const handleTimeChange = (store: StoreItem, hora: string) => {
    onUpdateStore({
      ...store,
      hora,
      done: !!hora || store.done
    });
  };

  const handleOperatorChange = (store: StoreItem, op: string) => {
    const trimmed = op.trim();
    onUpdateStore({
      ...store,
      op,
      done: !!trimmed || store.done,
      date: trimmed && !store.date ? todayStr() : store.date,
      hora: trimmed && !store.hora ? nowTimeStr() : store.hora
    });
  };

  const handleObsChange = (store: StoreItem, obs: string) => {
    onUpdateStore({
      ...store,
      obs
    });
  };

  const handleFileUpload = (store: StoreItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let scale = 1;
        if (img.width > maxDim || img.height > maxDim) {
          scale = maxDim / Math.max(img.width, img.height);
        }
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          onUpdateStore({
            ...store,
            foto: compressed
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (store: StoreItem) => {
    onUpdateStore({
      ...store,
      foto: ''
    });
  };

  const getWhatsAppUrl = (store: StoreItem) => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const joinUrl = `${currentOrigin}/?mode=branch&storeId=${encodeURIComponent(store.id)}`;
    const text = encodeURIComponent(
      `Hola, te contacto desde Prevención Nocturno para la llamada de control del local *${store.name}*.\nEnlace directo: ${joinUrl}`
    );
    const cleanPhone = (store.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
    }
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  return (
    <div className="w-full">
      {/* Table Container fits in one sheet horizontally without cut-off */}
      <div className="overflow-x-auto bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#161c24] border-b border-[#e2e6ec] dark:border-[#2c3440] text-[11px] uppercase tracking-wider text-[#6b7686] dark:text-[#98a3b3]">
              <th className="py-2.5 px-2 text-center w-8 font-bold">#</th>
              <th className="py-2.5 px-2.5 font-bold min-w-[140px] max-w-[200px]">Local / Sucursal</th>
              <th className="py-2.5 px-2 font-bold w-28">Teléfono</th>
              <th className="py-2.5 px-1.5 text-center font-bold w-11" title="Mensaje WhatsApp">WhatsApp</th>
              <th className="py-2.5 px-1.5 text-center font-bold w-11" title="Llamada WebRTC">Llamada</th>
              <th className="py-2.5 px-2 text-center font-bold w-24">Estado</th>
              <th className="py-2.5 px-2 font-bold w-28">Fecha</th>
              <th className="py-2.5 px-2 font-bold w-20">Horario</th>
              <th className="py-2.5 px-2 font-bold w-24">Operador</th>
              <th className="py-2.5 px-2.5 font-bold min-w-[140px]">Observaciones y Evidencia</th>
              <th className="py-2.5 px-1.5 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e6ec] dark:divide-[#2c3440]">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-[#6b7686] dark:text-[#98a3b3]">
                  No se encontraron locales. Pega nombres arriba para agregar.
                </td>
              </tr>
            ) : (
              stores.map((s, index) => {
                const isOnline = !!presence.branchesOnline?.[s.id];
                const hasObs = s.obs && s.obs.trim().length > 0;
                const isJefaturaTest = s.id === 'store-0-jefatura-prueba' || s.name.toUpperCase().includes('JEFATURA');

                return (
                  <tr
                    key={s.id}
                    className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-[#202732] ${isJefaturaTest ? 'bg-blue-50/40 dark:bg-blue-950/20' : hasObs ? 'bg-purple-50/30 dark:bg-[#231b33]/40' : ''}`}
                  >
                    {/* Index */}
                    <td className="py-2 px-2 text-center text-[#6b7686] dark:text-[#98a3b3] font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Store Name & Online indicator */}
                    <td className="py-2 px-2.5 font-semibold text-[#1c2430] dark:text-[#e7ebf0]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[170px]" title={s.name}>
                          {s.name}
                        </span>
                        {isJefaturaTest && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                            <FlaskConical className="w-2.5 h-2.5" />
                            <span>Prueba</span>
                          </span>
                        )}
                        {isOnline && (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 animate-pulse"
                            title="Sucursal conectada lista para llamada"
                          >
                            <Radio className="w-2 h-2" />
                            <span>En línea</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone / Number Column */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Ej: +595..."
                        value={s.phone || ''}
                        onChange={(e) => handlePhoneChange(s, e.target.value)}
                        className={`w-full bg-white dark:bg-[#12161c] border rounded-md px-1.5 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 font-mono ${isJefaturaTest ? 'border-blue-400 dark:border-blue-700 font-semibold text-blue-700 dark:text-blue-300' : 'border-[#e2e6ec] dark:border-[#2c3440]'}`}
                      />
                    </td>

                    {/* WhatsApp Icon Button */}
                    <td className="py-2 px-1.5 text-center">
                      <a
                        href={getWhatsAppUrl(s)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all shadow-2xs active:scale-95"
                        title={`Enviar mensaje de WhatsApp a ${s.name} ${s.phone ? `(${s.phone})` : ''}`}
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </a>
                    </td>

                    {/* Call Icon Button */}
                    <td className="py-2 px-1.5 text-center">
                      <button
                        onClick={() => onStartVideoCall(s)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white transition-all shadow-xs active:scale-95 ${isOnline ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400/50 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'}`}
                        title={`Iniciar llamada con ${s.name}`}
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Status Pill Toggle */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleToggleDone(s)}
                        className={`inline-flex items-center justify-center gap-1 w-full px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${s.done ? 'bg-[#e3f6ea] text-[#1a8f4d] dark:bg-[#173524] dark:text-[#4cd488] hover:opacity-85' : 'bg-[#fdf1d8] text-[#b7791f] dark:bg-[#3a2f14] dark:text-[#f0b94d] hover:opacity-85'}`}
                      >
                        {s.done ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>✓ Realizada</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Pendiente</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-2 px-2">
                      <input
                        type="date"
                        value={s.date || ''}
                        onChange={(e) => handleDateChange(s, e.target.value)}
                        className="w-full bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-md px-1.5 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Time */}
                    <td className="py-2 px-2">
                      <input
                        type="time"
                        value={s.hora || ''}
                        onChange={(e) => handleTimeChange(s, e.target.value)}
                        className="w-full bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-md px-1.5 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Operator */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Operador"
                        value={s.op || ''}
                        onChange={(e) => handleOperatorChange(s, e.target.value)}
                        className="w-full bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-md px-1.5 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Observations & Photo */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Sin observaciones..."
                          value={s.obs || ''}
                          onChange={(e) => handleObsChange(s, e.target.value)}
                          className={`flex-1 bg-white dark:bg-[#12161c] border rounded-md px-2 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 ${hasObs ? 'border-purple-300 dark:border-purple-800' : 'border-[#e2e6ec] dark:border-[#2c3440]'}`}
                        />

                        {/* Photo attachment & thumbnail */}
                        <div className="shrink-0">
                          {s.foto ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(s.foto!)}
                                className="relative group block rounded overflow-hidden border border-[#e2e6ec] dark:border-[#2c3440]"
                                title="Ver foto ampliada"
                              >
                                <img
                                  src={s.foto}
                                  alt={`Foto ${s.name}`}
                                  className="w-7 h-7 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3 h-3" />
                                </div>
                              </button>
                              <button
                                onClick={() => handleRemovePhoto(s)}
                                className="text-red-500 hover:text-red-700 text-[10px] p-0.5"
                                title="Eliminar foto"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center justify-center w-7 h-7 rounded border border-dashed border-[#e2e6ec] dark:border-[#2c3440] hover:border-blue-400 text-[#1f6feb] dark:text-[#5aa2ff] transition-colors" title="Adjuntar foto">
                              <Camera className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(s, e)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions: QR & Delete */}
                    <td className="py-2 px-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenShareModal(s)}
                          className="p-1.5 rounded-lg border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] text-[#6b7686] dark:text-[#98a3b3] transition-colors"
                          title="Compartir enlace o código QR con el local"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar local "${s.name}"?`)) {
                              onDeleteStore(s.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Eliminar local"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Enlarged Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/90 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Evidencia ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
