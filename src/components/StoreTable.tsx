import React, { useState } from 'react';
import { StoreItem, PresenceInfo } from '../types';
import {
  Video,
  QrCode,
  Trash2,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Radio,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  FlaskConical
} from 'lucide-react';

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

  return (
    <div className="w-full">
      {/* Table Container with horizontal scroll on small screens */}
      <div className="overflow-x-auto bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#161c24] border-b border-[#e2e6ec] dark:border-[#2c3440] text-[11px] uppercase tracking-wider text-[#6b7686] dark:text-[#98a3b3]">
              <th className="py-3 px-3 text-center w-12 font-bold">#</th>
              <th className="py-3 px-3 font-bold">Local / Sucursal</th>
              <th className="py-3 px-3 font-bold min-w-[150px]">Teléfono / Contacto</th>
              <th className="py-3 px-3 text-center font-bold">Llamada</th>
              <th className="py-3 px-3 font-bold">Fecha</th>
              <th className="py-3 px-3 font-bold">Horario</th>
              <th className="py-3 px-3 font-bold">Operador</th>
              <th className="py-3 px-3 font-bold min-w-[240px]">Observaciones y Evidencia</th>
              <th className="py-3 px-3 text-center font-bold min-w-[160px]">Videollamada WebRTC</th>
              <th className="py-3 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e6ec] dark:divide-[#2c3440] text-xs">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-[#6b7686] dark:text-[#98a3b3]">
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
                    <td className="py-3 px-3 text-center text-[#6b7686] dark:text-[#98a3b3] font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Store Name & Online indicator */}
                    <td className="py-3 px-3 font-semibold text-[#1c2430] dark:text-[#e7ebf0]">
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {isJefaturaTest && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                            <FlaskConical className="w-2.5 h-2.5" />
                            <span>Línea Prueba</span>
                          </span>
                        )}
                        {isOnline && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 animate-pulse"
                            title="Sucursal conectada lista para videollamada"
                          >
                            <Radio className="w-2.5 h-2.5" />
                            <span>En línea</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone / Number Column */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Ej: +595 982..."
                          value={s.phone || ''}
                          onChange={(e) => handlePhoneChange(s, e.target.value)}
                          className={`bg-white dark:bg-[#12161c] border rounded-lg px-2 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 w-32 font-mono ${isJefaturaTest ? 'border-blue-400 dark:border-blue-700 font-semibold text-blue-700 dark:text-blue-300' : 'border-[#e2e6ec] dark:border-[#2c3440]'}`}
                        />
                        {s.phone && (
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${s.phone.replace(/[^0-9+]/g, '')}`}
                              className="p-1 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                              title={`Llamar a ${s.phone}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://api.whatsapp.com/send?phone=${s.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Hola, te contacto desde la Jefatura de Prevención para la videollamada de control del local ${s.name}: ${typeof window !== 'undefined' ? window.location.origin : ''}/?mode=branch&storeId=${encodeURIComponent(s.id)}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                              title={`Enviar enlace WebRTC por WhatsApp a ${s.phone}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Pill Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleDone(s)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${s.done ? 'bg-[#e3f6ea] text-[#1a8f4d] dark:bg-[#173524] dark:text-[#4cd488] hover:opacity-85' : 'bg-[#fdf1d8] text-[#b7791f] dark:bg-[#3a2f14] dark:text-[#f0b94d] hover:opacity-85'}`}
                      >
                        {s.done ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Realizada</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendiente</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3">
                      <input
                        type="date"
                        value={s.date || ''}
                        onChange={(e) => handleDateChange(s, e.target.value)}
                        className="bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-2 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3">
                      <input
                        type="time"
                        value={s.hora || ''}
                        onChange={(e) => handleTimeChange(s, e.target.value)}
                        className="bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-2 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 w-24"
                      />
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        placeholder="Operador"
                        value={s.op || ''}
                        onChange={(e) => handleOperatorChange(s, e.target.value)}
                        className="bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-2.5 py-1 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 min-w-[110px]"
                      />
                    </td>

                    {/* Observations & Photo */}
                    <td className="py-3 px-3">
                      <div className="space-y-1.5">
                        <textarea
                          placeholder="Sin observaciones..."
                          value={s.obs || ''}
                          onChange={(e) => handleObsChange(s, e.target.value)}
                          rows={2}
                          className={`w-full bg-white dark:bg-[#12161c] border rounded-lg p-2 text-xs text-[#1c2430] dark:text-[#e7ebf0] focus:ring-1 focus:ring-blue-500 resize-y min-h-[38px] ${hasObs ? 'border-purple-300 dark:border-purple-800' : 'border-[#e2e6ec] dark:border-[#2c3440]'}`}
                        />

                        {/* Photo attachment & thumbnail */}
                        <div className="flex items-center gap-2">
                          {s.foto ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(s.foto!)}
                                className="relative group block rounded-md overflow-hidden border border-[#e2e6ec] dark:border-[#2c3440]"
                                title="Ver foto ampliada"
                              >
                                <img
                                  src={s.foto}
                                  alt={`Foto ${s.name}`}
                                  className="w-10 h-10 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                              <button
                                onClick={() => handleRemovePhoto(s)}
                                className="text-red-500 hover:text-red-700 text-[11px] p-1"
                                title="Eliminar foto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-[#e2e6ec] dark:border-[#2c3440] hover:border-blue-400 text-[11px] text-[#1f6feb] dark:text-[#5aa2ff] transition-colors">
                              <Camera className="w-3 h-3" />
                              <span>Adjuntar foto</span>
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

                    {/* WebRTC Video Call Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onStartVideoCall(s)}
                          className={`px-3 py-1.5 rounded-lg text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${isOnline ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20 ring-2 ring-emerald-400/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-700/20'}`}
                          title={`Iniciar videollamada WebRTC con ${s.name}`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Llamar</span>
                        </button>

                        <button
                          onClick={() => onOpenShareModal(s)}
                          className="p-1.5 rounded-lg border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] text-[#6b7686] dark:text-[#98a3b3] transition-colors"
                          title="Compartir enlace o código QR con la sucursal"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Delete Row */}
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el local "${s.name}"?`)) {
                            onDeleteStore(s.id);
                          }
                        }}
                        className="text-[#6b7686] hover:text-red-500 p-1 transition-colors"
                        title="Eliminar local"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Photo Preview Lightbox Modal */}
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
              alt="Foto ampliada"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
