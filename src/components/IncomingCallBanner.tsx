import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { IncomingCallData } from '../hooks/useWebRTC';

interface IncomingCallBannerProps {
  incomingCall: IncomingCallData | null;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  incomingCall,
  onAccept,
  onReject
}) => {
  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#1b212a] border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center animate-bounce">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
              <span>Videollamada Entrante</span>
            </div>
            <h4 className="font-bold text-base text-white leading-tight">
              {incomingCall.storeName || incomingCall.callerName}
            </h4>
            <p className="text-xs text-slate-300">
              Solicitud de conexión WebRTC en vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="p-3 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-all active:scale-95 shadow-md"
            title="Rechazar llamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-950/50"
            title="Atender llamada"
          >
            <Phone className="w-4 h-4" />
            <span className="text-xs">Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
};
