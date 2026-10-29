import React, { useState, useEffect, useRef } from 'react';
import { StoreItem } from '../types';
import {
  Video,
  Mic,
  MicOff,
  RotateCcw,
  Store,
  PhoneCall,
  CheckCircle,
  ShieldAlert,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { UseWebRTCOptions } from '../hooks/useWebRTC';
import { PWAInstallButton } from './PWAInstallButton';

interface BranchModeViewProps {
  store: StoreItem;
  allStores: StoreItem[];
  onSelectStore: (store: StoreItem) => void;
  onExitBranchMode: () => void;
  webRTC: ReturnType<typeof import('../hooks/useWebRTC').useWebRTC>;
  onStartCallWithJefatura: () => void;
}

export const BranchModeView: React.FC<BranchModeViewProps> = ({
  store,
  allStores,
  onSelectStore,
  onExitBranchMode,
  webRTC,
  onStartCallWithJefatura
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Turn on preview camera for branch
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let isCancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: webRTC.facingMode },
        audio: true
      })
      .then((stream) => {
        if (!isCancelled) {
          localStream = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            setCameraActive(true);
          }
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      })
      .catch((e) => {
        console.warn('Camera preview not available yet:', e);
      });

    return () => {
      isCancelled = true;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [webRTC.facingMode]);

  return (
    <div className="min-h-screen bg-[#0f141c] text-white flex flex-col justify-between p-4 sm:p-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onExitBranchMode}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              WebRTC Listo
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md w-full mx-auto my-auto py-6 flex flex-col items-center text-center">
        
        {/* Store Identifier Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
          <img src="/icon.svg" alt="Prevención Nocturno" className="w-4 h-4 rounded-full" />
          <span>Prevención Nocturno • Terminal de Local</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">
          {store.name}
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
          Terminal de videollamadas conectada para inspección y control de guardia nocturna.
        </p>

        {/* Change Store Selector */}
        <div className="w-full mb-6">
          <label className="block text-[11px] text-slate-400 font-medium mb-1.5 text-left">
            Cambiar sucursal activa:
          </label>
          <select
            value={store.id}
            onChange={(e) => {
              const selected = allStores.find((s) => s.id === e.target.value);
              if (selected) onSelectStore(selected);
            }}
            className="w-full bg-[#1b212a] border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.done ? '✓ (Llamada realizada)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Live Camera Preview Card */}
        <div className="w-full relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl mb-6">
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${webRTC.facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4">
              <Camera className="w-8 h-8 mb-2 opacity-60" />
              <p className="text-xs">Cámara en espera o sin permisos</p>
            </div>
          )}

          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vista previa local
          </div>

          {/* Flip camera button for mobile / store device */}
          <button
            onClick={webRTC.flipCamera}
            className="absolute bottom-3 right-3 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 shadow-lg active:scale-95 transition-all"
            title="Cambiar a cámara trasera o frontal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Call Jefatura */}
        <button
          onClick={onStartCallWithJefatura}
          className="w-full py-3.5 px-6 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-950/50 transition-all active:scale-95 mb-3"
        >
          <PhoneCall className="w-5 h-5 animate-pulse" />
          <span>Iniciar Videollamada con Prevención Nocturno</span>
        </button>

        <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-left text-xs text-slate-300 w-full space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Esperando llamadas entrantes</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Mantén esta pantalla abierta. Si Jefatura de Prevención te llama, sonará el timbre y podrás responder con un toque.
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
        <p className="font-semibold">
          Copyright © 2026 - Desarrollado por Pedro M.
        </p>
      </footer>
    </div>
  );
};
