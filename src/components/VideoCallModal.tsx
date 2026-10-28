import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Camera,
  RotateCcw,
  MonitorUp,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Volume2
} from 'lucide-react';
import { ChatMessage, StoreItem } from '../types';

interface VideoCallModalProps {
  isOpen: boolean;
  storeName: string;
  storeId?: string;
  peerName: string;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
  callDuration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  audioLevel: number;
  isTestMode?: boolean;
  chatMessages: ChatMessage[];
  currentOperator: string;
  facingMode?: 'user' | 'environment';
  onEndCall: (updatedNotes?: string, capturedPhoto?: string) => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onFlipCamera: () => void;
  onToggleScreenShare: () => void;
  onCaptureSnapshot: (videoEl: HTMLVideoElement | null) => string | null;
  onSendChatMessage: (text: string) => void;
  currentStore?: StoreItem;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  storeName,
  peerName,
  callStatus,
  callDuration,
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  audioLevel,
  isTestMode,
  chatMessages,
  currentOperator,
  facingMode = 'user',
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onFlipCamera,
  onToggleScreenShare,
  onCaptureSnapshot,
  onSendChatMessage,
  currentStore
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [notes, setNotes] = useState(currentStore?.obs || '');
  const [chatInput, setChatInput] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(currentStore?.foto || null);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [hasMobileCam, setHasMobileCam] = useState(false);

  // Sync video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isOpen]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isOpen]);

