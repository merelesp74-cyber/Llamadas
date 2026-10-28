import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { createAudioLevelMeter, playConnectedTone } from '../utils/audioEffects';

interface DeviceTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLoopbackTest: () => void;
}

export const DeviceTestModal: React.FC<DeviceTestModalProps> = ({
  isOpen,
  onClose,
  onStartLoopbackTest
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;
    let cleanupMeter: (() => void) | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        activeStream = s;
        setStream(s);
        setCameraOk(s.getVideoTracks().length > 0);
        setMicOk(s.getAudioTracks().length > 0);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        cleanupMeter = createAudioLevelMeter(s, (lvl) => setMicLevel(lvl));
      })
      .catch((err) => {
        setErrorMsg('Permisos de cámara o micrófono bloqueados. Por favor permite el acceso en el navegador.');
        console.warn('Media devices test failed:', err);
      });

    return () => {
      if (cleanupMeter) cleanupMeter();
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1b212a] border border-[#e2e6ec] dark:border-[#2c3440] rounded-2xl p-6 shadow-2xl text-[#1c2430] dark:text-[#e7ebf0]">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b7686] hover:text-[#1c2430] dark:hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          <span>Diagnóstico de Dispositivos WebRTC</span>
        </h3>
        <p className="text-xs text-[#6b7686] dark:text-[#98a3b3] mb-4">
          Comprueba que tu cámara y micrófono funcionan antes de llamar a los locales.
        </p>

        {errorMsg ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 mb-4 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 font-mono">
            <span className={`w-2 h-2 rounded-full ${cameraOk ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{cameraOk ? 'Cámara activa' : 'Buscando cámara'}</span>
          </div>
        </div>

        {/* Mic Level Visualizer */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Mic className="w-4 h-4 text-emerald-500" />
              <span>Nivel del Micrófono (Habla para probar):</span>
            </span>
            <span className="font-mono text-[11px] text-[#6b7686] dark:text-[#98a3b3]">
              {micLevel}%
            </span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-75"
              style={{ width: `${Math.min(100, micLevel * 1.5)}%` }}
            />
          </div>
        </div>

        {/* Sound Output Test */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#12161c] rounded-xl border border-[#e2e6ec] dark:border-[#2c3440] mb-5">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium">Probar altavoz / auriculares</span>
          </div>
          <button
            onClick={playConnectedTone}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Reproducir Tono
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#e2e6ec] dark:border-[#2c3440] hover:bg-slate-100 dark:hover:bg-[#2c3440] rounded-xl text-xs font-semibold text-[#1c2430] dark:text-white"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              onStartLoopbackTest();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span>Iniciar Auto-Prueba de Llamada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
