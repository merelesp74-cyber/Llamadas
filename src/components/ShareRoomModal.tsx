import React, { useState } from 'react';
import { StoreItem } from '../types';
import { QrCode, Copy, Check, Share2, Smartphone, ExternalLink, X } from 'lucide-react';

interface ShareRoomModalProps {
  store: StoreItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ store, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !store) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${currentOrigin}/?mode=branch&storeId=${encodeURIComponent(store.id)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(joinUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fallback
    }
  };

  const whatsappText = encodeURIComponent(
    `Hola, por favor ingresa al enlace para la videollamada de Prevención para la sucursal *${store.name}*:\n${joinUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-2xl p-6 shadow-2xl text-[#1c2430] dark:text-[#e7ebf0]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b7686] hover:text-[#1c2430] dark:hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg">
              Conectar Sucursal {store.name}
            </h3>
            <p className="text-xs text-[#6b7686] dark:text-[#98a3b3]">
              Acceso rápido para smartphone o terminal del local
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#12161c] rounded-xl border border-[#e2e6ec] dark:border-[#2c3440] mb-4">
          <div className="bg-white p-2 rounded-lg shadow-xs">
            <img
              src={qrUrl}
              alt={`QR para ${store.name}`}
              className="w-44 h-44 object-contain"
              loading="lazy"
            />
          </div>
          <span className="text-[11px] text-[#6b7686] dark:text-[#98a3b3] mt-2.5 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" />
            Escanea con la cámara del celular para abrir la videollamada
          </span>
        </div>

        {/* Share Link Input */}
        <div className="space-y-2 mb-5">
          <label className="block text-xs font-semibold text-[#6b7686] dark:text-[#98a3b3]">
            Enlace directo de la sucursal:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 bg-white dark:bg-[#12161c] border border-[#e2e6ec] dark:border-[#2c3440] rounded-lg px-3 py-2 text-xs font-mono text-ellipsis overflow-hidden focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </a>

          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1c2430] dark:text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 border border-[#e2e6ec] dark:border-[#2c3440] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir en otra pestaña</span>
          </a>
        </div>
      </div>
    </div>
  );
};