  // Update notes if currentStore changes
  useEffect(() => {
    if (currentStore) {
      setNotes(currentStore.obs || '');
      setCapturedPhoto(currentStore.foto || null);
    }
  }, [currentStore]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // Check if camera can flip
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMobileCam(videoDevices.length > 1);
      });
    }
  }, []);

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCapture = () => {
    // Choose remote video if available, else local video
    const targetVideo = (remoteStream && remoteVideoRef.current) ? remoteVideoRef.current : localVideoRef.current;
    const photo = onCaptureSnapshot(targetVideo);
    if (photo) {
      setCapturedPhoto(photo);
      setSnapshotFlash(true);
      setTimeout(() => setSnapshotFlash(false), 300);
    }
  };

  const handleFinishCall = () => {
    onEndCall(notes, capturedPhoto || undefined);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChatMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Snapshot Flash Overlay */}
      {snapshotFlash && (
        <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none transition-opacity duration-300 animate-out fade-out" />
      )}

      <div className={`relative w-full h-full max-w-6xl flex flex-col bg-[#0f141c] text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all ${isFullscreen ? 'max-w-none rounded-none' : 'max-h-[95vh]'}`}>
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#161c26]/90 border-b border-slate-800 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className={`w-3 h-3 rounded-full block ${callStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-white leading-tight">
                  {storeName}
                </h3>
                {isTestMode && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-full">
                    MODO PRUEBA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>WebRTC P2P</span>
                <span>•</span>
                <span>Operador: <strong className="text-slate-200">{currentOperator || 'Jefatura'}</strong></span>
                <span>•</span>
                <span>Conexión: <strong className="text-slate-200">{peerName || 'Sucursal'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Call Timer */}
            <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700/60 font-mono text-xs sm:text-sm font-semibold tracking-wider flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>{callStatus === 'calling' ? 'Llamando...' : formatDuration(callDuration)}</span>
            </div>

            {/* Quick Panel Toggles */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${showNotes ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Panel de observaciones de la llamada"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Novedades</span>
            </button>

            <button
              onClick={() => setShowChat(!showChat)}
              className={`relative p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${showChat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Chat en vivo"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
              title="Pantalla completa"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Video Area + Drawers */}
        <div className="relative flex-1 bg-black flex overflow-hidden">
          
          {/* Main Remote Video Screen */}
          <div className="relative flex-1 w-full h-full bg-[#090c10] flex items-center justify-center overflow-hidden">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                <div className="w-24 h-24 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center mb-4 relative">
                  <VideoIcon className="w-10 h-10 text-slate-400" />
                  {callStatus === 'calling' && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75" />
                  )}
                </div>
                <h4 className="text-lg font-semibold text-slate-200 mb-1">
                  {callStatus === 'calling' ? `Llamando a ${storeName}...` : 'Esperando transmisión de la sucursal'}
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  {callStatus === 'calling'
                    ? 'Esperando a que el encargado atienda la llamada en su dispositivo.'
                    : 'La conexión WebRTC está lista. En cuanto la otra parte encienda su cámara o comparta video, aparecerá aquí.'}
                </p>
                {isTestMode && (
                  <div className="px-3 py-2 bg-blue-900/40 border border-blue-500/30 rounded-lg text-xs text-blue-200">
                    💡 Modo de prueba: Puedes verificar tu cámara en la esquina inferior y presionar 📸 <strong>Capturar Foto</strong> para probar la evidencia.
                  </div>
                )}
              </div>
            )}

            {/* Local Video Thumbnail (Picture in Picture) */}
            <div className="absolute bottom-4 right-4 z-30 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl transition-transform hover:scale-105 group">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              ) : null}

              {(!localStream || isVideoMuted) && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                  <VideoOff className="w-6 h-6 mb-1 opacity-70" />
                  <span className="text-[10px]">Cámara apagada</span>
                </div>
              )}

              {/* Local Audio Activity Indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-slate-200">
                <Volume2 className={`w-3 h-3 ${audioLevel > 15 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="font-mono text-[9px]">{audioLevel}%</span>
              </div>

              <div className="absolute bottom-1 right-2 text-[9px] bg-black/60 px-1 rounded text-slate-300">
                Tú ({currentOperator || 'Operador'})
              </div>
            </div>

            {/* Quality & Security Watermark */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
              <span className="bg-black/50 backdrop-blur-xs border border-white/10 text-[11px] px-2 py-0.5 rounded-md text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HD 720p • WebRTC Direct
              </span>
            </div>
          </div>

          {/* Side Drawer: Quick Observations & Evidence */}
          {showNotes && (
            <div className="w-72 sm:w-80 bg-[#161c26] border-l border-slate-800 flex flex-col z-20 transition-all">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#131720]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Registro de Novedades
                </h4>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-3.5 flex-1 overflow-y-auto space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Operador responsable:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentOperator || 'Jefatura de Prevención'}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Observaciones y Hallazgos:
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribe novedades, estado de góndolas, control de caja, stock, seguridad..."
                    rows={4}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Evidence Photo */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                    <span>Evidencia Fotográfica:</span>
                    {capturedPhoto && (
                      <button
                        onClick={() => setCapturedPhoto(null)}
                        className="text-red-400 hover:text-red-300 text-[10px]"
                      >
                        Quitar foto
                      </button>
                    )}
                  </label>

                  {capturedPhoto ? (
                    <div className="relative rounded-lg overflow-hidden border border-emerald-500/50 bg-black group">
                      <img
                        src={capturedPhoto}
                        alt="Evidencia capturada"
                        className="w-full h-36 object-cover"
                      />
                      <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-emerald-300 font-mono">
                        ✓ Foto capturada
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-700 rounded-lg text-center bg-[#0d1117]">
                      <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400">
                        Presiona el botón de la cámara abajo para capturar un fotograma de la videollamada.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCapture}
                    className="w-full mt-2 py-2 px-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Capturar Fotograma Ahora
                  </button>
                </div>
              </div>

              <div className="p-3 border-t border-slate-800 bg-[#131720]">
                <button
                  onClick={handleFinishCall}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar Reporte y Finalizar
                </button>
              </div>
            </div>
          )}

          {/* Side Drawer: In-Call Live Chat */}
          {showChat && (
            <div className="w-72 sm:w-80 bg-[#161c26] border-l border-slate-800 flex flex-col z-20">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#131720]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Chat de la Videollamada
                </h4>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No hay mensajes en este chat. Escribe algo abajo para comunicarte por texto.
                  </p>
                ) : (
                  chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-lg max-w-[85%] ${m.senderName === currentOperator ? 'bg-blue-600 text-white ml-auto' : 'bg-slate-800 text-slate-200'}`}
                    >
                      <div className="text-[10px] opacity-75 font-semibold mb-0.5">
                        {m.senderName}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="p-2 border-t border-slate-800 bg-[#131720] flex gap-1.5">
                <input
                  type="text"
                  placeholder="Escribir mensaje..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#0d1117] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Dock */}
        <div className="px-4 py-3 bg-[#131720] border-t border-slate-800/80 flex items-center justify-center gap-2 sm:gap-4 z-20">
          {/* Mute Mic */}
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-all active:scale-95 ${isAudioMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}
            title={isAudioMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video Camera */}
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-all active:scale-95 ${isVideoMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}
            title={isVideoMuted ? 'Encender cámara' : 'Apagar cámara'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Flip Camera (if mobile or multi-cam) */}
          {hasMobileCam && (
            <button
              onClick={onFlipCamera}
              className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95"
              title="Cambiar entre cámara frontal y trasera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full transition-all active:scale-95 ${isScreenSharing ? 'bg-purple-600 text-white border border-purple-400' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}
            title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla'}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* 📸 Snapshot Evidence Button */}
          <button
            onClick={handleCapture}
            className="p-3 rounded-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg transition-all active:scale-90"
            title="Capturar foto de evidencia de la videollamada"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Hangup Call Button */}
          <button
            onClick={handleFinishCall}
            className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all active:scale-95"
            title="Finalizar videollamada"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline text-xs">Finalizar Llamada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
